import React from 'react';
import LoginButton from './LoginButton';
import { Card } from './ui';
import ThemeToggle from './ui/ThemeToggle';
import {
  BarChart3,
  Shield,
  Search,
  FileText,
  Zap,
  Target,
  Lock,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      title: 'Policy Visualization',
      description:
        'View all your Conditional Access policies in an intuitive, card-based interface with clear status indicators and condition summaries.',
      icon: BarChart3,
      gradient: 'card-gradient-blue',
      glow: 'glow-blue',
    },
    {
      title: 'Security Analytics',
      description:
        'Get insights into policy distribution, identify security gaps, and understand your organization\'s access control posture.',
      icon: Shield,
      gradient: 'card-gradient-green',
      glow: 'glow-green',
    },
    {
      title: 'Policy Analysis',
      description:
        'Analyze policy effectiveness, detect orphaned policies, and identify potential security risks across your environment.',
      icon: Search,
      gradient: 'card-gradient-purple',
      glow: 'glow-purple',
    },
    {
      title: 'Reporting & Export',
      description:
        'Generate comprehensive security reports and export policy data to CSV for further analysis and compliance reporting.',
      icon: FileText,
      gradient: 'card-gradient-orange',
      glow: 'glow-purple',
    },
    {
      title: 'Real-time Data',
      description:
        'Direct integration with Microsoft Graph API ensures you\'re always working with the most up-to-date policy information.',
      icon: Zap,
      gradient: 'card-gradient-pink',
      glow: 'glow-pink',
    },
    {
      title: 'Security Scoring',
      description:
        'Assess your security posture with automated scoring that identifies weak and strong policies in your environment.',
      icon: Target,
      gradient: 'card-gradient-mixed',
      glow: 'glow-purple',
    },
  ];

  const benefits = [
    'Simplify Conditional Access policy management',
    'Identify security gaps and misconfigurations',
    'Streamline compliance reporting',
    'Reduce administrative overhead',
    'Improve overall security posture',
  ];

  const useCases = [
    {
      title: 'Security Administrators',
      description:
        'Quickly assess and manage all Conditional Access policies from a centralized dashboard.',
      icon: Shield,
    },
    {
      title: 'Compliance Teams',
      description:
        'Generate reports and export data for audit and compliance requirements.',
      icon: FileText,
    },
    {
      title: 'IT Managers',
      description:
        'Get high-level insights into security posture and policy effectiveness.',
      icon: Building2,
    },
  ];

  const securityFeatures = [
    {
      title: 'MSAL Authentication',
      description: 'Secure OAuth 2.0 with PKCE',
      icon: Lock,
    },
    {
      title: 'Microsoft Graph',
      description: 'Direct API integration',
      icon: Zap,
    },
    {
      title: 'No Data Storage',
      description: 'Client-side only processing',
      icon: Shield,
    },
    {
      title: 'Minimal Permissions',
      description: 'Read-only access required',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen dark:mesh-gradient bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-transparent">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 card-gradient-purple rounded-lg glow-purple animate-pulse-glow">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold gradient-text">
                CA Analyzer
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 hero-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-sm font-medium mb-6 animate-float">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Microsoft Entra ID Policy Management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Conditional Access{' '}
              <span className="gradient-text animate-gradient">Analyzer</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Visualize, analyze, and manage your Microsoft Entra ID Conditional
              Access policies with powerful insights and comprehensive reporting
              capabilities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="stat-card card-gradient-purple glow-purple">
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-1">Policy</div>
                  <div className="text-purple-100">Visualization</div>
                </div>
              </div>
              <div className="stat-card card-gradient-green glow-green">
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-1">Security</div>
                  <div className="text-green-100">Analytics</div>
                </div>
              </div>
              <div className="stat-card card-gradient-blue glow-blue">
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-1">Compliance</div>
                  <div className="text-blue-100">Reporting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 dark:bg-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for <span className="gradient-text">Policy Management</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to effectively manage and monitor your
              Conditional Access policies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.gradient} rounded-2xl p-6 text-white card-hover hover:${feature.glow} transition-all duration-300`}
              >
                <div className="p-3 bg-white/20 rounded-xl inline-block mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card padding="lg" className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Why Choose Conditional Access Analyzer?
                </h2>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Perfect For
                </h3>
                <div className="space-y-6">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <useCase.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {useCase.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card
            className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 border-0"
            padding="lg"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Enterprise-Grade Security
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex p-3 bg-white/10 rounded-xl mb-3">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-blue-100">{feature.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Analyze Your Policies?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign in with your Microsoft account to start visualizing and
              analyzing your Conditional Access policies. No installation
              required.
            </p>

            <Card className="max-w-md mx-auto" padding="lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Get Started Now
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect securely with Microsoft Entra ID to access your policies.
              </p>
              <LoginButton />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Requires Policy.Read.All permissions
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 card-gradient-purple rounded-lg glow-purple">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold gradient-text">CA Analyzer</span>
          </div>
          <p className="text-gray-300">
            Simplifying Microsoft Entra ID policy management
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
