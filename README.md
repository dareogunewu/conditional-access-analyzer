# Conditional Access Analyzer

A Microsoft Entra ID Conditional Access policy visualization and analysis tool built with Next.js, TypeScript, and Microsoft Graph API.

## Features

- **Authentication**: Secure login with Microsoft Entra ID using MSAL
- **Policy Visualization**: View all conditional access policies in a clean, card-based interface
- **Analytics Dashboard**: Get insights into policy distribution, states, and common conditions
- **Reporting**: Generate security reports and export policy data to CSV
- **Real-time Data**: Direct integration with Microsoft Graph API for up-to-date information

## Prerequisites

- Node.js 16+ and npm
- Microsoft Entra ID tenant with appropriate permissions
- App Registration in Microsoft Entra ID

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd conditional-access-analyzer
npm install
```

### 2. Configure Microsoft Entra ID App Registration

1. Go to [Microsoft Entra Admin Center](https://entra.microsoft.com)
2. Navigate to **App registrations** → **New registration**
3. Configure:
   - Name: "Conditional Access Analyzer"
   - Redirect URI: `http://localhost:3000` (Web)
4. After creation, note the **Application (client) ID**
5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
6. Add these permissions:
   - `Policy.Read.All`
   - `Policy.ReadWrite.ConditionalAccess`
   - `Directory.Read.All`
7. Grant admin consent for your organization

### 3. Environment Configuration

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your Microsoft account.

## Usage

1. **Sign In**: Click "Sign in with Microsoft" and authenticate with your Entra ID account
2. **View Policies**: Browse all conditional access policies on the main dashboard
3. **Analytics**: Switch to the Analytics tab for policy insights and statistics
4. **Reports**: Generate security reports and export data via the Reports tab
5. **Search**: Use the search bar to filter policies by name

## Architecture

```
src/
├── components/          # React components
│   ├── LoginButton.tsx     # Authentication component
│   ├── PolicyCard.tsx      # Policy display component
│   ├── PolicyAnalytics.tsx # Analytics dashboard
│   └── PolicyReports.tsx   # Reporting interface
├── hooks/              # Custom React hooks
│   └── useConditionalAccess.ts  # Graph API integration
├── lib/               # Utility libraries
│   ├── msalConfig.ts      # MSAL configuration
│   └── graphClient.ts     # Microsoft Graph client
├── pages/             # Next.js pages
│   ├── _app.tsx          # App root with MSAL provider
│   └── index.tsx         # Main application page
├── types/             # TypeScript definitions
│   └── conditionalAccess.ts  # Policy type definitions
└── styles/            # CSS styles
    └── globals.css       # Global styles with Tailwind
```

## Security Considerations

- Uses MSAL for secure authentication with Microsoft Entra ID
- Implements proper OAuth 2.0 flows with PKCE
- Requires appropriate Graph API permissions
- All API calls are made client-side with user tokens
- No sensitive data is stored locally

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details