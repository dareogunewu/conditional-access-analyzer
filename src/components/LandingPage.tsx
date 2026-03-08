import React from 'react';
import LoginButton from './LoginButton';
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
  ArrowRight,
  Globe,
  Activity,
  Eye,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      title: 'Policy Visualization',
      description: 'View all your Conditional Access policies in an intuitive, card-based interface.',
      icon: Eye,
      gradient: 'gradient-card-purple',
    },
    {
      title: 'Security Analytics',
      description: 'Get insights into policy distribution and identify security gaps.',
      icon: Activity,
      gradient: 'gradient-card-blue',
    },
    {
      title: 'Policy Analysis',
      description: 'Analyze policy effectiveness and identify potential security risks.',
      icon: Search,
      gradient: 'gradient-card-green',
    },
    {
      title: 'Reporting & Export',
      description: 'Generate comprehensive reports and export data for compliance.',
      icon: FileText,
      gradient: 'gradient-card-orange',
    },
    {
      title: 'Real-time Data',
      description: 'Direct integration with Microsoft Graph API for live policy data.',
      icon: Zap,
      gradient: 'gradient-card-pink',
    },
    {
      title: 'Security Scoring',
      description: 'Automated scoring to identify weak and strong policies.',
      icon: Target,
      gradient: 'gradient-card-purple',
    },
  ];

  const stats = [
    { value: '100%', label: 'Secure', icon: Shield },
    { value: 'Live', label: 'Real-time', icon: Activity },
    { value: 'Zero', label: 'Data Storage', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 aurora-light dark:aurora-bg overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl floating" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 gradient-card-purple rounded-xl neon-purple">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">
                CA Analyzer
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LoginButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-down">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Microsoft Entra ID Policy Management
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              <span className="text-slate-900 dark:text-white">Conditional Access</span>
              <br />
              <span className="text-gradient">Analyzer</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 animate-slide-up stagger-1">
              Visualize, analyze, and manage your Microsoft Entra ID Conditional
              Access policies with powerful insights and comprehensive reporting.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`glass-card rounded-2xl p-6 hover-lift animate-slide-up stagger-${index + 1}`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="icon-container">
                      <stat.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="animate-slide-up stagger-4">
              <LoginButton />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for{' '}
              <span className="text-gradient">Policy Management</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to effectively manage and monitor your
              Conditional Access policies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.gradient} rounded-2xl p-6 card-3d text-white`}
              >
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 rounded-xl inline-block mb-4 backdrop-blur-sm">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                  Why Choose{' '}
                  <span className="text-gradient">CA Analyzer</span>?
                </h2>
                <div className="space-y-4">
                  {[
                    'Simplify Conditional Access policy management',
                    'Identify security gaps and misconfigurations',
                    'Streamline compliance reporting',
                    'Reduce administrative overhead',
                    'Improve overall security posture',
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="p-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Perfect For
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Security Administrators', desc: 'Manage all CA policies from a centralized dashboard.', icon: Shield },
                    { title: 'Compliance Teams', desc: 'Generate reports for audit and compliance requirements.', icon: FileText },
                    { title: 'IT Managers', desc: 'Get insights into security posture and policy effectiveness.', icon: Building2 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="icon-container">
                        <item.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="gradient-card-dark rounded-3xl p-8 md:p-12 text-white neon-purple">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-center mb-12">
                Enterprise-Grade <span className="text-gradient-blue">Security</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { title: 'MSAL Auth', desc: 'Secure OAuth 2.0 with PKCE', icon: Lock },
                  { title: 'Graph API', desc: 'Direct API integration', icon: Globe },
                  { title: 'No Storage', desc: 'Client-side only processing', icon: Shield },
                  { title: 'Read Only', desc: 'Minimal permissions required', icon: Eye },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to <span className="text-gradient">Get Started</span>?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Sign in with your Microsoft account to start visualizing and
            analyzing your Conditional Access policies.
          </p>
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="mb-6">
              <div className="inline-flex p-4 gradient-card-purple rounded-2xl neon-purple mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Connect Securely
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Uses Microsoft Entra ID authentication
              </p>
            </div>
            <LoginButton />
            <p className="text-xs text-slate-500 mt-4">
              Requires Policy.Read.All permissions
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 gradient-card-purple rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gradient">CA Analyzer</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Simplifying Microsoft Entra ID policy management
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
            Built with Next.js, TypeScript, and Microsoft Graph API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
