#Requires -Modules Microsoft.Graph.Authentication, Microsoft.Graph.Identity.DirectoryManagement, Microsoft.Graph.Groups

<#
.SYNOPSIS
    Queries all Azure AD role assignments and expands nested group memberships.

.DESCRIPTION
    This script provides a complete audit of Azure AD role assignments including:
    - Active (permanent) role assignments
    - PIM eligible role assignments (requires Azure AD Premium P2)
    - Expansion of group-based assignments including nested groups
    - Both transitive (fast) and recursive (shows path) expansion methods

.PARAMETER OutputPath
    Base path for output files. Timestamp will be appended.

.PARAMETER IncludePIM
    Include PIM eligible assignments (requires Azure AD Premium P2).

.PARAMETER UseRecursiveExpansion
    Use recursive expansion to show full nesting path. Slower but more detailed.

.PARAMETER CompareExpansionMethods
    Run both expansion methods and compare results (for testing/validation).

.PARAMETER TestGroupId
    Test group expansion on a specific group by ID.

.PARAMETER TestGroupName
    Test group expansion on a specific group by name.

.EXAMPLE
    .\Get-AzureADRoleAssignments.ps1
    Basic run - gets active assignments with transitive expansion.

.EXAMPLE
    .\Get-AzureADRoleAssignments.ps1 -IncludePIM
    Include PIM eligible assignments.

.EXAMPLE
    .\Get-AzureADRoleAssignments.ps1 -IncludePIM -UseRecursiveExpansion
    Full audit with nesting paths shown.

.EXAMPLE
    .\Get-AzureADRoleAssignments.ps1 -CompareExpansionMethods -TestGroupName "IT-Admins"
    Compare expansion methods on a specific group.

.NOTES
    Requires Microsoft Graph PowerShell SDK
    Permissions needed: RoleManagement.Read.Directory, Group.Read.All, Directory.Read.All
#>

[CmdletBinding(DefaultParameterSetName = 'Audit')]
param(
    [Parameter(ParameterSetName = 'Audit')]
    [Parameter(ParameterSetName = 'Compare')]
    [string]$OutputPath = ".\AzureAD_RoleAudit",

    [Parameter(ParameterSetName = 'Audit')]
    [switch]$IncludePIM,

    [Parameter(ParameterSetName = 'Audit')]
    [switch]$UseRecursiveExpansion,

    [Parameter(ParameterSetName = 'Compare', Mandatory)]
    [switch]$CompareExpansionMethods,

    [Parameter(ParameterSetName = 'Compare')]
    [string]$TestGroupId,

    [Parameter(ParameterSetName = 'Compare')]
    [string]$TestGroupName
)

#region Helper Functions

function Connect-ToGraph {
    Write-Host "`nConnecting to Microsoft Graph..." -ForegroundColor Yellow
    try {
        $context = Get-MgContext
        if (-not $context) {
            Connect-MgGraph -Scopes "RoleManagement.Read.Directory", "Group.Read.All", "Directory.Read.All" -NoWelcome
        }
        $context = Get-MgContext
        Write-Host "Connected as: $($context.Account)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Failed to connect to Microsoft Graph: $_"
        return $false
    }
}

function Get-TransitiveGroupMembers {
    <#
    .SYNOPSIS
        Expands group members using transitive membership (fast, single API call).
    #>
    param(
        [Parameter(Mandatory)]
        [string]$GroupId,
        [string]$GroupName = "Unknown"
    )

    $members = @()
    try {
        $transitiveMembers = Get-MgGroupTransitiveMember -GroupId $GroupId -All

        foreach ($member in $transitiveMembers) {
            $memberType = $member.AdditionalProperties["@odata.type"]

            # Skip groups - we only want end users/service principals
            if ($memberType -eq "#microsoft.graph.group") {
                continue
            }

            $members += [PSCustomObject]@{
                MemberId          = $member.Id
                MemberDisplayName = $member.AdditionalProperties["displayName"]
                MemberUPN         = $member.AdditionalProperties["userPrincipalName"]
                MemberType        = $memberType -replace "#microsoft.graph.", ""
                SourceGroupId     = $GroupId
                SourceGroupName   = $GroupName
                NestingPath       = $GroupName
                NestingLevel      = 0
            }
        }
    }
    catch {
        Write-Warning "Failed to get transitive members for group $GroupName : $_"
    }

    return $members
}

function Get-RecursiveGroupMembers {
    <#
    .SYNOPSIS
        Expands group members recursively (slower, but shows full nesting path).
    #>
    param(
        [Parameter(Mandatory)]
        [string]$GroupId,
        [string]$GroupName = "Unknown",
        [string]$Path = "",
        [int]$Level = 0,
        [hashtable]$ProcessedGroups = @{}
    )

    # Prevent infinite loops from circular references
    if ($ProcessedGroups.ContainsKey($GroupId)) {
        return @()
    }
    $ProcessedGroups[$GroupId] = $true

    $currentPath = if ($Path) { "$Path -> $GroupName" } else { $GroupName }
    $members = @()

    try {
        $directMembers = Get-MgGroupMember -GroupId $GroupId -All

        foreach ($member in $directMembers) {
            $memberType = $member.AdditionalProperties["@odata.type"]

            if ($memberType -eq "#microsoft.graph.group") {
                # Recursively expand nested group
                $nestedMembers = Get-RecursiveGroupMembers `
                    -GroupId $member.Id `
                    -GroupName $member.AdditionalProperties["displayName"] `
                    -Path $currentPath `
                    -Level ($Level + 1) `
                    -ProcessedGroups $ProcessedGroups

                $members += $nestedMembers
            }
            else {
                $members += [PSCustomObject]@{
                    MemberId          = $member.Id
                    MemberDisplayName = $member.AdditionalProperties["displayName"]
                    MemberUPN         = $member.AdditionalProperties["userPrincipalName"]
                    MemberType        = $memberType -replace "#microsoft.graph.", ""
                    SourceGroupId     = $GroupId
                    SourceGroupName   = $GroupName
                    NestingPath       = $currentPath
                    NestingLevel      = $Level
                }
            }
        }
    }
    catch {
        Write-Warning "Failed to get members for group $GroupName : $_"
    }

    return $members
}

function Expand-GroupMembers {
    <#
    .SYNOPSIS
        Wrapper function to expand group members using selected method.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$GroupId,
        [string]$GroupName = "Unknown",
        [bool]$UseRecursive = $false
    )

    if ($UseRecursive) {
        return Get-RecursiveGroupMembers -GroupId $GroupId -GroupName $GroupName
    }
    else {
        return Get-TransitiveGroupMembers -GroupId $GroupId -GroupName $GroupName
    }
}

#endregion

#region Comparison Mode

function Invoke-ExpansionComparison {
    param(
        [string]$GroupId,
        [string]$GroupName
    )

    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Group Expansion Method Comparison" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    # Find target group
    $targetGroup = $null

    if ($GroupId) {
        try {
            $targetGroup = Get-MgGroup -GroupId $GroupId
        }
        catch {
            Write-Error "Could not find group with ID: $GroupId"
            return
        }
    }
    elseif ($GroupName) {
        $groups = Get-MgGroup -Filter "displayName eq '$GroupName'"
        if ($groups) {
            $targetGroup = $groups | Select-Object -First 1
        }
        else {
            Write-Error "Could not find group with name: $GroupName"
            return
        }
    }
    else {
        # Interactive selection
        Write-Host "`nFetching groups..." -ForegroundColor Yellow
        $allGroups = Get-MgGroup -Top 50 | Sort-Object DisplayName

        Write-Host "`nAvailable groups:" -ForegroundColor Cyan
        $i = 0
        foreach ($grp in $allGroups) {
            $i++
            Write-Host "  $i. $($grp.DisplayName)"
        }

        $selection = Read-Host "`nEnter group number to test (or 'q' to quit)"
        if ($selection -eq 'q') { return }

        $targetGroup = $allGroups[$selection - 1]
    }

    if (-not $targetGroup) {
        Write-Error "No group selected"
        return
    }

    Write-Host "`nTesting Group: $($targetGroup.DisplayName)" -ForegroundColor Cyan
    Write-Host "Group ID: $($targetGroup.Id)" -ForegroundColor Gray

    # Run transitive method
    Write-Host "`n[Transitive Method] Running..." -ForegroundColor Yellow
    $transitiveStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $transitiveMembers = Get-TransitiveGroupMembers -GroupId $targetGroup.Id -GroupName $targetGroup.DisplayName
    $transitiveStopwatch.Stop()

    # Run recursive method
    Write-Host "[Recursive Method] Running..." -ForegroundColor Yellow
    $recursiveStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $recursiveMembers = Get-RecursiveGroupMembers -GroupId $targetGroup.Id -GroupName $targetGroup.DisplayName
    $recursiveStopwatch.Stop()

    # Compare results
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "COMPARISON RESULTS" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    Write-Host "`nPerformance:" -ForegroundColor Yellow
    Write-Host "  Transitive: $($transitiveStopwatch.Elapsed.TotalSeconds.ToString('F2')) seconds"
    Write-Host "  Recursive:  $($recursiveStopwatch.Elapsed.TotalSeconds.ToString('F2')) seconds"

    Write-Host "`nMember Counts:" -ForegroundColor Yellow
    Write-Host "  Transitive: $($transitiveMembers.Count) members"
    Write-Host "  Recursive:  $($recursiveMembers.Count) members"

    # Verify both methods found same members
    $transitiveIds = $transitiveMembers | Select-Object -ExpandProperty MemberId | Sort-Object
    $recursiveIds = $recursiveMembers | Select-Object -ExpandProperty MemberId | Sort-Object

    if ($transitiveIds -and $recursiveIds) {
        $comparison = Compare-Object -ReferenceObject $transitiveIds -DifferenceObject $recursiveIds -ErrorAction SilentlyContinue

        if ($comparison) {
            Write-Host "`nDiscrepancies found:" -ForegroundColor Red
            $comparison | ForEach-Object {
                $indicator = if ($_.SideIndicator -eq "<=") { "Only in Transitive" } else { "Only in Recursive" }
                Write-Host "  $($_.InputObject): $indicator"
            }
        }
        else {
            Write-Host "`nValidation: Both methods found identical members!" -ForegroundColor Green
        }
    }

    # Show recursive path details
    if ($recursiveMembers.Count -gt 0) {
        Write-Host "`nNesting Paths (from Recursive method):" -ForegroundColor Yellow
        $recursiveMembers |
            Sort-Object NestingLevel, NestingPath |
            Format-Table MemberDisplayName, MemberType, NestingLevel, NestingPath -AutoSize
    }

    # Recommendation
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "RECOMMENDATION" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host @"

For PRODUCTION use: TRANSITIVE method (default)
  - Faster and more efficient
  - Single API call regardless of nesting depth

For AUDITING/DEBUGGING: RECURSIVE method (-UseRecursiveExpansion)
  - Shows exact nesting path
  - Better for troubleshooting access issues

"@ -ForegroundColor White

    # Export
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outputFile = "GroupExpansionComparison_$timestamp.csv"
    $recursiveMembers | Export-Csv -Path $outputFile -NoTypeInformation
    Write-Host "Results exported to: $outputFile" -ForegroundColor Green
}

#endregion

#region Main Audit Mode

function Invoke-RoleAudit {
    param(
        [string]$OutputPath,
        [bool]$IncludePIM,
        [bool]$UseRecursive
    )

    # Create output directory
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outputDir = "{0}_{1}" -f $OutputPath, $timestamp
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Azure AD Role Assignment Audit" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Expansion Method: $(if ($UseRecursive) { 'Recursive (shows nesting path)' } else { 'Transitive (fast)' })" -ForegroundColor Gray
    Write-Host "Include PIM: $IncludePIM" -ForegroundColor Gray

    # Get all role definitions
    Write-Host "`nFetching role definitions..." -ForegroundColor Yellow
    $roleDefinitions = Get-MgRoleManagementDirectoryRoleDefinition -All
    $roleDefHash = @{}
    foreach ($role in $roleDefinitions) {
        $roleDefHash[$role.Id] = $role
    }
    Write-Host "Found $($roleDefinitions.Count) role definitions" -ForegroundColor Green

    # Collections
    $allExpandedAssignments = @()
    $statistics = @{
        TotalActiveAssignments      = 0
        TotalEligibleAssignments    = 0
        DirectUserAssignments       = 0
        GroupBasedAssignments       = 0
        ServicePrincipalAssignments = 0
        UniqueEffectiveUsers        = @{}
        RoleCounts                  = @{}
        GroupsExpanded              = 0
    }

    #region Process Active Assignments
    Write-Host "`nFetching active role assignments..." -ForegroundColor Yellow
    try {
        $activeAssignments = Get-MgRoleManagementDirectoryRoleAssignment -All -ExpandProperty Principal
        $statistics.TotalActiveAssignments = $activeAssignments.Count
        Write-Host "Found $($activeAssignments.Count) active assignments" -ForegroundColor Green

        $i = 0
        foreach ($assignment in $activeAssignments) {
            $i++
            $roleDef = $roleDefHash[$assignment.RoleDefinitionId]
            $principal = $assignment.Principal
            $principalType = $principal.AdditionalProperties["@odata.type"] -replace "#microsoft.graph.", ""

            Write-Progress -Activity "Processing Active Assignments" -Status "$i of $($activeAssignments.Count)" -PercentComplete (($i / $activeAssignments.Count) * 100)

            if (-not $statistics.RoleCounts.ContainsKey($roleDef.DisplayName)) {
                $statistics.RoleCounts[$roleDef.DisplayName] = 0
            }

            if ($principalType -eq "group") {
                $statistics.GroupBasedAssignments++
                $statistics.GroupsExpanded++

                $groupId = $principal.Id
                $groupName = $principal.AdditionalProperties["displayName"]

                Write-Host "  Expanding group: $groupName" -ForegroundColor Cyan

                $expandedMembers = Expand-GroupMembers -GroupId $groupId -GroupName $groupName -UseRecursive $UseRecursive

                foreach ($member in $expandedMembers) {
                    $statistics.RoleCounts[$roleDef.DisplayName]++
                    $statistics.UniqueEffectiveUsers[$member.MemberId] = $member.MemberDisplayName

                    $allExpandedAssignments += [PSCustomObject]@{
                        RoleId                 = $roleDef.Id
                        RoleName               = $roleDef.DisplayName
                        RoleDescription        = $roleDef.Description
                        AssignmentType         = "Active"
                        AssignmentMethod       = "Group-Based"
                        AssignedPrincipalId    = $groupId
                        AssignedPrincipalName  = $groupName
                        AssignedPrincipalType  = "group"
                        EffectivePrincipalId   = $member.MemberId
                        EffectivePrincipalName = $member.MemberDisplayName
                        EffectivePrincipalUPN  = $member.MemberUPN
                        EffectivePrincipalType = $member.MemberType
                        NestingPath            = $member.NestingPath
                        NestingLevel           = $member.NestingLevel
                        DirectoryScope         = $assignment.DirectoryScopeId
                        EligibilityStart       = $null
                        EligibilityEnd         = $null
                    }
                }
            }
            else {
                if ($principalType -eq "user") {
                    $statistics.DirectUserAssignments++
                }
                else {
                    $statistics.ServicePrincipalAssignments++
                }
                $statistics.RoleCounts[$roleDef.DisplayName]++
                $statistics.UniqueEffectiveUsers[$principal.Id] = $principal.AdditionalProperties["displayName"]

                $allExpandedAssignments += [PSCustomObject]@{
                    RoleId                 = $roleDef.Id
                    RoleName               = $roleDef.DisplayName
                    RoleDescription        = $roleDef.Description
                    AssignmentType         = "Active"
                    AssignmentMethod       = "Direct"
                    AssignedPrincipalId    = $principal.Id
                    AssignedPrincipalName  = $principal.AdditionalProperties["displayName"]
                    AssignedPrincipalType  = $principalType
                    EffectivePrincipalId   = $principal.Id
                    EffectivePrincipalName = $principal.AdditionalProperties["displayName"]
                    EffectivePrincipalUPN  = $principal.AdditionalProperties["userPrincipalName"]
                    EffectivePrincipalType = $principalType
                    NestingPath            = "Direct"
                    NestingLevel           = 0
                    DirectoryScope         = $assignment.DirectoryScopeId
                    EligibilityStart       = $null
                    EligibilityEnd         = $null
                }
            }
        }
        Write-Progress -Activity "Processing Active Assignments" -Completed
    }
    catch {
        Write-Warning "Failed to get active assignments: $_"
    }
    #endregion

    #region Process PIM Eligible Assignments
    if ($IncludePIM) {
        Write-Host "`nFetching PIM eligible assignments..." -ForegroundColor Yellow
        try {
            $eligibleAssignments = Get-MgRoleManagementDirectoryRoleEligibilityScheduleInstance -All -ExpandProperty Principal
            $statistics.TotalEligibleAssignments = $eligibleAssignments.Count
            Write-Host "Found $($eligibleAssignments.Count) eligible assignments" -ForegroundColor Green

            $i = 0
            foreach ($assignment in $eligibleAssignments) {
                $i++
                $roleDef = $roleDefHash[$assignment.RoleDefinitionId]
                $principal = $assignment.Principal
                $principalType = $principal.AdditionalProperties["@odata.type"] -replace "#microsoft.graph.", ""

                Write-Progress -Activity "Processing Eligible Assignments" -Status "$i of $($eligibleAssignments.Count)" -PercentComplete (($i / $eligibleAssignments.Count) * 100)

                if ($principalType -eq "group") {
                    $statistics.GroupsExpanded++

                    $groupId = $principal.Id
                    $groupName = $principal.AdditionalProperties["displayName"]

                    Write-Host "  Expanding eligible group: $groupName" -ForegroundColor Cyan

                    $expandedMembers = Expand-GroupMembers -GroupId $groupId -GroupName $groupName -UseRecursive $UseRecursive

                    foreach ($member in $expandedMembers) {
                        $statistics.UniqueEffectiveUsers[$member.MemberId] = $member.MemberDisplayName

                        $allExpandedAssignments += [PSCustomObject]@{
                            RoleId                 = $roleDef.Id
                            RoleName               = $roleDef.DisplayName
                            RoleDescription        = $roleDef.Description
                            AssignmentType         = "Eligible"
                            AssignmentMethod       = "Group-Based"
                            AssignedPrincipalId    = $groupId
                            AssignedPrincipalName  = $groupName
                            AssignedPrincipalType  = "group"
                            EffectivePrincipalId   = $member.MemberId
                            EffectivePrincipalName = $member.MemberDisplayName
                            EffectivePrincipalUPN  = $member.MemberUPN
                            EffectivePrincipalType = $member.MemberType
                            NestingPath            = $member.NestingPath
                            NestingLevel           = $member.NestingLevel
                            DirectoryScope         = $assignment.DirectoryScopeId
                            EligibilityStart       = $assignment.StartDateTime
                            EligibilityEnd         = $assignment.EndDateTime
                        }
                    }
                }
                else {
                    $statistics.UniqueEffectiveUsers[$principal.Id] = $principal.AdditionalProperties["displayName"]

                    $allExpandedAssignments += [PSCustomObject]@{
                        RoleId                 = $roleDef.Id
                        RoleName               = $roleDef.DisplayName
                        RoleDescription        = $roleDef.Description
                        AssignmentType         = "Eligible"
                        AssignmentMethod       = "Direct"
                        AssignedPrincipalId    = $principal.Id
                        AssignedPrincipalName  = $principal.AdditionalProperties["displayName"]
                        AssignedPrincipalType  = $principalType
                        EffectivePrincipalId   = $principal.Id
                        EffectivePrincipalName = $principal.AdditionalProperties["displayName"]
                        EffectivePrincipalUPN  = $principal.AdditionalProperties["userPrincipalName"]
                        EffectivePrincipalType = $principalType
                        NestingPath            = "Direct"
                        NestingLevel           = 0
                        DirectoryScope         = $assignment.DirectoryScopeId
                        EligibilityStart       = $assignment.StartDateTime
                        EligibilityEnd         = $assignment.EndDateTime
                    }
                }
            }
            Write-Progress -Activity "Processing Eligible Assignments" -Completed
        }
        catch {
            Write-Warning "Failed to get PIM eligible assignments (requires Azure AD Premium P2): $_"
        }
    }
    #endregion

    #region Export Results
    Write-Host "`nExporting results..." -ForegroundColor Yellow

    # All expanded assignments
    $allExpandedAssignments | Export-Csv -Path "$outputDir\AllExpandedAssignments.csv" -NoTypeInformation

    # Group-based assignments only
    $groupBasedAssignments = $allExpandedAssignments | Where-Object { $_.AssignmentMethod -eq "Group-Based" }
    $groupBasedAssignments | Export-Csv -Path "$outputDir\GroupBasedAssignments.csv" -NoTypeInformation

    # Direct assignments only
    $directAssignments = $allExpandedAssignments | Where-Object { $_.AssignmentMethod -eq "Direct" }
    $directAssignments | Export-Csv -Path "$outputDir\DirectAssignments.csv" -NoTypeInformation

    # Users with multiple roles
    $userRoleCounts = $allExpandedAssignments |
        Group-Object EffectivePrincipalId |
        Where-Object { $_.Count -gt 1 } |
        ForEach-Object {
            $userId = $_.Name
            $userAssignments = $_.Group
            [PSCustomObject]@{
                UserId      = $userId
                UserName    = $userAssignments[0].EffectivePrincipalName
                UserUPN     = $userAssignments[0].EffectivePrincipalUPN
                RoleCount   = $_.Count
                Roles       = ($userAssignments | Select-Object -ExpandProperty RoleName -Unique) -join "; "
                HasEligible = ($userAssignments | Where-Object { $_.AssignmentType -eq "Eligible" }).Count -gt 0
                HasActive   = ($userAssignments | Where-Object { $_.AssignmentType -eq "Active" }).Count -gt 0
            }
        } | Sort-Object RoleCount -Descending

    $userRoleCounts | Export-Csv -Path "$outputDir\UsersWithMultipleRoles.csv" -NoTypeInformation

    # Summary
    $summaryReport = @"
==========================================
Azure AD Role Assignment Audit Report
Generated: $(Get-Date)
==========================================

CONFIGURATION:
- Expansion Method: $(if ($UseRecursive) { 'Recursive' } else { 'Transitive' })
- PIM Included: $IncludePIM

ASSIGNMENT COUNTS:
- Total Active Assignments: $($statistics.TotalActiveAssignments)
- Total Eligible Assignments: $($statistics.TotalEligibleAssignments)
- Total Expanded Records: $($allExpandedAssignments.Count)

ASSIGNMENT METHODS:
- Direct User Assignments: $($statistics.DirectUserAssignments)
- Group-Based Assignments: $($statistics.GroupBasedAssignments)
- Service Principal Assignments: $($statistics.ServicePrincipalAssignments)
- Groups Expanded: $($statistics.GroupsExpanded)

UNIQUE EFFECTIVE PRINCIPALS:
- Total Unique Users/SPs with Role Access: $($statistics.UniqueEffectiveUsers.Count)

ROLE DISTRIBUTION:
$($statistics.RoleCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "- $($_.Key): $($_.Value) effective assignments" } | Out-String)

OUTPUT FILES:
- AllExpandedAssignments.csv - Complete expanded assignment list
- GroupBasedAssignments.csv - Only group-based assignments
- DirectAssignments.csv - Only direct assignments
- UsersWithMultipleRoles.csv - Users with 2+ roles
==========================================
"@

    $summaryReport | Out-File -FilePath "$outputDir\Summary.txt"
    Write-Host $summaryReport -ForegroundColor Cyan

    Write-Host "`nResults exported to: $outputDir" -ForegroundColor Green
    #endregion
}

#endregion

#region Main Entry Point

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Azure AD Role Assignment Tool" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Connect to Graph
if (-not (Connect-ToGraph)) {
    exit 1
}

# Execute based on mode
if ($CompareExpansionMethods) {
    Invoke-ExpansionComparison -GroupId $TestGroupId -GroupName $TestGroupName
}
else {
    Invoke-RoleAudit -OutputPath $OutputPath -IncludePIM $IncludePIM -UseRecursive $UseRecursiveExpansion
}

Write-Host "`nDone!" -ForegroundColor Green

#endregion
