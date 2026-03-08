import React, { useMemo } from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Button } from './ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import ProgressBar from './ui/ProgressBar';
import { formatDate, downloadFile } from '../lib/utils';
import {
  FileText,
  Download,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

interface PolicyReportsProps {
  policies: ConditionalAccessPolicy[];
}

const PolicyReports: React.FC<PolicyReportsProps> = ({ policies }) => {
  const overviewReport = useMemo(() => {
    const byState = policies.reduce((acc, p) => {
      const state = p.state || 'unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const withMFA = policies.filter(p =>
      p.grantControls?.builtInControls?.includes('mfa')
    ).length;

    const withCompliantDevice = policies.filter(p =>
      p.grantControls?.builtInControls?.includes('compliantDevice')
    ).length;

    const lastModified = policies
      .filter(p => p.modifiedDateTime)
      .sort((a, b) =>
        new Date(b.modifiedDateTime!).getTime() - new Date(a.modifiedDateTime!).getTime()
      )
      .slice(0, 5);

    return {
      totalPolicies: policies.length,
      byState,
      withMFA,
      withCompliantDevice,
      lastModified,
    };
  }, [policies]);

  const securityReport = useMemo(() => {
    const weakPolicies = policies.filter(p =>
      p.state === 'disabled' ||
      !p.grantControls?.builtInControls?.length ||
      p.conditions?.users?.includeUsers?.includes('All')
    );

    const strongPolicies = policies.filter(p =>
      p.state === 'enabled' &&
      p.grantControls?.builtInControls?.includes('mfa') &&
      (p.conditions?.locations?.excludeLocations?.length || 0) > 0
    );

    const riskScore = policies.length > 0
      ? Math.max(0, 100 - (weakPolicies.length / policies.length) * 100)
      : 0;

    return { weakPolicies, strongPolicies, riskScore: Math.round(riskScore) };
  }, [policies]);

  const complianceReport = useMemo(() => {
    const checks = [
      {
        name: 'MFA Enforcement',
        description: 'Policies requiring multi-factor authentication',
        passed: policies.filter(p =>
          p.state === 'enabled' && p.grantControls?.builtInControls?.includes('mfa')
        ).length,
        total: policies.filter(p => p.state === 'enabled').length,
      },
      {
        name: 'Device Compliance',
        description: 'Policies requiring compliant devices',
        passed: policies.filter(p =>
          p.state === 'enabled' && p.grantControls?.builtInControls?.includes('compliantDevice')
        ).length,
        total: policies.filter(p => p.state === 'enabled').length,
      },
      {
        name: 'Location Restrictions',
        description: 'Policies with location-based controls',
        passed: policies.filter(p =>
          p.state === 'enabled' && (p.conditions?.locations?.excludeLocations?.length || 0) > 0
        ).length,
        total: policies.filter(p => p.state === 'enabled').length,
      },
    ];

    return { checks };
  }, [policies]);

  const exportToCSV = () => {
    const headers = [
      'Name',
      'State',
      'Created',
      'Modified',
      'Include Users',
      'Include Apps',
      'Grant Controls',
    ];

    const rows = policies.map(p => [
      p.displayName || '',
      p.state || '',
      p.createdDateTime || '',
      p.modifiedDateTime || '',
      p.conditions?.users?.includeUsers?.length || 0,
      p.conditions?.applications?.includeApplications?.length || 0,
      p.grantControls?.builtInControls?.join('; ') || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadFile(csvContent, 'conditional-access-policies.csv', 'text/csv');
  };

  const getStateBadgeClass = (state: string) => {
    switch (state) {
      case 'enabled': return 'badge-glow-green';
      case 'disabled': return 'badge-glow-red';
      default: return 'badge-glow-amber';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Policy <span className="text-gradient">Reports</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Comprehensive analysis and export capabilities
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-gradient px-4 py-2 rounded-xl font-medium flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" icon={<BarChart3 className="h-4 w-4" />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" icon={<Shield className="h-4 w-4" />}>
            Security
          </TabsTrigger>
          <TabsTrigger value="compliance" icon={<CheckCircle className="h-4 w-4" />}>
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy Summary */}
            <div className="glass-card rounded-2xl p-6 hover-lift">
              <div className="flex items-center gap-2 mb-6">
                <div className="icon-container">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Policy Summary
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Policies</span>
                  <span className="text-xl font-bold text-gradient">
                    {overviewReport.totalPolicies}
                  </span>
                </div>
                {Object.entries(overviewReport.byState).map(([state, count]) => (
                  <div
                    key={state}
                    className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{state}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStateBadgeClass(state)}`}>
                      {count}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">With MFA</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {overviewReport.withMFA}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600 dark:text-slate-400">Compliant Device Required</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {overviewReport.withCompliantDevice}
                  </span>
                </div>
              </div>
            </div>

            {/* Recently Modified */}
            <div className="glass-card rounded-2xl p-6 hover-lift">
              <div className="flex items-center gap-2 mb-6">
                <div className="icon-container">
                  <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recently Modified
                </h3>
              </div>
              <div className="space-y-3">
                {overviewReport.lastModified.length > 0 ? (
                  overviewReport.lastModified.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {policy.displayName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(policy.modifiedDateTime)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                    No recent modifications
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            {/* Security Score */}
            <div className="glass-card rounded-2xl p-6 hover-lift">
              <div className="flex items-center gap-2 mb-6">
                <div className="icon-container">
                  <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Security Score
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <div className={`text-5xl font-bold ${
                  securityReport.riskScore >= 80 ? 'text-gradient-green' :
                  securityReport.riskScore >= 60 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {securityReport.riskScore}%
                </div>
                <div className="flex-1">
                  <ProgressBar
                    value={securityReport.riskScore}
                    color={
                      securityReport.riskScore >= 80 ? 'success' :
                      securityReport.riskScore >= 60 ? 'warning' : 'danger'
                    }
                    size="lg"
                  />
                </div>
              </div>
            </div>

            {/* Weak & Strong Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weak Policies */}
              <div className="glass-card rounded-2xl p-6 hover-lift state-disabled">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldX className="h-5 w-5 text-rose-500" />
                  <h3 className="font-semibold text-rose-600 dark:text-rose-400">
                    Weak Policies ({securityReport.weakPolicies.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {securityReport.weakPolicies.length > 0 ? (
                    securityReport.weakPolicies.slice(0, 5).map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/30"
                      >
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {policy.displayName}
                        </p>
                        <p className="text-sm text-rose-600 dark:text-rose-400">
                          State: {policy.state}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                      No weak policies detected
                    </p>
                  )}
                </div>
              </div>

              {/* Strong Policies */}
              <div className="glass-card rounded-2xl p-6 hover-lift state-enabled">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Strong Policies ({securityReport.strongPolicies.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {securityReport.strongPolicies.length > 0 ? (
                    securityReport.strongPolicies.slice(0, 5).map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30"
                      >
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {policy.displayName}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          MFA + Location restrictions
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                      No strong policies found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="glass-card rounded-2xl p-6 hover-lift">
            <div className="flex items-center gap-2 mb-6">
              <div className="icon-container">
                <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Compliance Checks
              </h3>
            </div>
            <div className="space-y-6">
              {complianceReport.checks.map((check, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {check.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {check.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium text-white ${
                      check.passed === check.total ? 'badge-glow-green' : 'badge-glow-amber'
                    }`}>
                      {check.passed}/{check.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={check.passed}
                    max={check.total || 1}
                    color={check.passed === check.total ? 'success' : 'warning'}
                    size="md"
                  />
                </div>
              ))}
              {policies.length === 0 && (
                <p className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No policies to analyze
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyReports;
