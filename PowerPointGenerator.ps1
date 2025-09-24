# PowerPoint Generation Helper Functions using Open XML SDK
# This module contains the detailed implementation of PowerPoint slide creation

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Install-OpenXMLSDK {
    Write-Status "Installing Open XML SDK..." "PROGRESS"
    
    try {
        # Check if already available
        $openXmlType = [System.Type]::GetType("DocumentFormat.OpenXml.Packaging.PresentationDocument")
        if ($openXmlType) {
            Write-Status "Open XML SDK already loaded" "SUCCESS"
            return $true
        }
        
        # Create temp directory
        $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "OpenXMLSDK_$(Get-Random)"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        # Download DocumentFormat.OpenXml package from NuGet
        $packageUrl = "https://www.nuget.org/api/v2/package/DocumentFormat.OpenXml/3.0.1"
        $packagePath = Join-Path $tempDir "DocumentFormat.OpenXml.nupkg"
        
        Write-Status "Downloading Open XML SDK from NuGet..." "PROGRESS"
        try {
            Invoke-WebRequest -Uri $packageUrl -OutFile $packagePath -UseBasicParsing
        } catch {
            # Fallback to older version
            $packageUrl = "https://www.nuget.org/api/v2/package/DocumentFormat.OpenXml/2.20.0"
            Invoke-WebRequest -Uri $packageUrl -OutFile $packagePath -UseBasicParsing
        }
        
        # Extract package
        $extractPath = Join-Path $tempDir "extracted"
        [System.IO.Compression.ZipFile]::ExtractToDirectory($packagePath, $extractPath)
        
        # Find the appropriate DLL
        $possiblePaths = @(
            "$extractPath\lib\net6.0\DocumentFormat.OpenXml.dll",
            "$extractPath\lib\netstandard2.0\DocumentFormat.OpenXml.dll",
            "$extractPath\lib\net462\DocumentFormat.OpenXml.dll",
            "$extractPath\lib\net35\DocumentFormat.OpenXml.dll"
        )
        
        $dllPath = $null
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $dllPath = $path
                break
            }
        }
        
        if (!$dllPath) {
            # Find any DocumentFormat.OpenXml.dll
            $dllPath = Get-ChildItem -Path $extractPath -Name "DocumentFormat.OpenXml.dll" -Recurse | Select-Object -First 1 -ExpandProperty FullName
        }
        
        if ($dllPath) {
            Add-Type -Path $dllPath
            $script:OpenXMLDllPath = $dllPath
            Write-Status "Open XML SDK loaded from: $dllPath" "SUCCESS"
            return $true
        } else {
            Write-Status "Could not find DocumentFormat.OpenXml.dll in package" "ERROR"
            return $false
        }
    }
    catch {
        Write-Status "Error installing Open XML SDK: $($_.Exception.Message)" "ERROR"
        Write-Status "Attempting alternative installation method..." "WARNING"
        
        # Alternative: Use PackageManagement
        try {
            Install-Package DocumentFormat.OpenXml -Source nuget.org -Force -SkipDependencies
            $packagePath = (Get-Package DocumentFormat.OpenXml).Source
            if ($packagePath) {
                $dllPath = Get-ChildItem -Path (Split-Path $packagePath) -Name "DocumentFormat.OpenXml.dll" -Recurse | Select-Object -First 1 -ExpandProperty FullName
                if ($dllPath) {
                    Add-Type -Path $dllPath
                    Write-Status "Open XML SDK loaded via PackageManagement" "SUCCESS"
                    return $true
                }
            }
        } catch {
            Write-Status "PackageManagement installation also failed" "ERROR"
        }
        
        return $false
    }
}

function New-BasicPowerPointPresentation {
    param(
        [string]$FilePath,
        [string]$Title = "Conditional Access Policies",
        [array]$Policies
    )
    
    try {
        # Create the presentation document
        $presentationDocument = [DocumentFormat.OpenXml.Packaging.PresentationDocument]::Create(
            $FilePath, 
            [DocumentFormat.OpenXml.PresentationDocumentType]::Presentation
        )
        
        # Create the presentation part
        $presentationPart = $presentationDocument.AddPresentationPart()
        
        # Create the presentation
        $presentation = New-Object DocumentFormat.OpenXml.Presentation.Presentation
        
        # Create slide master part (required)
        $slideMasterPart = $presentationPart.AddSlideMasterPart()
        $slideMaster = Create-SlideMaster
        $slideMasterPart.SlideMaster = $slideMaster
        
        # Create slide layout part
        $slideLayoutPart = $slideMasterPart.AddSlideLayoutPart([DocumentFormat.OpenXml.Packaging.SlideLayoutPartType]::TitleAndContent)
        $slideLayout = Create-SlideLayout
        $slideLayoutPart.SlideLayout = $slideLayout
        
        # Create slide ID list
        $slideIdList = New-Object DocumentFormat.OpenXml.Presentation.SlideIdList
        
        # Create title slide
        $titleSlideId = Add-TitleSlideToPresentation -PresentationPart $presentationPart -SlideIdList $slideIdList -Title $Title -PolicyCount $Policies.Count
        
        # Create policy slides
        $slideNumber = 2
        foreach ($policy in $Policies) {
            $slideId = Add-PolicySlideToPresentation -PresentationPart $presentationPart -SlideIdList $slideIdList -Policy $policy -SlideNumber $slideNumber
            $slideNumber++
        }
        
        # Add slide ID list to presentation
        $presentation.Append($slideIdList)
        
        # Set the presentation
        $presentationPart.Presentation = $presentation
        
        # Save and close
        $presentationDocument.Close()
        
        return $true
    }
    catch {
        Write-Status "Error creating PowerPoint: $($_.Exception.Message)" "ERROR"
        if ($presentationDocument) {
            $presentationDocument.Dispose()
        }
        return $false
    }
}

function Create-SlideMaster {
    $slideMaster = New-Object DocumentFormat.OpenXml.Presentation.SlideMaster
    
    # Add basic slide master content
    $commonSlideData = New-Object DocumentFormat.OpenXml.Presentation.CommonSlideData
    $shapeTree = New-Object DocumentFormat.OpenXml.Presentation.ShapeTree
    
    # Add required elements for a valid slide master
    $nonVisualGroupShapeProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualGroupShapeProperties
    $nonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualDrawingProperties
    $nonVisualDrawingProperties.Id = [uint32]1
    $nonVisualDrawingProperties.Name = ""
    
    $nonVisualGroupShapeDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualGroupShapeDrawingProperties
    $applicationNonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.ApplicationNonVisualDrawingProperties
    
    $nonVisualGroupShapeProperties.Append($nonVisualDrawingProperties)
    $nonVisualGroupShapeProperties.Append($nonVisualGroupShapeDrawingProperties)
    $nonVisualGroupShapeProperties.Append($applicationNonVisualDrawingProperties)
    
    $groupShapeProperties = New-Object DocumentFormat.OpenXml.Presentation.GroupShapeProperties
    
    $shapeTree.Append($nonVisualGroupShapeProperties)
    $shapeTree.Append($groupShapeProperties)
    
    $commonSlideData.Append($shapeTree)
    $slideMaster.Append($commonSlideData)
    
    # Add color map (simplified)
    $colorMap = New-Object DocumentFormat.OpenXml.Presentation.ColorMap
    $colorMap.Background1 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Light1
    $colorMap.Text1 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Dark1
    $colorMap.Background2 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Light2
    $colorMap.Text2 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Dark2
    $colorMap.Accent1 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent1
    $colorMap.Accent2 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent2
    $colorMap.Accent3 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent3
    $colorMap.Accent4 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent4
    $colorMap.Accent5 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent5
    $colorMap.Accent6 = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Accent6
    $colorMap.Hyperlink = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::Hyperlink
    $colorMap.FollowedHyperlink = [DocumentFormat.OpenXml.Drawing.ColorSchemeIndexValues]::FollowedHyperlink
    
    $slideMaster.Append($colorMap)
    
    return $slideMaster
}

function Create-SlideLayout {
    $slideLayout = New-Object DocumentFormat.OpenXml.Presentation.SlideLayout
    $slideLayout.Type = [DocumentFormat.OpenXml.Presentation.SlideLayoutValues]::TitleAndContent
    
    # Add common slide data
    $commonSlideData = New-Object DocumentFormat.OpenXml.Presentation.CommonSlideData
    $shapeTree = New-Object DocumentFormat.OpenXml.Presentation.ShapeTree
    
    # Add required elements
    $nonVisualGroupShapeProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualGroupShapeProperties
    $nonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualDrawingProperties
    $nonVisualDrawingProperties.Id = 1
    $nonVisualDrawingProperties.Name = ""
    
    $nonVisualGroupShapeDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualGroupShapeDrawingProperties
    $applicationNonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.ApplicationNonVisualDrawingProperties
    
    $nonVisualGroupShapeProperties.Append($nonVisualDrawingProperties)
    $nonVisualGroupShapeProperties.Append($nonVisualGroupShapeDrawingProperties)
    $nonVisualGroupShapeProperties.Append($applicationNonVisualDrawingProperties)
    
    $groupShapeProperties = New-Object DocumentFormat.OpenXml.Presentation.GroupShapeProperties
    
    $shapeTree.Append($nonVisualGroupShapeProperties)
    $shapeTree.Append($groupShapeProperties)
    
    $commonSlideData.Append($shapeTree)
    $slideLayout.Append($commonSlideData)
    
    return $slideLayout
}

function Add-TitleSlideToPresentation {
    param(
        $PresentationPart,
        $SlideIdList,
        [string]$Title,
        [int]$PolicyCount
    )
    
    # Create slide part
    $slidePart = $PresentationPart.AddSlidePart()
    
    # Create slide
    $slide = New-Object DocumentFormat.OpenXml.Presentation.Slide
    $commonSlideData = New-Object DocumentFormat.OpenXml.Presentation.CommonSlideData
    $shapeTree = New-Object DocumentFormat.OpenXml.Presentation.ShapeTree
    
    # Add title and subtitle text boxes
    $titleShape = Create-TextShape -Text $Title -X 1166400 -Y 685800 -Width 8229600 -Height 1200000 -FontSize 4400 -IsBold $true
    $subtitleShape = Create-TextShape -Text "Security Reader Analysis - $PolicyCount Policies Found" -X 1166400 -Y 2072400 -Width 8229600 -Height 1000000 -FontSize 2400 -IsBold $false
    $dateShape = Create-TextShape -Text "Generated: $(Get-Date -Format 'MMMM dd, yyyy')" -X 1166400 -Y 3400000 -Width 8229600 -Height 600000 -FontSize 1800 -IsBold $false
    
    # Add shapes to tree
    $shapeTree.Append($titleShape)
    $shapeTree.Append($subtitleShape)
    $shapeTree.Append($dateShape)
    
    $commonSlideData.Append($shapeTree)
    $slide.Append($commonSlideData)
    $slidePart.Slide = $slide
    
    # Add slide ID
    $slideId = New-Object DocumentFormat.OpenXml.Presentation.SlideId
    $slideId.Id = [uint32]256
    $slideId.RelationshipId = $PresentationPart.GetIdOfPart($slidePart)
    $SlideIdList.Append($slideId)
    
    return $slideId
}

function Add-PolicySlideToPresentation {
    param(
        $PresentationPart,
        $SlideIdList,
        $Policy,
        [int]$SlideNumber
    )
    
    # Create slide part
    $slidePart = $PresentationPart.AddSlidePart()
    
    # Create slide
    $slide = New-Object DocumentFormat.OpenXml.Presentation.Slide
    $commonSlideData = New-Object DocumentFormat.OpenXml.Presentation.CommonSlideData
    $shapeTree = New-Object DocumentFormat.OpenXml.Presentation.ShapeTree
    
    # Policy title
    $policyName = $Policy.DisplayName
    if ($MaskSensitiveData -contains "PolicyName") {
        $policyName = "Policy $(Get-Random -Minimum 1000 -Maximum 9999)"
    }
    
    $titleShape = Create-TextShape -Text $policyName -X 457200 -Y 274638 -Width 8229600 -Height 1143000 -FontSize 3200 -IsBold $true
    $shapeTree.Append($titleShape)
    
    # Policy state indicator
    $stateColor = switch ($Policy.State) {
        "enabled" { "00FF00" }  # Green
        "disabled" { "FF0000" }  # Red
        "enabledForReportingButNotEnforced" { "FFA500" }  # Orange
        default { "808080" }  # Gray
    }
    
    $stateText = switch ($Policy.State) {
        "enabled" { "ENABLED" }
        "disabled" { "DISABLED" }
        "enabledForReportingButNotEnforced" { "REPORT ONLY" }
        default { $Policy.State.ToUpper() }
    }
    
    $stateShape = Create-TextShape -Text "Status: $stateText" -X 457200 -Y 1500000 -Width 3000000 -Height 600000 -FontSize 1800 -IsBold $true -Color $stateColor
    $shapeTree.Append($stateShape)
    
    # Policy details
    $yPosition = 2200000
    $lineHeight = 400000
    
    # Users section
    if ($Policy.Conditions.Users) {
        $usersText = Format-PolicyUsers -Users $Policy.Conditions.Users
        $usersShape = Create-TextShape -Text "Users: $usersText" -X 457200 -Y $yPosition -Width 8229600 -Height 800000 -FontSize 1400 -IsBold $false
        $shapeTree.Append($usersShape)
        $yPosition += $lineHeight * 2
    }
    
    # Applications section
    if ($Policy.Conditions.Applications) {
        $appsText = Format-PolicyApplications -Applications $Policy.Conditions.Applications
        $appsShape = Create-TextShape -Text "Applications: $appsText" -X 457200 -Y $yPosition -Width 8229600 -Height 800000 -FontSize 1400 -IsBold $false
        $shapeTree.Append($appsShape)
        $yPosition += $lineHeight * 2
    }
    
    # Grant Controls section
    if ($Policy.GrantControls) {
        $controlsText = Format-GrantControls -GrantControls $Policy.GrantControls
        $controlsShape = Create-TextShape -Text "Grant Controls: $controlsText" -X 457200 -Y $yPosition -Width 8229600 -Height 800000 -FontSize 1400 -IsBold $false
        $shapeTree.Append($controlsShape)
        $yPosition += $lineHeight * 2
    }
    
    $commonSlideData.Append($shapeTree)
    $slide.Append($commonSlideData)
    $slidePart.Slide = $slide
    
    # Add slide ID
    $slideId = New-Object DocumentFormat.OpenXml.Presentation.SlideId
    $slideId.Id = [uint32](255 + $SlideNumber)
    $slideId.RelationshipId = $PresentationPart.GetIdOfPart($slidePart)
    $SlideIdList.Append($slideId)
    
    return $slideId
}

function Create-TextShape {
    param(
        [string]$Text,
        [long]$X,
        [long]$Y,
        [long]$Width,
        [long]$Height,
        [int]$FontSize = 1800,
        [bool]$IsBold = $false,
        [string]$Color = "000000"
    )
    
    $shape = New-Object DocumentFormat.OpenXml.Presentation.Shape
    
    # Non-visual shape properties
    $nonVisualShapeProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualShapeProperties
    $nonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualDrawingProperties
    $nonVisualDrawingProperties.Id = [uint32](Get-Random -Minimum 2 -Maximum 1000000)
    $nonVisualDrawingProperties.Name = "TextBox"
    
    $nonVisualShapeDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.NonVisualShapeDrawingProperties
    $applicationNonVisualDrawingProperties = New-Object DocumentFormat.OpenXml.Presentation.ApplicationNonVisualDrawingProperties
    
    $nonVisualShapeProperties.Append($nonVisualDrawingProperties)
    $nonVisualShapeProperties.Append($nonVisualShapeDrawingProperties)
    $nonVisualShapeProperties.Append($applicationNonVisualDrawingProperties)
    
    # Shape properties
    $shapeProperties = New-Object DocumentFormat.OpenXml.Presentation.ShapeProperties
    $transform2D = New-Object DocumentFormat.OpenXml.Drawing.Transform2D
    $offset = New-Object DocumentFormat.OpenXml.Drawing.Offset
    $offset.X = $X
    $offset.Y = $Y
    $extents = New-Object DocumentFormat.OpenXml.Drawing.Extents
    $extents.Cx = $Width
    $extents.Cy = $Height
    $transform2D.Append($offset)
    $transform2D.Append($extents)
    
    $presetGeometry = New-Object DocumentFormat.OpenXml.Drawing.PresetGeometry
    $presetGeometry.Preset = [DocumentFormat.OpenXml.Drawing.ShapeTypeValues]::Rectangle
    
    $shapeProperties.Append($transform2D)
    $shapeProperties.Append($presetGeometry)
    
    # Text body
    $textBody = New-Object DocumentFormat.OpenXml.Presentation.TextBody
    $bodyProperties = New-Object DocumentFormat.OpenXml.Drawing.BodyProperties
    $listStyle = New-Object DocumentFormat.OpenXml.Drawing.ListStyle
    
    $paragraph = New-Object DocumentFormat.OpenXml.Drawing.Paragraph
    $run = New-Object DocumentFormat.OpenXml.Drawing.Run
    $runProperties = New-Object DocumentFormat.OpenXml.Drawing.RunProperties
    $runProperties.FontSize = $FontSize
    if ($IsBold) {
        $runProperties.Bold = $true
    }
    
    # Set text color
    $solidFill = New-Object DocumentFormat.OpenXml.Drawing.SolidFill
    $rgbColorModelHex = New-Object DocumentFormat.OpenXml.Drawing.RgbColorModelHex
    $rgbColorModelHex.Val = $Color
    $solidFill.Append($rgbColorModelHex)
    $runProperties.Append($solidFill)
    
    $text = New-Object DocumentFormat.OpenXml.Drawing.Text
    $text.Text = $Text
    
    $run.Append($runProperties)
    $run.Append($text)
    $paragraph.Append($run)
    
    $textBody.Append($bodyProperties)
    $textBody.Append($listStyle)
    $textBody.Append($paragraph)
    
    # Assemble shape
    $shape.Append($nonVisualShapeProperties)
    $shape.Append($shapeProperties)
    $shape.Append($textBody)
    
    return $shape
}

function Format-PolicyUsers {
    param($Users)
    
    $result = @()
    
    if ($Users.IncludeUsers) {
        foreach ($userId in $Users.IncludeUsers) {
            if ($MaskSensitiveData -contains "User") {
                $result += "User-$(Get-Random -Minimum 100 -Maximum 999)"
            } else {
                $userName = Get-FriendlyName -Id $userId -Type "User" -DefaultValue $userId
                $result += $userName
            }
        }
    }
    
    if ($Users.IncludeGroups) {
        foreach ($groupId in $Users.IncludeGroups) {
            if ($MaskSensitiveData -contains "Group") {
                $result += "Group-$(Get-Random -Minimum 100 -Maximum 999)"
            } else {
                $groupName = Get-FriendlyName -Id $groupId -Type "Group" -DefaultValue $groupId
                $result += $groupName
            }
        }
    }
    
    if ($Users.IncludeRoles) {
        foreach ($roleId in $Users.IncludeRoles) {
            $roleName = Get-FriendlyName -Id $roleId -Type "Role" -DefaultValue $roleId
            $result += $roleName
        }
    }
    
    return ($result | Select-Object -First 5) -join ", "
}

function Format-PolicyApplications {
    param($Applications)
    
    $result = @()
    
    if ($Applications.IncludeApplications) {
        foreach ($appId in $Applications.IncludeApplications) {
            if ($MaskSensitiveData -contains "Application") {
                $result += "App-$(Get-Random -Minimum 100 -Maximum 999)"
            } else {
                $appName = Get-FriendlyName -Id $appId -Type "Application" -DefaultValue $appId
                $result += $appName
            }
        }
    }
    
    return ($result | Select-Object -First 5) -join ", "
}

function Format-GrantControls {
    param($GrantControls)
    
    $result = @()
    
    if ($GrantControls.BuiltInControls) {
        $result += $GrantControls.BuiltInControls -join ", "
    }
    
    if ($GrantControls.Operator) {
        $result = $result -join " $($GrantControls.Operator) "
    }
    
    return $result -join ", "
}