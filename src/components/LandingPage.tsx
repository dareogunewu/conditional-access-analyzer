import React from 'react';
import LoginButton from './LoginButton';

const LandingPage: React.FC = () => {
  const features = [
    {
      title: "Policy Visualization",
      description: "View all your Conditional Access policies in an intuitive, card-based interface with clear status indicators and condition summaries.",
      icon: "📊"
    },
    {
      title: "Security Analytics",
      description: "Get insights into policy distribution, identify security gaps, and understand your organization's access control posture.",
      icon: "🔒"
    },
    {
      title: "Policy Analysis",
      description: "Analyze policy effectiveness, detect orphaned policies, and identify potential security risks across your environment.",
      icon: "🔍"
    },
    {
      title: "Reporting & Export",
      description: "Generate comprehensive security reports and export policy data to CSV for further analysis and compliance reporting.",
      icon: "📋"
    },
    {
      title: "Real-time Data",
      description: "Direct integration with Microsoft Graph API ensures you're always working with the most up-to-date policy information.",
      icon: "⚡"
    },
    {
      title: "Security Scoring",
      description: "Assess your security posture with automated scoring that identifies weak and strong policies in your environment.",
      icon: "🛡️"
    }
  ];

  const benefits = [
    "Simplify Conditional Access policy management",
    "Identify security gaps and misconfigurations", 
    "Streamline compliance reporting",
    "Reduce administrative overhead",
    "Improve overall security posture"
  ];

  const useCases = [
    {
      title: "Security Administrators",
      description: "Quickly assess and manage all Conditional Access policies from a centralized dashboard."
    },
    {
      title: "Compliance Teams", 
      description: "Generate reports and export data for audit and compliance requirements."
    },
    {
      title: "IT Managers",
      description: "Get high-level insights into security posture and policy effectiveness."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Conditional Access Analyzer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Visualize, analyze, and manage your Microsoft Entra ID Conditional Access policies 
            with powerful insights and comprehensive reporting capabilities.
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">Policy</div>
                <div className="text-gray-600">Visualization</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">Security</div>
                <div className="text-gray-600">Analytics</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">Compliance</div>
                <div className="text-gray-600">Reporting</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Policy Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose Conditional Access Analyzer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Benefits</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Perfect For</h3>
              <div className="space-y-4">
                {useCases.map((useCase, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-gray-900">{useCase.title}</h4>
                    <p className="text-sm text-gray-600">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            See It In Action
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Comprehensive Dashboard
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Interactive policy cards with status indicators</li>
                <li>• Real-time policy state visualization</li>
                <li>• Advanced filtering and search capabilities</li>
                <li>• Policy condition and control analysis</li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-600">Dashboard Preview</p>
              <p className="text-sm text-gray-500">Sign in to see your policies visualized</p>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Enterprise-Grade Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold mb-2">MSAL Authentication</h3>
              <p className="text-blue-100 text-sm">Secure OAuth 2.0 with PKCE</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold mb-2">Microsoft Graph</h3>
              <p className="text-blue-100 text-sm">Direct API integration</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold mb-2">No Data Storage</h3>
              <p className="text-blue-100 text-sm">Client-side only processing</p>
            </div>
            <div>
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold mb-2">Minimal Permissions</h3>
              <p className="text-blue-100 text-sm">Read-only access required</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Analyze Your Policies?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Sign in with your Microsoft account to start visualizing and analyzing your 
            Conditional Access policies. No installation required.
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Get Started Now
            </h3>
            <p className="text-gray-600 mb-6">
              Connect securely with Microsoft Entra ID to access your policies.
            </p>
            <LoginButton />
            <p className="text-xs text-gray-500 mt-4">
              Requires Policy.Read.All permissions
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Conditional Access Analyzer - Simplifying Microsoft Entra ID policy management
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Built with Next.js, TypeScript, and Microsoft Graph API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;