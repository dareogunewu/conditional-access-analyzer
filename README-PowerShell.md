# Conditional Access Policy Analyzer - PowerShell Script

A comprehensive PowerShell script for analyzing Microsoft Entra ID Conditional Access Policies with advanced duplicate detection, security scoring, and detailed reporting capabilities.

## 🚀 Features

- **Complete Policy Analysis**: Retrieves and analyzes all Conditional Access policies
- **Duplicate Detection**: Identifies similar policies with configurable similarity thresholds
- **Unnecessary Policy Detection**: Finds policies that may be redundant or ineffective
- **Security Scoring**: Calculates overall security posture with actionable recommendations
- **Risk Assessment**: Categorizes policies by risk level (High/Medium/Low)
- **Multiple Export Formats**: CSV, JSON, and HTML reports with rich visualizations
- **Interactive HTML Reports**: Professional reports that open automatically in your browser

## 📋 Prerequisites

### Required PowerShell Modules
```powershell
Install-Module Microsoft.Graph.Authentication -Force
Install-Module Microsoft.Graph.Identity.SignIns -Force
```

### Required Permissions
Your account needs the following Microsoft Graph permissions:
- `Policy.Read.All` - Read Conditional Access policies
- `Directory.Read.All` - Read directory information

### Minimum Requirements
- PowerShell 5.1 or PowerShell 7+
- Microsoft Entra ID tenant
- Appropriate administrative permissions

## 🔧 Usage

### Basic Usage
```powershell
# Run with default settings (exports to current directory in all formats)
.\Analyze-ConditionalAccessPolicies.ps1
```

### Advanced Usage
```powershell
# Export only HTML report to specific directory
.\Analyze-ConditionalAccessPolicies.ps1 -ExportPath "C:\Reports" -ExportFormat "HTML"

# Include disabled policies and skip automatic report opening
.\Analyze-ConditionalAccessPolicies.ps1 -IncludeDisabled $true -GenerateReport $false

# Export only CSV and JSON formats
.\Analyze-ConditionalAccessPolicies.ps1 -ExportFormat "CSV" -ExportPath "C:\CAP-Analysis"
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ExportPath` | String | Current Directory | Directory where analysis results will be saved |
| `ExportFormat` | String | "All" | Export format: CSV, JSON, HTML, or All |
| `IncludeDisabled` | Boolean | `$true` | Include disabled policies in analysis |
| `GenerateReport` | Boolean | `$true` | Generate and open HTML report automatically |

## 📊 What Gets Analyzed

### 1. Policy Statistics
- Total number of policies
- Enabled vs disabled vs report-only policies
- Creation and modification dates

### 2. Duplicate Detection
- Compares policy configurations using similarity algorithms
- Identifies policies with 80%+ similarity
- Analyzes conditions, grant controls, and session controls

### 3. Unnecessary Policy Detection
- Disabled policies that may be obsolete
- Overly broad policies with no controls
- Policies with redundant or meaningless conditions

### 4. Security Scoring (0-100)
- **MFA Enforcement**: Checks for multi-factor authentication policies
- **Admin Protection**: Verifies admin roles have additional protections
- **Legacy Auth Blocking**: Identifies policies blocking legacy protocols
- **Policy Hygiene**: Deducts points for duplicates and unnecessary policies

### 5. Risk Assessment
- **High Risk**: Broad policies with no security controls
- **Medium Risk**: Policies with minimal security controls
- **Low Risk**: Well-configured policies with appropriate controls

## 📄 Export Formats

### 1. CSV Export
Structured data export with columns:
- Policy details (name, state, dates)
- User and application scope
- Grant and session controls
- Perfect for Excel analysis or data processing

### 2. JSON Export
Complete analysis data including:
- All policy configurations
- Analysis results and recommendations
- Risk assessments and scoring details
- Suitable for integration with other tools

### 3. HTML Report
Rich, interactive report featuring:
- Executive summary with security score
- Visual policy statistics
- Color-coded risk assessments
- Detailed policy tables
- Actionable recommendations
- Professional styling for presentations

## 🔍 Analysis Examples

### Duplicate Policy Detection
```
Found 2 groups of potentially duplicate policies
  - 'Block Legacy Auth - Finance' similar to:
    * 'Block Legacy Auth - All Users' (85% similar)
  - 'MFA for Admins' similar to:
    * 'Admin MFA Requirement' (92% similar)
```

### Security Recommendations
```
Security Score: 75/100
Recommendations:
  - No MFA policies specifically targeting administrative roles
  - Remove or consolidate 2 duplicate policy groups
  - Review and remove 1 unnecessary policies
```

### Risk Assessment Output
```
High Risk Policies: 1
Medium Risk Policies: 3
Low Risk Policies: 12
```

## 🛡️ Security Considerations

- **Read-Only Access**: Script only reads policy data, never modifies policies
- **Secure Authentication**: Uses Microsoft Graph with proper OAuth 2.0 flows
- **Local Processing**: All analysis happens locally, no data sent to external services
- **Audit Trail**: All actions are logged in PowerShell transcript if enabled

## 📝 Sample Output Files

After running the script, you'll get files like:
```
ConditionalAccessAnalysis-20241223-143022.csv    # Policy data for Excel
ConditionalAccessAnalysis-20241223-143022.json   # Complete analysis data
ConditionalAccessAnalysis-20241223-143022.html   # Interactive report
```

## 🔧 Troubleshooting

### Common Issues

#### "Required module not found"
```powershell
Install-Module Microsoft.Graph.Authentication -Force
Install-Module Microsoft.Graph.Identity.SignIns -Force
```

#### "Insufficient privileges" 
Ensure your account has:
- Security Administrator role, or
- Conditional Access Administrator role, or  
- Global Administrator role

#### "No policies returned"
- Verify you have Conditional Access policies configured
- Check if your account has proper permissions
- Ensure you're connected to the correct tenant

### Getting Help
```powershell
Get-Help .\Analyze-ConditionalAccessPolicies.ps1 -Full
```

## 🔄 Integration with Microsoft's Built-in Optimization

This script complements Microsoft's built-in Conditional Access optimization agent by providing:

| Feature | Microsoft Agent | This Script |
|---------|----------------|-------------|
| **Scope** | Limited to 300 users/150 apps | All policies and users |
| **Customization** | Non-customizable | Fully customizable analysis |
| **Export Options** | Basic reports | CSV, JSON, HTML exports |
| **Duplicate Detection** | Basic consolidation | Advanced similarity algorithms |
| **Scheduling** | Fixed 24-hour intervals | Run on-demand or scheduled |
| **Risk Assessment** | Basic recommendations | Detailed risk categorization |

## 📈 Best Practices

1. **Regular Analysis**: Run monthly or after major policy changes
2. **Review Recommendations**: Don't auto-implement; review each suggestion
3. **Backup First**: Export current policies before making changes
4. **Phased Rollout**: Test policy changes in report-only mode first
5. **Document Changes**: Keep track of policy modifications and reasoning

## 🤝 Contributing

Feel free to enhance the script by:
- Adding new analysis algorithms
- Improving duplicate detection logic
- Enhancing HTML report visualizations
- Adding integration with other security tools

## 📄 License

This script is provided as-is for educational and administrative purposes. Use responsibly and in accordance with your organization's policies.

---

**Generated by**: Conditional Access Analyzer PowerShell Script  
**Last Updated**: December 2024  
**Version**: 1.0