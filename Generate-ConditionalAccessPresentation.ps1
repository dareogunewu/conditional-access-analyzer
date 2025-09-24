#Requires -Modules Microsoft.Graph.Authentication, Microsoft.Graph.Identity.SignIns

<#
.SYNOPSIS
    Conditional Access Policy PowerPoint Generator - Security Reader Edition

.DESCRIPTION
    PowerShell script for Security Reader role users to generate professional PowerPoint presentations
    from Conditional Access policies using free Open XML SDK (no Syncfusion licensing required).
    
    Features:
    - Works with Security Reader permissions
    - Generates professional PowerPoint presentations
    - Uses free Microsoft Open XML SDK
    - No deployment required - run ad-hoc
    - Customizable masking options for sensitive data

.PARAMETER ExportPath
    Path where the PowerPoint presentation will be saved (default: current directory)

.PARAMETER MaskSensitiveData
    Array of data types to mask: PolicyName, Group, User, Application, ExternalTenant, TermsOfUse, NamedLocation

.PARAMETER GroupByState
    Group slides by policy state (Enabled, Disabled, ReportOnly) - default: true

.PARAMETER IncludeDisabled
    Include disabled policies in the presentation - default: true

.EXAMPLE
    .\Generate-ConditionalAccessPresentation.ps1
    
.EXAMPLE
    .\Generate-ConditionalAccessPresentation.ps1 -MaskSensitiveData @("PolicyName", "User", "Group")

.NOTES
    Author: Conditional Access PowerPoint Generator
    Optimized for: Security Reader role users
    Permissions Required: Policy.Read.All, Directory.Read.All
    Dependencies: Open XML SDK (automatically installed)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ExportPath = (Get-Location).Path,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("PolicyName", "Group", "User", "Application", "ExternalTenant", "TermsOfUse", "NamedLocation")]
    [string[]]$MaskSensitiveData = @(),
    
    [Parameter(Mandatory = $false)]
    [bool]$GroupByState = $true,
    
    [Parameter(Mandatory = $false)]
    [bool]$IncludeDisabled = $true
)

# Global variables
$script:Policies = @()
$script:GraphData = @{
    Users = @{}
    Groups = @{}
    Applications = @{}
    Roles = @{}
    Locations = @{}
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
        "PROGRESS" { "Cyan" }
        default { "White" }
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Test-RequiredModules {
    Write-Status "Checking required PowerShell modules..." "PROGRESS"
    
    $requiredModules = @(
        "Microsoft.Graph.Authentication",
        "Microsoft.Graph.Identity.SignIns"
    )
    
    $missingModules = @()
    
    foreach ($module in $requiredModules) {
        if (!(Get-Module -ListAvailable -Name $module)) {
            $missingModules += $module
        }
    }
    
    if ($missingModules.Count -gt 0) {
        Write-Status "Missing required modules: $($missingModules -join ', ')" "ERROR"
        Write-Status "Please install missing modules using:" "ERROR"
        foreach ($module in $missingModules) {
            Write-Host "  Install-Module $module -Force" -ForegroundColor Red
        }
        return $false
    }
    
    Write-Status "All required modules are available" "SUCCESS"
    return $true
}

# Import PowerPoint generator functions
$generatorPath = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "PowerPointGenerator.ps1"
if (Test-Path $generatorPath) {
    . $generatorPath
} else {
    Write-Error "PowerPointGenerator.ps1 not found. Please ensure it's in the same directory."
    exit 1
}

function Connect-ToMicrosoftGraph {
    Write-Header "Microsoft Graph Authentication (Security Reader Role)"
    
    try {
        # Check if already connected
        $context = Get-MgContext
        if ($context) {
            Write-Status "Already connected to Microsoft Graph as $($context.Account)" "SUCCESS"
            return $true
        }
        
        Write-Status "Connecting to Microsoft Graph with Security Reader permissions..." "PROGRESS"
        
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
            Write-Status "Failed to establish connection to Microsoft Graph" "ERROR"
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
    Write-Header "Retrieving Conditional Access Policies"
    
    try {
        Write-Status "Fetching Conditional Access policies from tenant..." "PROGRESS"
        
        $policies = Get-MgIdentityConditionalAccessPolicy -All
        
        if (!$IncludeDisabled) {
            $policies = $policies | Where-Object { $_.State -ne "disabled" }
        }
        
        $script:Policies = $policies
        Write-Status "Retrieved $($policies.Count) policies" "SUCCESS"
        
        # Group policies by state for statistics
        $enabledCount = ($policies | Where-Object { $_.State -eq "enabled" }).Count
        $disabledCount = ($policies | Where-Object { $_.State -eq "disabled" }).Count
        $reportOnlyCount = ($policies | Where-Object { $_.State -eq "enabledForReportingButNotEnforced" }).Count
        
        Write-Status "Policy breakdown: $enabledCount enabled, $disabledCount disabled, $reportOnlyCount report-only" "SUCCESS"
        
        return $policies.Count -gt 0
    }
    catch {
        Write-Status "Error retrieving Conditional Access policies: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Get-GraphReferenceData {
    Write-Header "Retrieving Reference Data"
    
    try {
        Write-Status "Fetching users, groups, applications, and roles..." "PROGRESS"
        
        # Get users (limited for Security Reader)
        try {
            $users = Get-MgUser -Top 1000 -Property Id,DisplayName,UserPrincipalName
            foreach ($user in $users) {
                $script:GraphData.Users[$user.Id] = @{
                    DisplayName = $user.DisplayName
                    UserPrincipalName = $user.UserPrincipalName
                }
            }
            Write-Status "Retrieved $($users.Count) users" "SUCCESS"
        }
        catch {
            Write-Status "Limited user data available with Security Reader role" "WARNING"
        }
        
        # Get groups
        try {
            $groups = Get-MgGroup -Top 1000 -Property Id,DisplayName
            foreach ($group in $groups) {
                $script:GraphData.Groups[$group.Id] = @{
                    DisplayName = $group.DisplayName
                }
            }
            Write-Status "Retrieved $($groups.Count) groups" "SUCCESS"
        }
        catch {
            Write-Status "Could not retrieve group data" "WARNING"
        }
        
        # Get applications
        try {
            $apps = Get-MgApplication -Top 1000 -Property Id,DisplayName,AppId
            foreach ($app in $apps) {
                $script:GraphData.Applications[$app.AppId] = @{
                    DisplayName = $app.DisplayName
                    Id = $app.Id
                }
            }
            
            # Get service principals
            $servicePrincipals = Get-MgServicePrincipal -Top 1000 -Property Id,DisplayName,AppId
            foreach ($sp in $servicePrincipals) {
                if (!$script:GraphData.Applications.ContainsKey($sp.AppId)) {
                    $script:GraphData.Applications[$sp.AppId] = @{
                        DisplayName = $sp.DisplayName
                        Id = $sp.Id
                    }
                }
            }
            Write-Status "Retrieved $($apps.Count) applications and $($servicePrincipals.Count) service principals" "SUCCESS"
        }
        catch {
            Write-Status "Could not retrieve application data" "WARNING"
        }
        
        # Get directory roles
        try {
            $roles = Get-MgDirectoryRole -Property Id,DisplayName
            foreach ($role in $roles) {
                $script:GraphData.Roles[$role.Id] = @{
                    DisplayName = $role.DisplayName
                }
            }
            Write-Status "Retrieved $($roles.Count) directory roles" "SUCCESS"
        }
        catch {
            Write-Status "Could not retrieve role data" "WARNING"
        }
        
        return $true
    }
    catch {
        Write-Status "Error retrieving reference data: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Get-FriendlyName {
    param(
        [string]$Id,
        [string]$Type,
        [string]$DefaultValue = "Unknown"
    )
    
    switch ($Type.ToLower()) {
        "user" {
            if ($script:GraphData.Users.ContainsKey($Id)) {
                return $script:GraphData.Users[$Id].DisplayName
            }
        }
        "group" {
            if ($script:GraphData.Groups.ContainsKey($Id)) {
                return $script:GraphData.Groups[$Id].DisplayName
            }
        }
        "application" {
            if ($script:GraphData.Applications.ContainsKey($Id)) {
                return $script:GraphData.Applications[$Id].DisplayName
            }
        }
        "role" {
            if ($script:GraphData.Roles.ContainsKey($Id)) {
                return $script:GraphData.Roles[$Id].DisplayName
            }
        }
    }
    
    return $DefaultValue
}

function New-PowerPointPresentation {
    param(
        [string]$OutputPath,
        [array]$Policies
    )
    
    Write-Header "Generating PowerPoint Presentation"
    Write-Status "Creating PowerPoint presentation with Open XML SDK..." "PROGRESS"
    
    # Install Open XML SDK if needed
    if (!(Install-OpenXMLSDK)) {
        Write-Status "Failed to install Open XML SDK" "ERROR"
        return $false
    }
    
    try {
        # Use the basic PowerPoint creation function from PowerPointGenerator.ps1
        $success = New-BasicPowerPointPresentation -FilePath $OutputPath -Title "Conditional Access Policies" -Policies $Policies
        
        if ($success) {
            Write-Status "PowerPoint presentation created successfully: $OutputPath" "SUCCESS"
        } else {
            Write-Status "Failed to create PowerPoint presentation" "ERROR"
        }
        
        return $success
    }
    catch {
        Write-Status "Error creating PowerPoint presentation: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Main {
    Write-Header "Conditional Access PowerPoint Generator (Security Reader Edition)"
    Write-Host "🎯 Generate professional PowerPoint presentations from CA policies" -ForegroundColor Cyan
    Write-Host "👤 Optimized for Security Reader role permissions" -ForegroundColor Cyan
    Write-Host "🆓 Uses free Open XML SDK (no Syncfusion licensing)" -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    if (!(Test-RequiredModules)) {
        return
    }
    
    if (!(Install-OpenXMLSDK)) {
        return
    }
    
    # Connect to Microsoft Graph
    if (!(Connect-ToMicrosoftGraph)) {
        return
    }
    
    # Get policies and reference data
    if (!(Get-ConditionalAccessPolicies)) {
        return
    }
    
    if (!(Get-GraphReferenceData)) {
        Write-Status "Reference data retrieval failed, continuing with limited information..." "WARNING"
    }
    
    # Generate PowerPoint presentation
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outputFileName = "ConditionalAccessPolicies-$timestamp.pptx"
    $outputPath = Join-Path $ExportPath $outputFileName
    
    Write-Status "Output file: $outputPath" "PROGRESS"
    
    if (New-PowerPointPresentation -OutputPath $outputPath -Policies $script:Policies) {
        Write-Status "✅ PowerPoint presentation generated successfully!" "SUCCESS"
        Write-Status "📄 File saved to: $outputPath" "SUCCESS"
        
        # Try to open the file
        try {
            Start-Process $outputPath
            Write-Status "📖 Opening PowerPoint presentation..." "SUCCESS"
        }
        catch {
            Write-Status "Could not auto-open presentation. Please open manually: $outputPath" "WARNING"
        }
    }
    else {
        Write-Status "❌ Failed to generate PowerPoint presentation" "ERROR"
    }
    
    Write-Host ""
    Write-Status "Analysis complete!" "SUCCESS"
}

# Execute main function
Main