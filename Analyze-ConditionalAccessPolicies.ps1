#Requires -Modules Microsoft.Graph.Authentication, Microsoft.Graph.Identity.SignIns

<#
.SYNOPSIS
    Comprehensive Conditional Access Policy Analyzer

.DESCRIPTION
    This script analyzes Microsoft Entra ID Conditional Access Policies to:
    - Identify unnecessary or duplicate policies
    - Analyze security posture and gaps
    - Export results in multiple formats (CSV, JSON, HTML)
    - Provide actionable recommendations

.PARAMETER ExportPath
    Path where analysis results will be exported (default: current directory)

.PARAMETER ExportFormat
    Export format: CSV, JSON, HTML, or All (default: All)

.PARAMETER IncludeDisabled
    Include disabled policies in analysis (default: true)

.PARAMETER GenerateReport
    Generate an HTML report with visualizations (default: true)

.EXAMPLE
    .\Analyze-ConditionalAccessPolicies.ps1
    
.EXAMPLE
    .\Analyze-ConditionalAccessPolicies.ps1 -ExportPath "C:\Reports" -ExportFormat "HTML"

.NOTES
    Author: Conditional Access Analyzer
    Requires: Microsoft.Graph.Authentication, Microsoft.Graph.Identity.SignIns modules
    Permissions: Policy.Read.All, Directory.Read.All
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ExportPath = (Get-Location).Path,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("CSV", "JSON", "HTML", "All")]
    [string]$ExportFormat = "All",
    
    [Parameter(Mandatory = $false)]
    [bool]$IncludeDisabled = $true,
    
    [Parameter(Mandatory = $false)]
    [bool]$GenerateReport = $true
)

# Global variables
$script:Policies = @()
$script:Analysis = @{
    TotalPolicies = 0
    EnabledPolicies = 0
    DisabledPolicies = 0
    ReportOnlyPolicies = 0
    DuplicatePolicies = @()
    UnnecessaryPolicies = @()
    SecurityScore = 0
    Recommendations = @()
    RiskAssessment = @{
        High = @()
        Medium = @()
        Low = @()
    }
}

function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Connect-ToMicrosoftGraph {
    Write-Header "Microsoft Graph Authentication"
    
    try {
        # Check if already connected
        $context = Get-MgContext
        if ($context) {
            Write-Status "Already connected to Microsoft Graph as $($context.Account)" "SUCCESS"
            return $true
        }
        
        Write-Status "Connecting to Microsoft Graph..."
        
        # Required scopes for Conditional Access analysis
        $scopes = @(
            "Policy.Read.All",
            "Directory.Read.All"
        )
        
        Connect-MgGraph -Scopes $scopes -NoWelcome
        
        $context = Get-MgContext
        if ($context) {
            Write-Status "Successfully connected as $($context.Account)" "SUCCESS"
            return $true
        }
        else {
            Write-Status "Failed to connect to Microsoft Graph" "ERROR"
            return $false
        }
    }
    catch {
        Write-Status "Error connecting to Microsoft Graph: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Get-ConditionalAccessPolicies {
    Write-Header "Retrieving Conditional Access Policies"
    
    try {
        Write-Status "Fetching all Conditional Access Policies..."
        
        $policies = Get-MgIdentityConditionalAccessPolicy -All
        
        if (!$IncludeDisabled) {
            $policies = $policies | Where-Object { $_.State -ne "disabled" }
        }
        
        $script:Policies = $policies
        $script:Analysis.TotalPolicies = $policies.Count
        $script:Analysis.EnabledPolicies = ($policies | Where-Object { $_.State -eq "enabled" }).Count
        $script:Analysis.DisabledPolicies = ($policies | Where-Object { $_.State -eq "disabled" }).Count
        $script:Analysis.ReportOnlyPolicies = ($policies | Where-Object { $_.State -eq "enabledForReportingButNotEnforced" }).Count
        
        Write-Status "Retrieved $($policies.Count) policies" "SUCCESS"
        Write-Status "  - Enabled: $($script:Analysis.EnabledPolicies)"
        Write-Status "  - Disabled: $($script:Analysis.DisabledPolicies)"
        Write-Status "  - Report Only: $($script:Analysis.ReportOnlyPolicies)"
        
        return $true
    }
    catch {
        Write-Status "Error retrieving policies: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Find-DuplicatePolicies {
    Write-Header "Analyzing for Duplicate Policies"
    
    $duplicates = @()
    $processedPolicies = @()
    
    foreach ($policy in $script:Policies) {
        $similar = @()
        
        foreach ($comparePolicy in $script:Policies) {
            if ($policy.Id -eq $comparePolicy.Id -or $comparePolicy.Id -in $processedPolicies) {
                continue
            }
            
            $similarity = Compare-PolicyConfiguration $policy $comparePolicy
            
            if ($similarity -ge 80) {  # 80% similarity threshold
                $similar += @{
                    Policy = $comparePolicy
                    Similarity = $similarity
                }
            }
        }
        
        if ($similar.Count -gt 0) {
            $duplicates += @{
                MainPolicy = $policy
                SimilarPolicies = $similar
            }
        }
        
        $processedPolicies += $policy.Id
    }
    
    $script:Analysis.DuplicatePolicies = $duplicates
    
    Write-Status "Found $($duplicates.Count) groups of potentially duplicate policies" $(if ($duplicates.Count -gt 0) { "WARNING" } else { "SUCCESS" })
    
    foreach ($group in $duplicates) {
        Write-Status "  - '$($group.MainPolicy.DisplayName)' similar to:" "WARNING"
        foreach ($similar in $group.SimilarPolicies) {
            Write-Status "    * '$($similar.Policy.DisplayName)' ($($similar.Similarity)% similar)"
        }
    }
}

function Compare-PolicyConfiguration {
    param($Policy1, $Policy2)
    
    $score = 0
    $maxScore = 0
    
    # Compare conditions
    $maxScore += 30
    if ($Policy1.Conditions -and $Policy2.Conditions) {
        # Applications
        if (Compare-ArraySimilarity $Policy1.Conditions.Applications.IncludeApplications $Policy2.Conditions.Applications.IncludeApplications) {
            $score += 10
        }
        
        # Users
        if (Compare-ArraySimilarity $Policy1.Conditions.Users.IncludeUsers $Policy2.Conditions.Users.IncludeUsers) {
            $score += 10
        }
        
        # Locations
        if (Compare-ArraySimilarity $Policy1.Conditions.Locations.IncludeLocations $Policy2.Conditions.Locations.IncludeLocations) {
            $score += 10
        }
    }
    
    # Compare grant controls
    $maxScore += 20
    if ($Policy1.GrantControls -and $Policy2.GrantControls) {
        if (Compare-ArraySimilarity $Policy1.GrantControls.BuiltInControls $Policy2.GrantControls.BuiltInControls) {
            $score += 20
        }
    }
    
    # Compare session controls
    $maxScore += 10
    if ($Policy1.SessionControls -and $Policy2.SessionControls) {
        $score += 10
    }
    
    return [math]::Round(($score / $maxScore) * 100, 0)
}

function Compare-ArraySimilarity {
    param($Array1, $Array2)
    
    if (!$Array1 -and !$Array2) { return $true }
    if (!$Array1 -or !$Array2) { return $false }
    
    $intersection = $Array1 | Where-Object { $_ -in $Array2 }
    $union = ($Array1 + $Array2) | Select-Object -Unique
    
    return ($intersection.Count / $union.Count) -ge 0.8
}

function Find-UnnecessaryPolicies {
    Write-Header "Identifying Unnecessary Policies"
    
    $unnecessary = @()
    
    foreach ($policy in $script:Policies) {
        $reasons = @()
        
        # Check if policy is disabled for too long
        if ($policy.State -eq "disabled") {
            $reasons += "Policy is disabled"
        }
        
        # Check for overly broad conditions
        if ($policy.Conditions.Users.IncludeUsers -contains "All" -and 
            !$policy.Conditions.Users.ExcludeUsers -and 
            !$policy.GrantControls.BuiltInControls) {
            $reasons += "Overly broad policy with no controls"
        }
        
        # Check for redundant conditions
        if ($policy.Conditions.Applications.IncludeApplications -contains "All" -and 
            $policy.Conditions.Applications.IncludeApplications.Count -eq 1 -and
            !$policy.GrantControls.BuiltInControls) {
            $reasons += "Policy applies to all applications with no restrictions"
        }
        
        # Check for policies with no meaningful controls
        if (!$policy.GrantControls.BuiltInControls -and !$policy.SessionControls) {
            $reasons += "Policy has no grant or session controls"
        }
        
        if ($reasons.Count -gt 0) {
            $unnecessary += @{
                Policy = $policy
                Reasons = $reasons
            }
        }
    }
    
    $script:Analysis.UnnecessaryPolicies = $unnecessary
    
    Write-Status "Found $($unnecessary.Count) potentially unnecessary policies" $(if ($unnecessary.Count -gt 0) { "WARNING" } else { "SUCCESS" })
    
    foreach ($item in $unnecessary) {
        Write-Status "  - '$($item.Policy.DisplayName)'" "WARNING"
        foreach ($reason in $item.Reasons) {
            Write-Status "    * $reason"
        }
    }
}

function Calculate-SecurityScore {
    Write-Header "Calculating Security Score"
    
    $score = 100
    $recommendations = @()
    
    # Deduct points for issues
    $enabledPolicies = $script:Policies | Where-Object { $_.State -eq "enabled" }
    
    # Check for MFA enforcement
    $mfaPolicies = $enabledPolicies | Where-Object { 
        $_.GrantControls.BuiltInControls -contains "mfa" 
    }
    
    if ($mfaPolicies.Count -eq 0) {
        $score -= 30
        $recommendations += "No MFA enforcement policies found - Critical security risk"
    }
    
    # Check for admin protection
    $adminPolicies = $enabledPolicies | Where-Object {
        $_.Conditions.Users.IncludeRoles -and 
        $_.GrantControls.BuiltInControls -contains "mfa"
    }
    
    if ($adminPolicies.Count -eq 0) {
        $score -= 20
        $recommendations += "No MFA policies specifically targeting administrative roles"
    }
    
    # Check for legacy authentication blocking
    $legacyBlockPolicies = $enabledPolicies | Where-Object {
        $_.Conditions.ClientAppTypes -contains "exchangeActiveSync" -or
        $_.Conditions.ClientAppTypes -contains "other"
    }
    
    if ($legacyBlockPolicies.Count -eq 0) {
        $score -= 15
        $recommendations += "No policies blocking legacy authentication protocols"
    }
    
    # Deduct for duplicates and unnecessary policies
    $score -= ($script:Analysis.DuplicatePolicies.Count * 5)
    $score -= ($script:Analysis.UnnecessaryPolicies.Count * 3)
    
    if ($script:Analysis.DuplicatePolicies.Count -gt 0) {
        $recommendations += "Remove or consolidate $($script:Analysis.DuplicatePolicies.Count) duplicate policy groups"
    }
    
    if ($script:Analysis.UnnecessaryPolicies.Count -gt 0) {
        $recommendations += "Review and remove $($script:Analysis.UnnecessaryPolicies.Count) unnecessary policies"
    }
    
    $script:Analysis.SecurityScore = [math]::Max(0, $score)
    $script:Analysis.Recommendations = $recommendations
    
    $scoreColor = if ($score -ge 80) { "SUCCESS" } elseif ($score -ge 60) { "WARNING" } else { "ERROR" }
    Write-Status "Security Score: $score/100" $scoreColor
    
    if ($recommendations.Count -gt 0) {
        Write-Status "Recommendations:" "WARNING"
        foreach ($rec in $recommendations) {
            Write-Status "  - $rec"
        }
    }
}

function Assess-RiskLevel {
    Write-Header "Risk Assessment"
    
    foreach ($policy in $script:Policies | Where-Object { $_.State -eq "enabled" }) {
        $riskLevel = "Low"
        $riskFactors = @()
        
        # High risk factors
        if ($policy.Conditions.Users.IncludeUsers -contains "All" -and 
            !$policy.Conditions.Users.ExcludeUsers -and
            !$policy.GrantControls.BuiltInControls) {
            $riskLevel = "High"
            $riskFactors += "Applies to all users with no controls"
        }
        
        if ($policy.Conditions.Applications.IncludeApplications -contains "All" -and
            !$policy.GrantControls.BuiltInControls) {
            $riskLevel = "High"
            $riskFactors += "Applies to all applications with no controls"
        }
        
        # Medium risk factors
        if ($policy.Conditions.Locations.IncludeLocations -contains "All" -and
            !$policy.Conditions.Locations.ExcludeLocations) {
            if ($riskLevel -eq "Low") { $riskLevel = "Medium" }
            $riskFactors += "Applies to all locations"
        }
        
        if (!$policy.GrantControls.BuiltInControls -and !$policy.SessionControls) {
            if ($riskLevel -eq "Low") { $riskLevel = "Medium" }
            $riskFactors += "No security controls enforced"
        }
        
        $riskItem = @{
            Policy = $policy
            RiskLevel = $riskLevel
            RiskFactors = $riskFactors
        }
        
        $script:Analysis.RiskAssessment[$riskLevel] += $riskItem
    }
    
    Write-Status "High Risk Policies: $($script:Analysis.RiskAssessment.High.Count)" $(if ($script:Analysis.RiskAssessment.High.Count -gt 0) { "ERROR" } else { "SUCCESS" })
    Write-Status "Medium Risk Policies: $($script:Analysis.RiskAssessment.Medium.Count)" $(if ($script:Analysis.RiskAssessment.Medium.Count -gt 0) { "WARNING" } else { "SUCCESS" })
    Write-Status "Low Risk Policies: $($script:Analysis.RiskAssessment.Low.Count)" "SUCCESS"
}

function Export-ToCSV {
    param([string]$FilePath)
    
    $csvData = @()
    
    foreach ($policy in $script:Policies) {
        $csvData += [PSCustomObject]@{
            DisplayName = $policy.DisplayName
            State = $policy.State
            Id = $policy.Id
            CreatedDateTime = $policy.CreatedDateTime
            ModifiedDateTime = $policy.ModifiedDateTime
            IncludeUsers = ($policy.Conditions.Users.IncludeUsers -join "; ")
            ExcludeUsers = ($policy.Conditions.Users.ExcludeUsers -join "; ")
            IncludeApplications = ($policy.Conditions.Applications.IncludeApplications -join "; ")
            GrantControls = ($policy.GrantControls.BuiltInControls -join "; ")
            SessionControlsEnabled = if ($policy.SessionControls) { "Yes" } else { "No" }
        }
    }
    
    $csvData | Export-Csv -Path $FilePath -NoTypeInformation
    Write-Status "Exported policy data to $FilePath" "SUCCESS"
}

function Export-ToJSON {
    param([string]$FilePath)
    
    $jsonData = @{
        ExportDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Analysis = $script:Analysis
        Policies = $script:Policies
    }
    
    $jsonData | ConvertTo-Json -Depth 10 | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Status "Exported analysis data to $FilePath" "SUCCESS"
}

function Export-ToHTML {
    param([string]$FilePath)
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Conditional Access Policy Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; border-left: 4px solid #3498db; padding-left: 15px; }
        .score { font-size: 2em; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .score.high { background-color: #d4edda; color: #155724; }
        .score.medium { background-color: #fff3cd; color: #856404; }
        .score.low { background-color: #f8d7da; color: #721c24; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-item { text-align: center; padding: 15px; background-color: #ecf0f1; border-radius: 8px; min-width: 120px; }
        .stat-number { font-size: 2em; font-weight: bold; color: #2980b9; }
        .stat-label { color: #7f8c8d; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .risk-high { background-color: #ffebee !important; }
        .risk-medium { background-color: #fff8e1 !important; }
        .risk-low { background-color: #e8f5e8 !important; }
        .recommendation { background-color: #e3f2fd; padding: 10px; margin: 5px 0; border-left: 4px solid #2196f3; border-radius: 4px; }
        .policy-enabled { color: #27ae60; font-weight: bold; }
        .policy-disabled { color: #e74c3c; font-weight: bold; }
        .policy-report { color: #f39c12; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Conditional Access Policy Analysis Report</h1>
        <p><strong>Generated:</strong> $(Get-Date -Format "MMMM dd, yyyy 'at' HH:mm:ss")</p>
        
        <h2>📊 Security Score</h2>
        <div class="score $(if ($script:Analysis.SecurityScore -ge 80) { 'high' } elseif ($script:Analysis.SecurityScore -ge 60) { 'medium' } else { 'low' })">
            $($script:Analysis.SecurityScore)/100
        </div>
        
        <h2>📈 Policy Statistics</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">$($script:Analysis.TotalPolicies)</div>
                <div class="stat-label">Total Policies</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">$($script:Analysis.EnabledPolicies)</div>
                <div class="stat-label">Enabled</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">$($script:Analysis.DisabledPolicies)</div>
                <div class="stat-label">Disabled</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">$($script:Analysis.ReportOnlyPolicies)</div>
                <div class="stat-label">Report Only</div>
            </div>
        </div>
        
        <h2>⚠️ Recommendations</h2>
        $(if ($script:Analysis.Recommendations.Count -gt 0) {
            ($script:Analysis.Recommendations | ForEach-Object { "<div class='recommendation'>$_</div>" }) -join ""
        } else {
            "<p style='color: #27ae60;'>✅ No immediate recommendations - your policies look good!</p>"
        })
        
        <h2>🚨 Risk Assessment</h2>
        <table>
            <tr><th>Risk Level</th><th>Count</th><th>Policies</th></tr>
            <tr class="risk-high">
                <td><strong>High Risk</strong></td>
                <td>$($script:Analysis.RiskAssessment.High.Count)</td>
                <td>$(($script:Analysis.RiskAssessment.High | ForEach-Object { $_.Policy.DisplayName }) -join ", ")</td>
            </tr>
            <tr class="risk-medium">
                <td><strong>Medium Risk</strong></td>
                <td>$($script:Analysis.RiskAssessment.Medium.Count)</td>
                <td>$(($script:Analysis.RiskAssessment.Medium | ForEach-Object { $_.Policy.DisplayName }) -join ", ")</td>
            </tr>
            <tr class="risk-low">
                <td><strong>Low Risk</strong></td>
                <td>$($script:Analysis.RiskAssessment.Low.Count)</td>
                <td>$(($script:Analysis.RiskAssessment.Low | ForEach-Object { $_.Policy.DisplayName }) -join ", ")</td>
            </tr>
        </table>
        
        <h2>📋 All Policies</h2>
        <table>
            <tr>
                <th>Policy Name</th>
                <th>State</th>
                <th>Created</th>
                <th>Modified</th>
                <th>Users</th>
                <th>Controls</th>
            </tr>
            $(foreach ($policy in $script:Policies) {
                $stateClass = switch ($policy.State) {
                    "enabled" { "policy-enabled" }
                    "disabled" { "policy-disabled" }
                    "enabledForReportingButNotEnforced" { "policy-report" }
                }
                "<tr>
                    <td>$($policy.DisplayName)</td>
                    <td class='$stateClass'>$($policy.State)</td>
                    <td>$(if ($policy.CreatedDateTime) { (Get-Date $policy.CreatedDateTime).ToString("yyyy-MM-dd") } else { "N/A" })</td>
                    <td>$(if ($policy.ModifiedDateTime) { (Get-Date $policy.ModifiedDateTime).ToString("yyyy-MM-dd") } else { "N/A" })</td>
                    <td>$(if ($policy.Conditions.Users.IncludeUsers) { ($policy.Conditions.Users.IncludeUsers | Select-Object -First 3) -join ", " } else { "None" })</td>
                    <td>$(if ($policy.GrantControls.BuiltInControls) { $policy.GrantControls.BuiltInControls -join ", " } else { "None" })</td>
                </tr>"
            })
        </table>
        
        $(if ($script:Analysis.DuplicatePolicies.Count -gt 0) {
            "<h2>🔄 Potential Duplicates</h2>
            <table>
                <tr><th>Main Policy</th><th>Similar Policies</th><th>Similarity</th></tr>
                $(foreach ($group in $script:Analysis.DuplicatePolicies) {
                    foreach ($similar in $group.SimilarPolicies) {
                        "<tr>
                            <td>$($group.MainPolicy.DisplayName)</td>
                            <td>$($similar.Policy.DisplayName)</td>
                            <td>$($similar.Similarity)%</td>
                        </tr>"
                    }
                })</table>"
        })
        
        $(if ($script:Analysis.UnnecessaryPolicies.Count -gt 0) {
            "<h2>🗑️ Potentially Unnecessary Policies</h2>
            <table>
                <tr><th>Policy Name</th><th>Reasons</th></tr>
                $(foreach ($item in $script:Analysis.UnnecessaryPolicies) {
                    "<tr>
                        <td>$($item.Policy.DisplayName)</td>
                        <td>$($item.Reasons -join "; ")</td>
                    </tr>"
                })</table>"
        })
        
        <p style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
            Report generated by Conditional Access Policy Analyzer
        </p>
    </div>
</body>
</html>
"@
    
    $html | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Status "Exported HTML report to $FilePath" "SUCCESS"
}

function Export-Results {
    Write-Header "Exporting Analysis Results"
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $baseFileName = "ConditionalAccessAnalysis-$timestamp"
    
    if ($ExportFormat -eq "CSV" -or $ExportFormat -eq "All") {
        $csvPath = Join-Path $ExportPath "$baseFileName.csv"
        Export-ToCSV -FilePath $csvPath
    }
    
    if ($ExportFormat -eq "JSON" -or $ExportFormat -eq "All") {
        $jsonPath = Join-Path $ExportPath "$baseFileName.json"
        Export-ToJSON -FilePath $jsonPath
    }
    
    if ($ExportFormat -eq "HTML" -or $ExportFormat -eq "All" -or $GenerateReport) {
        $htmlPath = Join-Path $ExportPath "$baseFileName.html"
        Export-ToHTML -FilePath $htmlPath
        
        # Open the HTML report
        if ($GenerateReport) {
            try {
                Start-Process $htmlPath
                Write-Status "Opening HTML report in default browser..." "SUCCESS"
            }
            catch {
                Write-Status "Report saved but couldn't open automatically: $htmlPath" "WARNING"
            }
        }
    }
}

function Show-Summary {
    Write-Header "Analysis Summary"
    
    Write-Host "📊 Policy Overview:" -ForegroundColor Yellow
    Write-Host "   Total Policies: $($script:Analysis.TotalPolicies)"
    Write-Host "   Enabled: $($script:Analysis.EnabledPolicies)" -ForegroundColor Green
    Write-Host "   Disabled: $($script:Analysis.DisabledPolicies)" -ForegroundColor Red
    Write-Host "   Report Only: $($script:Analysis.ReportOnlyPolicies)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🔒 Security Score: $($script:Analysis.SecurityScore)/100" -ForegroundColor $(if ($script:Analysis.SecurityScore -ge 80) { "Green" } elseif ($script:Analysis.SecurityScore -ge 60) { "Yellow" } else { "Red" })
    Write-Host ""
    
    Write-Host "⚠️  Issues Found:" -ForegroundColor Yellow
    Write-Host "   Duplicate Policy Groups: $($script:Analysis.DuplicatePolicies.Count)" -ForegroundColor $(if ($script:Analysis.DuplicatePolicies.Count -gt 0) { "Red" } else { "Green" })
    Write-Host "   Unnecessary Policies: $($script:Analysis.UnnecessaryPolicies.Count)" -ForegroundColor $(if ($script:Analysis.UnnecessaryPolicies.Count -gt 0) { "Red" } else { "Green" })
    Write-Host ""
    
    Write-Host "🚨 Risk Distribution:" -ForegroundColor Yellow
    Write-Host "   High Risk: $($script:Analysis.RiskAssessment.High.Count)" -ForegroundColor Red
    Write-Host "   Medium Risk: $($script:Analysis.RiskAssessment.Medium.Count)" -ForegroundColor Yellow
    Write-Host "   Low Risk: $($script:Analysis.RiskAssessment.Low.Count)" -ForegroundColor Green
    Write-Host ""
    
    if ($script:Analysis.Recommendations.Count -gt 0) {
        Write-Host "💡 Recommendations:" -ForegroundColor Yellow
        foreach ($rec in $script:Analysis.Recommendations) {
            Write-Host "   • $rec" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "✅ No immediate recommendations - your policies look good!" -ForegroundColor Green
    }
}

# Main execution
function Main {
    Write-Header "Conditional Access Policy Analyzer"
    
    # Check required modules
    $requiredModules = @("Microsoft.Graph.Authentication", "Microsoft.Graph.Identity.SignIns")
    foreach ($module in $requiredModules) {
        if (!(Get-Module -ListAvailable -Name $module)) {
            Write-Status "Required module '$module' not found. Please install it using: Install-Module $module" "ERROR"
            return
        }
    }
    
    # Ensure export directory exists
    if (!(Test-Path $ExportPath)) {
        New-Item -ItemType Directory -Path $ExportPath -Force | Out-Null
    }
    
    # Execute analysis steps
    if (!(Connect-ToMicrosoftGraph)) { return }
    if (!(Get-ConditionalAccessPolicies)) { return }
    
    Find-DuplicatePolicies
    Find-UnnecessaryPolicies
    Calculate-SecurityScore
    Assess-RiskLevel
    
    Show-Summary
    Export-Results
    
    Write-Header "Analysis Complete"
    Write-Status "Analysis completed successfully! Check the exported files for detailed results." "SUCCESS"
}

# Run the main function
Main