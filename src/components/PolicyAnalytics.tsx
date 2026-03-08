import React, { useMemo } from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { StackedProgressBar } from './ui/ProgressBar';
import { percentage } from '../lib/utils';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  TrendingUp,
  Users,
  AppWindow,
  MapPin,
  Lock,
} from 'lucide-react';

interface PolicyAnalyticsProps {
  policies: ConditionalAccessPolicy[];
}

const PolicyAnalytics: React.FC<PolicyAnalyticsProps> = ({ policies }) => {
  const analysis = useMemo(() => {
    const totalPolicies = policies.length;
    const enabledPolicies = policies.filter(p => p.state === 'enabled').length;
    const disabledPolicies = policies.filter(p => p.state === 'disabled').length;
    const reportOnlyPolicies = policies.filter(p => p.state === 'enabledForReportingButNotEnforced').length;

    const withMFA = policies.filter(p =>
      p.grantControls?.builtInControls?.includes('mfa')
    ).length;
    const withCompliantDevice = policies.filter(p =>
      p.grantControls?.builtInControls?.includes('compliantDevice')
    ).length;
    const blockPolicies = policies.filter(p =>
      p.grantControls?.builtInControls?.includes('block')
    ).length;

    const securityScore = calculateSecurityScore(policies);

    const conditionCounts = {
      users: 0,
      groups: 0,
      apps: 0,
      locations: 0,
    };

    policies.forEach(p => {
      if (p.conditions?.users?.includeUsers?.length) conditionCounts.users++;
      if (p.conditions?.users?.includeGroups?.length) conditionCounts.groups++;
      if (p.conditions?.applications?.includeApplications?.length) conditionCounts.apps++;
      if (p.conditions?.locations?.includeLocations?.length) conditionCounts.locations++;
    });

    return {
      totalPolicies,
      enabledPolicies,
      disabledPolicies,
      reportOnlyPolicies,
      withMFA,
      withCompliantDevice,
      blockPolicies,
      securityScore,
      conditionCounts,
    };
  }, [policies]);

  const stats = [
    {
      title: 'Total Policies',
      value: analysis.totalPolicies,
      icon: Shield,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Enabled',
      value: analysis.enabledPolicies,
      icon: ShieldCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Report Only',
      value: analysis.reportOnlyPolicies,
      icon: ShieldAlert,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Disabled',
      value: analysis.disabledPolicies,
      icon: ShieldX,
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  const securityMetrics = [
    { label: 'With MFA', value: analysis.withMFA, icon: Lock },
    { label: 'Compliant Device', value: analysis.withCompliantDevice, icon: ShieldCheck },
    { label: 'Block Policies', value: analysis.blockPolicies, icon: ShieldX },
  ];

  const conditionMetrics = [
    { label: 'User Targeting', value: analysis.conditionCounts.users, icon: Users },
    { label: 'Group Targeting', value: analysis.conditionCounts.groups, icon: Users },
    { label: 'App Restrictions', value: analysis.conditionCounts.apps, icon: AppWindow },
    { label: 'Location Rules', value: analysis.conditionCounts.locations, icon: MapPin },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Policy Analytics</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your Conditional Access policies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={stat.bgColor} padding="md">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Policy Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            {analysis.totalPolicies > 0 ? (
              <>
                <StackedProgressBar
                  segments={[
                    { value: analysis.enabledPolicies, color: 'success', label: 'Enabled' },
                    { value: analysis.reportOnlyPolicies, color: 'warning', label: 'Report Only' },
                    { value: analysis.disabledPolicies, color: 'danger', label: 'Disabled' },
                  ]}
                  size="lg"
                  showLegend
                />
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {percentage(analysis.enabledPolicies, analysis.totalPolicies)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enforcing</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {percentage(analysis.reportOnlyPolicies, analysis.totalPolicies)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitoring</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {percentage(analysis.disabledPolicies, analysis.totalPolicies)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No policies to display
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${analysis.securityScore * 3.52} 352`}
                    strokeLinecap="round"
                    className={getScoreColor(analysis.securityScore)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreTextColor(analysis.securityScore)}`}>
                    {analysis.securityScore}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              {getScoreLabel(analysis.securityScore)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {securityMetrics.map((metric, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <metric.icon className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Condition Usage</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {conditionMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <metric.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function calculateSecurityScore(policies: ConditionalAccessPolicy[]): number {
  if (policies.length === 0) return 0;

  let score = 0;
  const enabledPolicies = policies.filter(p => p.state === 'enabled');

  score += (enabledPolicies.length / policies.length) * 40;

  const withMFA = policies.filter(p =>
    p.state === 'enabled' && p.grantControls?.builtInControls?.includes('mfa')
  ).length;
  score += (withMFA / Math.max(enabledPolicies.length, 1)) * 30;

  const withCompliance = policies.filter(p =>
    p.state === 'enabled' && p.grantControls?.builtInControls?.includes('compliantDevice')
  ).length;
  score += (withCompliance / Math.max(enabledPolicies.length, 1)) * 20;

  const withLocation = policies.filter(p =>
    p.state === 'enabled' && p.conditions?.locations?.excludeLocations?.length
  ).length;
  score += (withLocation / Math.max(enabledPolicies.length, 1)) * 10;

  return Math.round(Math.min(score, 100));
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent security posture';
  if (score >= 60) return 'Good, but room for improvement';
  if (score >= 40) return 'Needs attention';
  return 'Critical improvements needed';
}

export default PolicyAnalytics;
