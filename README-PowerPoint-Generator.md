# Conditional Access PowerPoint Generator - Security Reader Edition

A standalone PowerShell script that generates professional PowerPoint presentations from your Microsoft Entra ID Conditional Access policies. Optimized for Security Reader role permissions and uses the free Open XML SDK (no Syncfusion licensing required).

## 🚀 Key Features

- **Security Reader Optimized**: Works with read-only Security Reader permissions
- **Ad-hoc Usage**: No deployment required - run whenever you need presentations
- **Free Open XML SDK**: Uses Microsoft's free Open XML SDK instead of licensed Syncfusion
- **Professional Output**: Generates polished PowerPoint presentations
- **Data Masking**: Configurable masking for sensitive information
- **Flexible Grouping**: Option to group slides by policy state

## 📋 Prerequisites

### Required PowerShell Modules
```powershell
Install-Module Microsoft.Graph.Authentication -Force
Install-Module Microsoft.Graph.Identity.SignIns -Force
```

### Required Permissions (Security Reader Role)
- `Policy.Read.All` - Read Conditional Access policies
- `Directory.Read.All` - Read directory information
- `User.Read.All` - Read user information  
- `Application.Read.All` - Read application information

### Automatic Dependencies
The script automatically downloads and installs:
- **Open XML SDK** - Microsoft's free PowerPoint manipulation library

## 🔧 Usage

### Basic Usage
```powershell
# Generate PowerPoint with all policies
.\Generate-ConditionalAccessPresentation.ps1
```

### Advanced Usage
```powershell
# Mask sensitive data and specify export path
.\Generate-ConditionalAccessPresentation.ps1 -ExportPath "C:\Reports" -MaskSensitiveData @("PolicyName", "User", "Group")

# Include disabled policies without grouping by state
.\Generate-ConditionalAccessPresentation.ps1 -IncludeDisabled $true -GroupByState $false

# Mask all sensitive data types
.\Generate-ConditionalAccessPresentation.ps1 -MaskSensitiveData @("PolicyName", "Group", "User", "Application", "ExternalTenant", "TermsOfUse", "NamedLocation")
```

## 📊 Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ExportPath` | String | Current Directory | Directory where PowerPoint file will be saved |
| `MaskSensitiveData` | String[] | `@()` | Array of data types to mask for privacy |
| `GroupByState` | Boolean | `$true` | Group slides by policy state (Enabled/Disabled/Report-Only) |
| `IncludeDisabled` | Boolean | `$true` | Include disabled policies in presentation |

## 🎭 Data Masking Options

Protect sensitive information by masking:

- **PolicyName** - Policy names become "Policy 1234"
- **Group** - Group names become "Group-123" 
- **User** - User names become "User-456"
- **Application** - App names become "App-789"
- **ExternalTenant** - External tenant info is masked
- **TermsOfUse** - Terms of use names are masked
- **NamedLocation** - Named location details are masked

## 📄 Output Format

The script generates a professional PowerPoint presentation with:

### Slide Structure
1. **Title Slide** - Overview with policy count and generation date
2. **Section Slides** - Dividers for Enabled/Disabled/Report-Only (if grouped)
3. **Policy Slides** - Individual slides for each policy containing:
   - Policy name and status (color-coded)
   - Target users/groups/roles
   - Target applications
   - Grant controls and requirements
   - Conditions and restrictions

### Visual Elements
- **Color-coded Status**: Green (Enabled), Red (Disabled), Orange (Report-Only)
- **Professional Layout**: Clean, corporate-friendly design
- **Consistent Formatting**: Standardized fonts, spacing, and alignment

## 🔍 Sample Output Files

After running, you'll get:
```
ConditionalAccessPolicies-20241223-143022.pptx
```

## 🛡️ Security Considerations

- **Read-Only Access**: Script only reads policy data, never modifies policies
- **Secure Authentication**: Uses Microsoft Graph with proper OAuth 2.0 flows
- **Local Processing**: All PowerPoint generation happens locally
- **Data Masking**: Built-in privacy protection for sensitive information
- **Audit Trail**: All actions logged in PowerShell transcript if enabled

## 🔧 Troubleshooting

### "Required module not found"
```powershell
Install-Module Microsoft.Graph.Authentication -Force
Install-Module Microsoft.Graph.Identity.SignIns -Force
```

### "Insufficient privileges"
Ensure your account has **Security Reader** role or equivalent permissions:
- Security Administrator
- Conditional Access Administrator  
- Global Administrator

### "Open XML SDK installation failed"
Try manual installation:
```powershell
Install-Package DocumentFormat.OpenXml -Source nuget.org
```

### "No policies returned"
- Verify you have Conditional Access policies configured
- Check you're connected to the correct tenant
- Ensure your Security Reader role has proper scope

## 🆚 Comparison with Original idPowerToys

| Feature | Original idPowerToys | This Script |
|---------|-------------------|-------------|
| **Deployment** | Web application requiring hosting | Standalone script - no deployment |
| **Dependencies** | Syncfusion (commercial license required) | Open XML SDK (free) |
| **Usage** | Web interface, continuous hosting | Ad-hoc PowerShell execution |
| **Permissions** | Various admin roles | Optimized for Security Reader |
| **Customization** | Web UI options | PowerShell parameters |
| **Cost** | Syncfusion licensing fees | Completely free |

## 💡 Best Practices

1. **Regular Analysis**: Generate presentations before policy reviews or audits
2. **Data Privacy**: Use masking when sharing with external parties
3. **Version Control**: Include generation timestamp in filenames
4. **Documentation**: Keep presentations as historical snapshots
5. **Review Process**: Use presentations for policy review meetings

## 🤝 Integration with Existing Tools

This PowerPoint generator complements your existing Conditional Access analysis tools:

1. **PowerShell Analysis Script**: Use for detailed overlap analysis
2. **PowerPoint Generator**: Use for executive presentations and documentation
3. **Combined Workflow**: Analyze → Present → Document decisions

## 📞 Getting Help

```powershell
# View full help
Get-Help .\Generate-ConditionalAccessPresentation.ps1 -Full

# Check parameters
Get-Help .\Generate-ConditionalAccessPresentation.ps1 -Parameter *
```

---

## 🎯 Summary

This PowerPoint generator provides the same professional documentation capabilities as idPowerToys but with:

- **No licensing costs** (uses free Open XML SDK)
- **No deployment complexity** (standalone PowerShell script)
- **Security Reader optimization** (perfect for your use case)
- **Ad-hoc execution** (run whenever needed)
- **Complete privacy control** (data masking options)

Perfect for Security Reader role users who need professional Conditional Access policy presentations without the complexity or cost of full web application deployment.

---

**Generated by**: Conditional Access PowerPoint Generator  
**Last Updated**: December 2024  
**Version**: 1.0 (Open XML SDK Edition)