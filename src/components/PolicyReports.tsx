import React, { useMemo } from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from './ui';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Policy <span className="gradient-text">Reports</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Comprehensive analysis and export capabilities
          </p>
        </div>
        <Button onClick={exportToCSV} icon={<Download className="h-4 w-4" />} className="card-gradient-purple text-white border-0 glow-purple hover:opacity-90">
          Export CSV
        </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Policy Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Policies</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {overviewReport.totalPolicies}
                  </span>
                </div>
                {Object.entries(overviewReport.byState).map(([state, count]) => (
                  <div
                    key={state}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{state}</span>
                    <Badge
                      variant={
                        state === 'enabled' ? 'success' :
                        state === 'disabled' ? 'danger' : 'warning'
                      }
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">With MFA</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {overviewReport.withMFA}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Compliant Device Required</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {overviewReport.withCompliantDevice}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Recently Modified
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4 space-y-3">
                {overviewReport.lastModified.length > 0 ? (
                  overviewReport.lastModified.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {policy.displayName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(policy.modifiedDateTime)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No recent modifications
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  Security Score
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="flex items-center gap-6">
                  <div className={`text-5xl font-bold ${
                    securityReport.riskScore >= 80 ? 'gradient-text-green' :
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
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldX className="h-5 w-5" />
                    Weak Policies ({securityReport.weakPolicies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {securityReport.weakPolicies.length > 0 ? (
                    securityReport.weakPolicies.slice(0, 5).map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {policy.displayName}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          State: {policy.state}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No weak policies detected
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <ShieldCheck className="h-5 w-5" />
                    Strong Policies ({securityReport.strongPolicies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {securityReport.strongPolicies.length > 0 ? (
                    securityReport.strongPolicies.slice(0, 5).map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {policy.displayName}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          MFA + Location restrictions
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No strong policies found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Compliance Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
              {complianceReport.checks.map((check, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {check.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {check.description}
                      </p>
                    </div>
                    <Badge
                      variant={check.passed === check.total ? 'success' : 'warning'}
                      size="lg"
                    >
                      {check.passed}/{check.total}
                    </Badge>
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
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No policies to analyze
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyReports;
