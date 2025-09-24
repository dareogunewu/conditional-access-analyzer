#Requires -Modules Microsoft.Graph.Authentication, Microsoft.Graph.Identity.SignIns

<#
.SYNOPSIS
    Enhanced Conditional Access Policy Analyzer - Optimized for Security Reader Role

.DESCRIPTION
    Advanced PowerShell script specifically designed for Security Reader role users to:
    - Identify overlapping and duplicate Conditional Access Policies
    - Provide detailed consolidation recommendations
    - Generate actionable weeding strategies
    - Create comprehensive policy comparison matrices
    - Export results for policy cleanup planning

.PARAMETER ExportPath
    Path where analysis results will be exported (default: current directory)

.PARAMETER ExportFormat
    Export format: CSV, JSON, HTML, or All (default: All)

.PARAMETER OverlapThreshold
    Similarity threshold for identifying overlapping policies (default: 70%)

.PARAMETER DetailedComparison
    Generate detailed policy-by-policy comparison matrix (default: true)

.PARAMETER ConsolidationPlan
    Generate specific consolidation recommendations (default: true)

.EXAMPLE
    .\Analyze-ConditionalAccessPolicies-Enhanced.ps1
    
.EXAMPLE
    .\Analyze-ConditionalAccessPolicies-Enhanced.ps1 -OverlapThreshold 60 -DetailedComparison $true

.NOTES
    Author: Enhanced Conditional Access Analyzer
    Optimized for: Security Reader role users
    Permissions Required: Policy.Read.All, Directory.Read.All (Security Reader has these)
    Focus: Identifying overlapping policies for cleanup
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ExportPath = (Get-Location).Path,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("CSV", "JSON", "HTML", "All")]
    [string]$ExportFormat = "All",
    
    [Parameter(Mandatory = $false)]
    [ValidateRange(50, 100)]
    [int]$OverlapThreshold = 70,
    
    [Parameter(Mandatory = $false)]
    [bool]$DetailedComparison = $true,
    
    [Parameter(Mandatory = $false)]
    [bool]$ConsolidationPlan = $true
)

# Enhanced global variables for overlap analysis
$script:Policies = @()
$script:OverlapAnalysis = @{
    TotalPolicies = 0
    EnabledPolicies = 0
    OverlapGroups = @()
    RedundantPolicies = @()
    ConsolidationOpportunities = @()
    PolicyMatrix = @()
    WeedingPriority = @()
    SavingsEstimate = @{
        PoliciesCanBeRemoved = 0
        PoliciesCanBeMerged = 0
        ComplexityReduction = 0
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
        "FOUND" { "Magenta" }
        default { "White" }
    }
    
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Connect-ToMicrosoftGraph {
    Write-Header "Microsoft Graph Authentication (Security Reader Role)"
    
    try {
        # Check if already connected
        $context = Get-MgContext
        if ($context) {
            Write-Status "Already connected to Microsoft Graph as $($context.Account)" "SUCCESS"
            Write-Status "Current scopes: $($context.Scopes -join ', ')"
            return $true
        }
        
        Write-Status "Connecting to Microsoft Graph with Security Reader permissions..."
        
        # Minimal scopes required for Security Reader role
        $scopes = @(
            "Policy.Read.All",
            "Directory.Read.All",
            "User.Read.All",
            "Application.Read.All"
        )
        
        Connect-MgGraph -Scopes $scopes -NoWelcome
        
        $context = Get-MgContext
        if ($context) {
            Write-Status "Successfully connected as $($context.Account)" "SUCCESS"
            Write-Status "✓ Security Reader role provides sufficient permissions for policy analysis" "SUCCESS"
            return $true
        }
        else {
            Write-Status "Failed to connect to Microsoft Graph" "ERROR"
            return $false
        }
    }
    catch {
        Write-Status "Error connecting to Microsoft Graph: $($_.Exception.Message)" "ERROR"
        Write-Status "Ensure your account has Security Reader role or equivalent permissions" "ERROR"
        return $false
    }
}

function Get-ConditionalAccessPolicies {
    Write-Header "Retrieving Conditional Access Policies for Overlap Analysis"
    
    try {
        Write-Status "Fetching all Conditional Access Policies..."
        
        # Get all policies (including disabled for comprehensive analysis)
        $allPolicies = Get-MgIdentityConditionalAccessPolicy -All
        
        # Filter for enabled policies (primary focus for overlap detection)
        $enabledPolicies = $allPolicies | Where-Object { $_.State -eq "enabled" }
        
        $script:Policies = $allPolicies
        $script:OverlapAnalysis.TotalPolicies = $allPolicies.Count
        $script:OverlapAnalysis.EnabledPolicies = $enabledPolicies.Count
        
        Write-Status "Retrieved $($allPolicies.Count) total policies" "SUCCESS"
        Write-Status "Analyzing $($enabledPolicies.Count) enabled policies for overlaps" "SUCCESS"
        Write-Status "Including $($allPolicies.Count - $enabledPolicies.Count) disabled policies for comprehensive analysis"
        
        return $true
    }
    catch {
        Write-Status "Error retrieving policies: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Analyze-PolicyOverlaps {
    Write-Header "Advanced Overlap Detection Analysis"
    
    $enabledPolicies = $script:Policies | Where-Object { $_.State -eq "enabled" }
    $overlapGroups = @()
    $processedPolicies = @()
    
    Write-Status "Analyzing $($enabledPolicies.Count) enabled policies for overlaps..."
    Write-Status "Using $($OverlapThreshold)% similarity threshold"
    
    foreach ($policy in $enabledPolicies) {
        if ($policy.Id -in $processedPolicies) { continue }
        
        $overlappingPolicies = @()
        $overlapDetails = @()
        
        foreach ($comparePolicy in $enabledPolicies) {
            if ($policy.Id -eq $comparePolicy.Id -or $comparePolicy.Id -in $processedPolicies) {
                continue
            }
            
            $overlapResult = Calculate-PolicyOverlap $policy $comparePolicy
            
            if ($overlapResult.OverallSimilarity -ge $OverlapThreshold) {
                $overlappingPolicies += $comparePolicy
                $overlapDetails += $overlapResult
                $processedPolicies += $comparePolicy.Id
            }
        }
        
        if ($overlappingPolicies.Count -gt 0) {
            $overlapGroup = @{
                MainPolicy = $policy
                OverlappingPolicies = $overlappingPolicies
                OverlapDetails = $overlapDetails
                GroupSize = $overlappingPolicies.Count + 1
                TotalSimilarity = ($overlapDetails | Measure-Object -Property OverallSimilarity -Average).Average
                ConsolidationPotential = Get-ConsolidationPotential $policy $overlappingPolicies $overlapDetails
            }
            
            $overlapGroups += $overlapGroup
        }
        
        $processedPolicies += $policy.Id
    }
    
    $script:OverlapAnalysis.OverlapGroups = $overlapGroups
    
    Write-Status "Found $($overlapGroups.Count) groups of overlapping policies" $(if ($overlapGroups.Count -gt 0) { "FOUND" } else { "SUCCESS" })
    
    foreach ($group in $overlapGroups) {
        Write-Status "📋 Group: '$($group.MainPolicy.DisplayName)' + $($group.OverlappingPolicies.Count) others" "FOUND"
        Write-Status "   Average Similarity: $([math]::Round($group.TotalSimilarity, 1))%" 
        Write-Status "   Consolidation Potential: $($group.ConsolidationPotential)" 
        
        foreach ($detail in $group.OverlapDetails) {
            Write-Status "   ↳ '$($detail.ComparePolicy.DisplayName)' - $($detail.OverallSimilarity)% similar"
            if ($detail.UserOverlap -gt 80) { Write-Status "     • High user overlap ($($detail.UserOverlap)%)" }
            if ($detail.AppOverlap -gt 80) { Write-Status "     • High app overlap ($($detail.AppOverlap)%)" }
            if ($detail.ControlOverlap -gt 80) { Write-Status "     • Similar controls ($($detail.ControlOverlap)%)" }
        }
        Write-Host ""
    }
}

function Calculate-PolicyOverlap {
    param($Policy1, $Policy2)
    
    $userOverlap = Calculate-UserOverlap $Policy1.Conditions.Users $Policy2.Conditions.Users
    $appOverlap = Calculate-ApplicationOverlap $Policy1.Conditions.Applications $Policy2.Conditions.Applications
    $locationOverlap = Calculate-LocationOverlap $Policy1.Conditions.Locations $Policy2.Conditions.Locations
    $controlOverlap = Calculate-ControlOverlap $Policy1.GrantControls $Policy2.GrantControls
    $sessionOverlap = Calculate-SessionOverlap $Policy1.SessionControls $Policy2.SessionControls
    
    # Weighted scoring for overall similarity
    $weights = @{
        Users = 0.3
        Applications = 0.3
        Controls = 0.2
        Locations = 0.1
        Sessions = 0.1
    }
    
    $overallSimilarity = [math]::Round((
        ($userOverlap * $weights.Users) +
        ($appOverlap * $weights.Applications) +
        ($controlOverlap * $weights.Controls) +
        ($locationOverlap * $weights.Locations) +
        ($sessionOverlap * $weights.Sessions)
    ), 1)
    
    return @{
        ComparePolicy = $Policy2
        UserOverlap = $userOverlap
        AppOverlap = $appOverlap
        LocationOverlap = $locationOverlap
        ControlOverlap = $controlOverlap
        SessionOverlap = $sessionOverlap
        OverallSimilarity = $overallSimilarity
        ConflictAreas = Get-PolicyConflicts $Policy1 $Policy2
    }
}

function Calculate-UserOverlap {
    param($Users1, $Users2)
    
    if (!$Users1 -or !$Users2) { return 0 }
    
    $include1 = @($Users1.IncludeUsers) + @($Users1.IncludeGroups) + @($Users1.IncludeRoles)
    $include2 = @($Users2.IncludeUsers) + @($Users2.IncludeGroups) + @($Users2.IncludeRoles)
    
    # Special handling for "All" users
    if ("All" -in $include1 -and "All" -in $include2) { return 95 }
    if ("All" -in $include1 -or "All" -in $include2) { return 70 }
    
    return Calculate-ArrayOverlap $include1 $include2
}

function Calculate-ApplicationOverlap {
    param($Apps1, $Apps2)
    
    if (!$Apps1 -or !$Apps2) { return 0 }
    
    $include1 = @($Apps1.IncludeApplications)
    $include2 = @($Apps2.IncludeApplications)
    
    # Special handling for "All" applications
    if ("All" -in $include1 -and "All" -in $include2) { return 95 }
    if ("All" -in $include1 -or "All" -in $include2) { return 70 }
    
    return Calculate-ArrayOverlap $include1 $include2
}

function Calculate-LocationOverlap {
    param($Locations1, $Locations2)
    
    if (!$Locations1 -or !$Locations2) { return 50 } # Assume moderate overlap if not specified
    
    $include1 = @($Locations1.IncludeLocations)
    $include2 = @($Locations2.IncludeLocations)
    
    return Calculate-ArrayOverlap $include1 $include2
}

function Calculate-ControlOverlap {
    param($Controls1, $Controls2)
    
    if (!$Controls1 -or !$Controls2) { return 0 }
    
    $controls1 = @($Controls1.BuiltInControls)
    $controls2 = @($Controls2.BuiltInControls)
    
    return Calculate-ArrayOverlap $controls1 $controls2
}

function Calculate-SessionOverlap {
    param($Session1, $Session2)
    
    if (!$Session1 -and !$Session2) { return 100 }
    if (!$Session1 -or !$Session2) { return 0 }
    
    # Simple comparison for session controls
    return 80 # Assume high overlap if both have session controls
}

function Calculate-ArrayOverlap {
    param($Array1, $Array2)
    
    if (!$Array1 -and !$Array2) { return 100 }
    if (!$Array1 -or !$Array2) { return 0 }
    if ($Array1.Count -eq 0 -and $Array2.Count -eq 0) { return 100 }
    if ($Array1.Count -eq 0 -or $Array2.Count -eq 0) { return 0 }
    
    $intersection = $Array1 | Where-Object { $_ -in $Array2 }
    $union = ($Array1 + $Array2) | Select-Object -Unique
    
    return [math]::Round(($intersection.Count / $union.Count) * 100, 1)
}

function Get-PolicyConflicts {
    param($Policy1, $Policy2)
    
    $conflicts = @()
    
    # Check for conflicting grant controls
    if ($Policy1.GrantControls.BuiltInControls -and $Policy2.GrantControls.BuiltInControls) {
        $controls1 = $Policy1.GrantControls.BuiltInControls
        $controls2 = $Policy2.GrantControls.BuiltInControls
        
        if ("block" -in $controls1 -and "block" -notin $controls2) {
            $conflicts += "Conflicting access decisions (block vs allow)"
        }
    }
    
    # Check for different operators
    if ($Policy1.GrantControls.Operator -ne $Policy2.GrantControls.Operator) {
        $conflicts += "Different control operators ($($Policy1.GrantControls.Operator) vs $($Policy2.GrantControls.Operator))"
    }
    
    return $conflicts
}

function Get-ConsolidationPotential {
    param($MainPolicy, $OverlappingPolicies, $OverlapDetails)
    
    $avgSimilarity = ($OverlapDetails | Measure-Object -Property OverallSimilarity -Average).Average
    
    if ($avgSimilarity -ge 90) { return "High - Merge recommended" }
    elseif ($avgSimilarity -ge 80) { return "Medium - Consider merging" }
    elseif ($avgSimilarity -ge 70) { return "Low - Review for conflicts" }
    else { return "Minimal - Keep separate" }
}

function Generate-ConsolidationRecommendations {
    Write-Header "Generating Policy Consolidation Recommendations"
    
    $recommendations = @()
    
    foreach ($group in $script:OverlapAnalysis.OverlapGroups) {
        $recommendation = @{
            GroupId = [guid]::NewGuid().ToString().Substring(0,8)
            MainPolicy = $group.MainPolicy
            OverlappingPolicies = $group.OverlappingPolicies
            Action = ""
            Priority = ""
            Savings = @{
                PoliciesReduced = 0
                ComplexityScore = 0
            }
            Implementation = @{
                Steps = @()
                Risks = @()
                TestingRequired = $true
            }
        }
        
        $avgSimilarity = $group.TotalSimilarity
        
        if ($avgSimilarity -ge 85) {
            $recommendation.Action = "MERGE"
            $recommendation.Priority = "HIGH"
            $recommendation.Savings.PoliciesReduced = $group.OverlappingPolicies.Count
            $recommendation.Implementation.Steps = @(
                "1. Create new consolidated policy combining all conditions",
                "2. Set new policy to report-only mode initially",
                "3. Monitor for 2 weeks to ensure no unexpected behavior",
                "4. Enable consolidated policy",
                "5. Disable original policies",
                "6. After 1 month of stable operation, delete original policies"
            )
            $recommendation.Implementation.Risks = @(
                "Potential for wider scope than intended",
                "May affect users differently due to combined conditions"
            )
        }
        elseif ($avgSimilarity -ge 75) {
            $recommendation.Action = "REVIEW_FOR_MERGE"
            $recommendation.Priority = "MEDIUM"
            $recommendation.Savings.PoliciesReduced = [math]::Floor($group.OverlappingPolicies.Count / 2)
            $recommendation.Implementation.Steps = @(
                "1. Detailed analysis of user and application overlap",
                "2. Identify if policies can be merged without expanding scope",
                "3. If mergeable, follow merge process above",
                "4. If not mergeable, consider renaming for clarity"
            )
            $recommendation.Implementation.Risks = @(
                "Policies may have subtle but important differences",
                "User impact analysis required"
            )
        }
        else {
            $recommendation.Action = "CLARIFY_PURPOSE"
            $recommendation.Priority = "LOW"
            $recommendation.Implementation.Steps = @(
                "1. Document the specific purpose of each policy",
                "2. Rename policies to clarify different purposes",
                "3. Consider if policies are truly needed separately"
            )
            $recommendation.Implementation.Risks = @(
                "May discover policies are actually redundant"
            )
        }
        
        $recommendations += $recommendation
    }
    
    $script:OverlapAnalysis.ConsolidationOpportunities = $recommendations
    
    # Calculate potential savings
    $highPriorityMerges = ($recommendations | Where-Object { $_.Priority -eq "HIGH" } | Measure-Object -Property "Savings.PoliciesReduced" -Sum).Sum
    $mediumPriorityMerges = ($recommendations | Where-Object { $_.Priority -eq "MEDIUM" } | Measure-Object -Property "Savings.PoliciesReduced" -Sum).Sum
    
    $script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeRemoved = $highPriorityMerges
    $script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeMerged = $mediumPriorityMerges
    $script:OverlapAnalysis.SavingsEstimate.ComplexityReduction = [math]::Round((($highPriorityMerges + $mediumPriorityMerges) / $script:OverlapAnalysis.EnabledPolicies) * 100, 1)
    
    Write-Status "Generated $($recommendations.Count) consolidation recommendations" "SUCCESS"
    Write-Status "Potential policy reduction: $($highPriorityMerges + $mediumPriorityMerges) policies" "SUCCESS"
    Write-Status "Complexity reduction: $($script:OverlapAnalysis.SavingsEstimate.ComplexityReduction)%" "SUCCESS"
    
    foreach ($rec in $recommendations | Sort-Object { 
        switch ($_.Priority) { 
            "HIGH" { 1 } 
            "MEDIUM" { 2 } 
            "LOW" { 3 } 
        } 
    }) {
        Write-Status "🎯 [$($rec.Priority)] $($rec.Action): '$($rec.MainPolicy.DisplayName)' + $($rec.OverlappingPolicies.Count) others" "FOUND"
    }
}

function Create-PolicyComparisonMatrix {
    Write-Header "Creating Detailed Policy Comparison Matrix"
    
    if (!$DetailedComparison) {
        Write-Status "Detailed comparison matrix skipped (DetailedComparison = false)"
        return
    }
    
    $enabledPolicies = $script:Policies | Where-Object { $_.State -eq "enabled" }
    $matrix = @()
    
    Write-Status "Generating comparison matrix for $($enabledPolicies.Count) policies..."
    
    for ($i = 0; $i -lt $enabledPolicies.Count; $i++) {
        for ($j = $i + 1; $j -lt $enabledPolicies.Count; $j++) {
            $policy1 = $enabledPolicies[$i]
            $policy2 = $enabledPolicies[$j]
            
            $comparison = Calculate-PolicyOverlap $policy1 $policy2
            
            $matrixRow = @{
                Policy1Name = $policy1.DisplayName
                Policy1Id = $policy1.Id
                Policy2Name = $policy2.DisplayName
                Policy2Id = $policy2.Id
                OverallSimilarity = $comparison.OverallSimilarity
                UserOverlap = $comparison.UserOverlap
                AppOverlap = $comparison.AppOverlap
                LocationOverlap = $comparison.LocationOverlap
                ControlOverlap = $comparison.ControlOverlap
                SessionOverlap = $comparison.SessionOverlap
                HasConflicts = $comparison.ConflictAreas.Count -gt 0
                ConflictDetails = $comparison.ConflictAreas -join "; "
                RecommendedAction = if ($comparison.OverallSimilarity -ge 85) { "MERGE" } 
                                   elseif ($comparison.OverallSimilarity -ge 75) { "REVIEW" }
                                   elseif ($comparison.OverallSimilarity -ge $OverlapThreshold) { "MONITOR" }
                                   else { "KEEP_SEPARATE" }
            }
            
            $matrix += $matrixRow
        }
    }
    
    $script:OverlapAnalysis.PolicyMatrix = $matrix
    Write-Status "Created comparison matrix with $($matrix.Count) policy pairs" "SUCCESS"
    
    $mergeCandidates = ($matrix | Where-Object { $_.RecommendedAction -eq "MERGE" }).Count
    $reviewCandidates = ($matrix | Where-Object { $_.RecommendedAction -eq "REVIEW" }).Count
    $monitorCandidates = ($matrix | Where-Object { $_.RecommendedAction -eq "MONITOR" }).Count
    
    Write-Status "Matrix Analysis Results:" "SUCCESS"
    Write-Status "  • Merge candidates: $mergeCandidates pairs"
    Write-Status "  • Review candidates: $reviewCandidates pairs"
    Write-Status "  • Monitor candidates: $monitorCandidates pairs"
}

function Generate-WeedingPriority {
    Write-Header "Generating Policy Weeding Priority List"
    
    $weedingList = @()
    
    # Priority 1: High-similarity overlaps (easy wins)
    foreach ($group in $script:OverlapAnalysis.OverlapGroups | Where-Object { $_.TotalSimilarity -ge 85 }) {
        foreach ($policy in $group.OverlappingPolicies) {
            $weedingList += @{
                Policy = $policy
                Priority = 1
                Reason = "High overlap with '$($group.MainPolicy.DisplayName)' ($([math]::Round($group.TotalSimilarity,1))% similar)"
                Action = "Consider merging or removing"
                Impact = "Low risk - policies are very similar"
                Effort = "Low"
            }
        }
    }
    
    # Priority 2: Medium-similarity overlaps (requires review)
    foreach ($group in $script:OverlapAnalysis.OverlapGroups | Where-Object { $_.TotalSimilarity -ge 75 -and $_.TotalSimilarity -lt 85 }) {
        foreach ($policy in $group.OverlappingPolicies) {
            $weedingList += @{
                Policy = $policy
                Priority = 2
                Reason = "Medium overlap with '$($group.MainPolicy.DisplayName)' ($([math]::Round($group.TotalSimilarity,1))% similar)"
                Action = "Review for consolidation opportunities"
                Impact = "Medium risk - detailed analysis required"
                Effort = "Medium"
            }
        }
    }
    
    # Priority 3: Disabled policies (cleanup candidates)
    $disabledPolicies = $script:Policies | Where-Object { $_.State -eq "disabled" }
    foreach ($policy in $disabledPolicies) {
        $weedingList += @{
            Policy = $policy
            Priority = 3
            Reason = "Policy is disabled"
            Action = "Consider deletion if no longer needed"
            Impact = "Very low risk - already disabled"
            Effort = "Low"
        }
    }
    
    # Priority 4: Report-only policies (evaluation candidates)
    $reportOnlyPolicies = $script:Policies | Where-Object { $_.State -eq "enabledForReportingButNotEnforced" }
    foreach ($policy in $reportOnlyPolicies) {
        $daysSinceModified = if ($policy.ModifiedDateTime) { 
            (Get-Date) - (Get-Date $policy.ModifiedDateTime) | Select-Object -ExpandProperty Days 
        } else { 999 }
        
        if ($daysSinceModified -gt 30) {
            $weedingList += @{
                Policy = $policy
                Priority = 4
                Reason = "Report-only mode for $daysSinceModified days"
                Action = "Enable enforcement or remove if testing complete"
                Impact = "Low risk - currently in report-only mode"
                Effort = "Low"
            }
        }
    }
    
    $script:OverlapAnalysis.WeedingPriority = $weedingList | Sort-Object Priority, { $_.Policy.DisplayName }
    
    Write-Status "Generated weeding priority list with $($weedingList.Count) policies" "SUCCESS"
    Write-Status "Priority breakdown:" "SUCCESS"
    for ($i = 1; $i -le 4; $i++) {
        $count = ($weedingList | Where-Object { $_.Priority -eq $i }).Count
        $label = switch ($i) {
            1 { "High overlap (immediate attention)" }
            2 { "Medium overlap (review required)" }
            3 { "Disabled policies (cleanup)" }
            4 { "Long-term report-only (evaluation)" }
        }
        Write-Status "  • Priority $i - $label`: $count policies"
    }
}

function Export-ToCSV {
    param([string]$FilePath)
    
    # Main policies export
    $csvData = @()
    foreach ($policy in $script:Policies) {
        $csvData += [PSCustomObject]@{
            DisplayName = $policy.DisplayName
            State = $policy.State
            Id = $policy.Id
            CreatedDateTime = $policy.CreatedDateTime
            ModifiedDateTime = $policy.ModifiedDateTime
            IncludeUsers = ($policy.Conditions.Users.IncludeUsers -join "; ")
            IncludeGroups = ($policy.Conditions.Users.IncludeGroups -join "; ")
            IncludeRoles = ($policy.Conditions.Users.IncludeRoles -join "; ")
            IncludeApplications = ($policy.Conditions.Applications.IncludeApplications -join "; ")
            GrantControls = ($policy.GrantControls.BuiltInControls -join "; ")
            ControlOperator = $policy.GrantControls.Operator
            SessionControlsEnabled = if ($policy.SessionControls) { "Yes" } else { "No" }
        }
    }
    
    $csvData | Export-Csv -Path $FilePath -NoTypeInformation
    
    # Export overlap matrix if detailed comparison was generated
    if ($script:OverlapAnalysis.PolicyMatrix.Count -gt 0) {
        $matrixPath = $FilePath -replace '\.csv$', '-ComparisonMatrix.csv'
        $script:OverlapAnalysis.PolicyMatrix | Export-Csv -Path $matrixPath -NoTypeInformation
        Write-Status "Exported comparison matrix to $matrixPath" "SUCCESS"
    }
    
    # Export weeding priority list
    if ($script:OverlapAnalysis.WeedingPriority.Count -gt 0) {
        $weedingPath = $FilePath -replace '\.csv$', '-WeedingPriority.csv'
        $weedingData = $script:OverlapAnalysis.WeedingPriority | ForEach-Object {
            [PSCustomObject]@{
                PolicyName = $_.Policy.DisplayName
                PolicyId = $_.Policy.Id
                PolicyState = $_.Policy.State
                Priority = $_.Priority
                Reason = $_.Reason
                RecommendedAction = $_.Action
                Impact = $_.Impact
                Effort = $_.Effort
            }
        }
        $weedingData | Export-Csv -Path $weedingPath -NoTypeInformation
        Write-Status "Exported weeding priority list to $weedingPath" "SUCCESS"
    }
    
    Write-Status "Exported policy data to $FilePath" "SUCCESS"
}

function Export-ToJSON {
    param([string]$FilePath)
    
    $jsonData = @{
        ExportDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        AnalysisParameters = @{
            OverlapThreshold = $OverlapThreshold
            DetailedComparison = $DetailedComparison
            ConsolidationPlan = $ConsolidationPlan
        }
        OverlapAnalysis = $script:OverlapAnalysis
        Policies = $script:Policies
        Summary = @{
            TotalPolicies = $script:OverlapAnalysis.TotalPolicies
            EnabledPolicies = $script:OverlapAnalysis.EnabledPolicies
            OverlapGroupsFound = $script:OverlapAnalysis.OverlapGroups.Count
            ConsolidationOpportunities = $script:OverlapAnalysis.ConsolidationOpportunities.Count
            WeedingCandidates = $script:OverlapAnalysis.WeedingPriority.Count
            PotentialSavings = $script:OverlapAnalysis.SavingsEstimate
        }
    }
    
    $jsonData | ConvertTo-Json -Depth 15 | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Status "Exported comprehensive analysis data to $FilePath" "SUCCESS"
}

function Export-ToHTML {
    param([string]$FilePath)
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Conditional Access Policy Overlap Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { background-color: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px; text-align: center; }
        h2 { color: #34495e; margin-top: 40px; border-left: 5px solid #3498db; padding-left: 20px; }
        h3 { color: #2980b9; margin-top: 25px; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .card-number { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .card-label { font-size: 0.9em; opacity: 0.9; }
        .savings-highlight { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; border-radius: 10px; color: white; text-align: center; margin: 20px 0; }
        .priority-high { background-color: #ffebee; border-left: 5px solid #f44336; }
        .priority-medium { background-color: #fff8e1; border-left: 5px solid #ff9800; }
        .priority-low { background-color: #e8f5e8; border-left: 5px solid #4caf50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; }
        td { padding: 12px 15px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #e3f2fd; }
        .overlap-high { background-color: #ffcdd2 !important; }
        .overlap-medium { background-color: #fff9c4 !important; }
        .overlap-low { background-color: #dcedc8 !important; }
        .action-merge { color: #d32f2f; font-weight: bold; }
        .action-review { color: #f57c00; font-weight: bold; }
        .action-monitor { color: #388e3c; font-weight: bold; }
        .recommendation-box { background-color: #e3f2fd; padding: 20px; margin: 15px 0; border-left: 5px solid #2196f3; border-radius: 5px; }
        .step-list { margin-left: 20px; }
        .step-list li { margin: 8px 0; }
        .risk-note { background-color: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #ff9800; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Conditional Access Policy Overlap Analysis</h1>
        <p style="text-align: center; color: #666; font-size: 1.1em;"><strong>Generated:</strong> $(Get-Date -Format "MMMM dd, yyyy 'at' HH:mm:ss") | <strong>Security Reader Role Analysis</strong></p>
        
        <div class="summary-cards">
            <div class="card">
                <div class="card-number">$($script:OverlapAnalysis.TotalPolicies)</div>
                <div class="card-label">Total Policies</div>
            </div>
            <div class="card">
                <div class="card-number">$($script:OverlapAnalysis.OverlapGroups.Count)</div>
                <div class="card-label">Overlap Groups Found</div>
            </div>
            <div class="card">
                <div class="card-number">$($script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeRemoved + $script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeMerged)</div>
                <div class="card-label">Policies Can Be Reduced</div>
            </div>
            <div class="card">
                <div class="card-number">$($script:OverlapAnalysis.SavingsEstimate.ComplexityReduction)%</div>
                <div class="card-label">Complexity Reduction</div>
            </div>
        </div>
        
        <div class="savings-highlight">
            <h3 style="margin-top: 0;">💡 Potential Savings</h3>
            <p style="font-size: 1.2em; margin: 10px 0;">
                By consolidating overlapping policies, you could reduce your policy count by 
                <strong>$($script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeRemoved + $script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeMerged) policies</strong> 
                and simplify management by <strong>$($script:OverlapAnalysis.SavingsEstimate.ComplexityReduction)%</strong>
            </p>
        </div>
        
        <h2>🎯 Priority Weeding Recommendations</h2>
        $(if ($script:OverlapAnalysis.WeedingPriority.Count -gt 0) {
            $priority1 = $script:OverlapAnalysis.WeedingPriority | Where-Object { $_.Priority -eq 1 }
            $priority2 = $script:OverlapAnalysis.WeedingPriority | Where-Object { $_.Priority -eq 2 }
            $priority3 = $script:OverlapAnalysis.WeedingPriority | Where-Object { $_.Priority -eq 3 }
            
            "<table>
                <tr><th>Priority</th><th>Policy Name</th><th>Reason</th><th>Recommended Action</th><th>Effort</th></tr>
                $(foreach ($item in $priority1) {
                    "<tr class='priority-high'>
                        <td><strong>HIGH</strong></td>
                        <td>$($item.Policy.DisplayName)</td>
                        <td>$($item.Reason)</td>
                        <td>$($item.Action)</td>
                        <td>$($item.Effort)</td>
                    </tr>"
                })
                $(foreach ($item in $priority2) {
                    "<tr class='priority-medium'>
                        <td><strong>MEDIUM</strong></td>
                        <td>$($item.Policy.DisplayName)</td>
                        <td>$($item.Reason)</td>
                        <td>$($item.Action)</td>
                        <td>$($item.Effort)</td>
                    </tr>"
                })
                $(foreach ($item in $priority3 | Select-Object -First 5) {
                    "<tr class='priority-low'>
                        <td><strong>LOW</strong></td>
                        <td>$($item.Policy.DisplayName)</td>
                        <td>$($item.Reason)</td>
                        <td>$($item.Action)</td>
                        <td>$($item.Effort)</td>
                    </tr>"
                })
            </table>"
        } else {
            "<p style='color: #27ae60; font-size: 1.2em;'>✅ No overlapping policies found! Your policy set is well-organized.</p>"
        })
        
        <h2>📊 Overlap Groups Analysis</h2>
        $(if ($script:OverlapAnalysis.OverlapGroups.Count -gt 0) {
            foreach ($group in $script:OverlapAnalysis.OverlapGroups | Sort-Object { $_.TotalSimilarity } -Descending) {
                "<div class='recommendation-box'>
                    <h3>📋 Group: $($group.MainPolicy.DisplayName)</h3>
                    <p><strong>Group Size:</strong> $($group.GroupSize) policies | <strong>Average Similarity:</strong> $([math]::Round($group.TotalSimilarity,1))%</p>
                    <p><strong>Consolidation Potential:</strong> $($group.ConsolidationPotential)</p>
                    <h4>Overlapping Policies:</h4>
                    <ul>
                        $(foreach ($detail in $group.OverlapDetails) {
                            "<li><strong>$($detail.ComparePolicy.DisplayName)</strong> - $($detail.OverallSimilarity)% similar
                                <ul style='margin-top: 5px;'>
                                    <li>User Overlap: $($detail.UserOverlap)%</li>
                                    <li>Application Overlap: $($detail.AppOverlap)%</li>
                                    <li>Control Overlap: $($detail.ControlOverlap)%</li>
                                </ul>
                            </li>"
                        })
                    </ul>
                </div>"
            }
        } else {
            "<p style='color: #27ae60;'>✅ No significant overlap groups found.</p>"
        })
        
        <h2>🔧 Detailed Consolidation Plan</h2>
        $(if ($script:OverlapAnalysis.ConsolidationOpportunities.Count -gt 0) {
            foreach ($rec in $script:OverlapAnalysis.ConsolidationOpportunities | Sort-Object { 
                switch ($_.Priority) { "HIGH" { 1 } "MEDIUM" { 2 } "LOW" { 3 } }
            }) {
                $priorityClass = switch ($rec.Priority) {
                    "HIGH" { "priority-high" }
                    "MEDIUM" { "priority-medium" }
                    "LOW" { "priority-low" }
                }
                "<div class='recommendation-box $priorityClass'>
                    <h3>[$($rec.Priority) PRIORITY] $($rec.Action)</h3>
                    <p><strong>Main Policy:</strong> $($rec.MainPolicy.DisplayName)</p>
                    <p><strong>Overlapping Policies:</strong> $(($rec.OverlappingPolicies | ForEach-Object { $_.DisplayName }) -join ', ')</p>
                    <p><strong>Potential Savings:</strong> $($rec.Savings.PoliciesReduced) policies</p>
                    
                    <h4>Implementation Steps:</h4>
                    <ol class='step-list'>
                        $(foreach ($step in $rec.Implementation.Steps) {
                            "<li>$step</li>"
                        })
                    </ol>
                    
                    $(if ($rec.Implementation.Risks.Count -gt 0) {
                        "<div class='risk-note'>
                            <strong>⚠️ Implementation Risks:</strong>
                            <ul>
                                $(foreach ($risk in $rec.Implementation.Risks) {
                                    "<li>$risk</li>"
                                })
                            </ul>
                        </div>"
                    })
                </div>"
            }
        } else {
            "<p style='color: #27ae60;'>✅ No specific consolidation opportunities identified.</p>"
        })
        
        $(if ($script:OverlapAnalysis.PolicyMatrix.Count -gt 0 -and $script:OverlapAnalysis.PolicyMatrix.Count -le 50) {
            "<h2>📈 Policy Comparison Matrix (Top Overlaps)</h2>
            <table>
                <tr>
                    <th>Policy 1</th>
                    <th>Policy 2</th>
                    <th>Overall Similarity</th>
                    <th>User Overlap</th>
                    <th>App Overlap</th>
                    <th>Control Overlap</th>
                    <th>Recommended Action</th>
                </tr>
                $(foreach ($row in ($script:OverlapAnalysis.PolicyMatrix | Sort-Object OverallSimilarity -Descending | Select-Object -First 20)) {
                    $overlapClass = if ($row.OverallSimilarity -ge 80) { "overlap-high" } 
                                   elseif ($row.OverallSimilarity -ge 70) { "overlap-medium" } 
                                   else { "overlap-low" }
                    $actionClass = switch ($row.RecommendedAction) {
                        "MERGE" { "action-merge" }
                        "REVIEW" { "action-review" }
                        "MONITOR" { "action-monitor" }
                        default { "" }
                    }
                    "<tr class='$overlapClass'>
                        <td>$($row.Policy1Name)</td>
                        <td>$($row.Policy2Name)</td>
                        <td><strong>$($row.OverallSimilarity)%</strong></td>
                        <td>$($row.UserOverlap)%</td>
                        <td>$($row.AppOverlap)%</td>
                        <td>$($row.ControlOverlap)%</td>
                        <td class='$actionClass'>$($row.RecommendedAction)</td>
                    </tr>"
                })</table>
            <p style='font-size: 0.9em; color: #666;'><em>Showing top 20 comparisons. Complete matrix available in CSV export.</em></p>"
        })
        
        <h2>📋 All Policies Summary</h2>
        <table>
            <tr>
                <th>Policy Name</th>
                <th>State</th>
                <th>Users</th>
                <th>Applications</th>
                <th>Controls</th>
                <th>Modified</th>
            </tr>
            $(foreach ($policy in ($script:Policies | Sort-Object State, DisplayName)) {
                $stateClass = switch ($policy.State) {
                    "enabled" { "style='color: #27ae60; font-weight: bold;'" }
                    "disabled" { "style='color: #e74c3c; font-weight: bold;'" }
                    "enabledForReportingButNotEnforced" { "style='color: #f39c12; font-weight: bold;'" }
                }
                "<tr>
                    <td>$($policy.DisplayName)</td>
                    <td $stateClass>$($policy.State)</td>
                    <td>$(if ($policy.Conditions.Users.IncludeUsers -contains 'All') { 'All Users' } else { (($policy.Conditions.Users.IncludeUsers + $policy.Conditions.Users.IncludeGroups + $policy.Conditions.Users.IncludeRoles | Select-Object -First 2) -join ', ') + $(if (($policy.Conditions.Users.IncludeUsers + $policy.Conditions.Users.IncludeGroups + $policy.Conditions.Users.IncludeRoles).Count -gt 2) { '...' }) })</td>
                    <td>$(if ($policy.Conditions.Applications.IncludeApplications -contains 'All') { 'All Apps' } else { (($policy.Conditions.Applications.IncludeApplications | Select-Object -First 2) -join ', ') + $(if ($policy.Conditions.Applications.IncludeApplications.Count -gt 2) { '...' }) })</td>
                    <td>$(if ($policy.GrantControls.BuiltInControls) { ($policy.GrantControls.BuiltInControls | Select-Object -First 2) -join ', ' } else { 'None' })</td>
                    <td>$(if ($policy.ModifiedDateTime) { (Get-Date $policy.ModifiedDateTime).ToString('yyyy-MM-dd') } else { 'N/A' })</td>
                </tr>"
            })
        </table>
        
        <div class="footer">
            <p><strong>📊 Analysis Complete</strong></p>
            <p>Report generated by Enhanced Conditional Access Policy Analyzer</p>
            <p>Optimized for Security Reader role | Focus: Overlap detection and consolidation</p>
            <p style="margin-top: 20px; font-size: 0.9em;">
                💡 <strong>Next Steps:</strong> Review high-priority recommendations above, 
                export detailed data using CSV format, and plan consolidation activities with your security team.
            </p>
        </div>
    </div>
</body>
</html>
"@
    
    $html | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Status "Exported enhanced HTML report to $FilePath" "SUCCESS"
}

function Export-Results {
    Write-Header "Exporting Overlap Analysis Results"
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $baseFileName = "CAP-OverlapAnalysis-$timestamp"
    
    if ($ExportFormat -eq "CSV" -or $ExportFormat -eq "All") {
        $csvPath = Join-Path $ExportPath "$baseFileName.csv"
        Export-ToCSV -FilePath $csvPath
    }
    
    if ($ExportFormat -eq "JSON" -or $ExportFormat -eq "All") {
        $jsonPath = Join-Path $ExportPath "$baseFileName.json"
        Export-ToJSON -FilePath $jsonPath
    }
    
    if ($ExportFormat -eq "HTML" -or $ExportFormat -eq "All") {
        $htmlPath = Join-Path $ExportPath "$baseFileName.html"
        Export-ToHTML -FilePath $htmlPath
        
        # Open the HTML report
        try {
            Start-Process $htmlPath
            Write-Status "Opening overlap analysis report in default browser..." "SUCCESS"
        }
        catch {
            Write-Status "Report saved but couldn't open automatically: $htmlPath" "WARNING"
        }
    }
    
    Write-Status "All analysis files exported to: $ExportPath" "SUCCESS"
}

function Show-Summary {
    Write-Header "Overlap Analysis Summary"
    
    Write-Host "📊 Policy Overview:" -ForegroundColor Yellow
    Write-Host "   Total Policies: $($script:OverlapAnalysis.TotalPolicies)"
    Write-Host "   Enabled Policies: $($script:OverlapAnalysis.EnabledPolicies)" -ForegroundColor Green
    Write-Host "   Overlap Threshold Used: $($OverlapThreshold)%" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🔍 Overlap Detection Results:" -ForegroundColor Yellow
    Write-Host "   Overlap Groups Found: $($script:OverlapAnalysis.OverlapGroups.Count)" -ForegroundColor $(if ($script:OverlapAnalysis.OverlapGroups.Count -gt 0) { "Red" } else { "Green" })
    Write-Host "   Consolidation Opportunities: $($script:OverlapAnalysis.ConsolidationOpportunities.Count)" -ForegroundColor $(if ($script:OverlapAnalysis.ConsolidationOpportunities.Count -gt 0) { "Yellow" } else { "Green" })
    Write-Host "   Weeding Candidates: $($script:OverlapAnalysis.WeedingPriority.Count)" -ForegroundColor $(if ($script:OverlapAnalysis.WeedingPriority.Count -gt 0) { "Yellow" } else { "Green" })
    Write-Host ""
    
    Write-Host "💡 Potential Savings:" -ForegroundColor Yellow
    Write-Host "   Policies Can Be Removed: $($script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeRemoved)" -ForegroundColor Green
    Write-Host "   Policies Can Be Merged: $($script:OverlapAnalysis.SavingsEstimate.PoliciesCanBeMerged)" -ForegroundColor Green
    Write-Host "   Complexity Reduction: $($script:OverlapAnalysis.SavingsEstimate.ComplexityReduction)%" -ForegroundColor Green
    Write-Host ""
    
    if ($script:OverlapAnalysis.WeedingPriority.Count -gt 0) {
        Write-Host "🎯 Top Priority Actions:" -ForegroundColor Yellow
        $topPriority = $script:OverlapAnalysis.WeedingPriority | Where-Object { $_.Priority -eq 1 } | Select-Object -First 3
        foreach ($item in $topPriority) {
            Write-Host "   • '$($item.Policy.DisplayName)' - $($item.Reason)" -ForegroundColor Red
        }
        if ($script:OverlapAnalysis.WeedingPriority.Count -gt 3) {
            Write-Host "   ... and $($script:OverlapAnalysis.WeedingPriority.Count - 3) more (see detailed report)" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "✅ No overlapping policies found - your policy set is well-organized!" -ForegroundColor Green
    }
}

# Main execution function
function Main {
    Write-Header "Enhanced Conditional Access Policy Overlap Analyzer"
    Write-Host "🔍 Specialized for identifying overlapping and duplicate policies" -ForegroundColor Cyan
    Write-Host "👤 Optimized for Security Reader role permissions" -ForegroundColor Cyan
    Write-Host ""
    
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
    
    Analyze-PolicyOverlaps
    Generate-WeedingPriority
    
    if ($ConsolidationPlan) {
        Generate-ConsolidationRecommendations
    }
    
    if ($DetailedComparison) {
        Create-PolicyComparisonMatrix
    }
    
    Show-Summary
    Export-Results
    
    Write-Header "Overlap Analysis Complete"
    Write-Status "✅ Analysis completed successfully!" "SUCCESS"
    Write-Status "📊 Check the exported files for detailed overlap analysis and consolidation recommendations" "SUCCESS"
    Write-Status "🎯 Focus on high-priority recommendations for immediate impact" "SUCCESS"
}

# Run the enhanced analyzer
Main