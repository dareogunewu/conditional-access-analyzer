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
  Activity,
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
      gradient: 'gradient-card-purple',
      glow: 'neon-purple',
    },
    {
      title: 'Enabled',
      value: analysis.enabledPolicies,
      icon: ShieldCheck,
      gradient: 'gradient-card-green',
      glow: 'neon-green',
    },
    {
      title: 'Report Only',
      value: analysis.reportOnlyPolicies,
      icon: ShieldAlert,
      gradient: 'gradient-card-orange',
      glow: 'neon-orange',
    },
    {
      title: 'Disabled',
      value: analysis.disabledPolicies,
      icon: ShieldX,
      gradient: 'gradient-card-pink',
      glow: 'neon-pink',
    },
  ];

  const securityMetrics = [
    { label: 'With MFA', value: analysis.withMFA, icon: Lock, color: 'text-violet-500' },
    { label: 'Compliant Device', value: analysis.withCompliantDevice, icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Block Policies', value: analysis.blockPolicies, icon: ShieldX, color: 'text-rose-500' },
  ];

  const conditionMetrics = [
    { label: 'User Targeting', value: analysis.conditionCounts.users, icon: Users, gradient: 'from-cyan-500 to-blue-500' },
    { label: 'Group Targeting', value: analysis.conditionCounts.groups, icon: Users, gradient: 'from-violet-500 to-purple-500' },
    { label: 'App Restrictions', value: analysis.conditionCounts.apps, icon: AppWindow, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Location Rules', value: analysis.conditionCounts.locations, icon: MapPin, gradient: 'from-orange-500 to-amber-500' },
  ];

  const scoreRingClass = analysis.securityScore >= 80 ? 'score-ring-green' :
    analysis.securityScore >= 60 ? 'score-ring-amber' : 'score-ring-red';

  const scoreColor = analysis.securityScore >= 80 ? 'text-emerald-500' :
    analysis.securityScore >= 60 ? 'text-amber-500' : 'text-rose-500';

  const scoreStroke = analysis.securityScore >= 80 ? '#10b981' :
    analysis.securityScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Policy <span className="text-gradient">Analytics</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Overview of your Conditional Access policies
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.gradient} rounded-2xl p-6 card-3d`}
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Distribution */}
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-2 mb-6">
            <div className="icon-container">
              <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Policy Distribution
            </h3>
          </div>

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
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {percentage(analysis.enabledPolicies, analysis.totalPolicies)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enforcing</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {percentage(analysis.reportOnlyPolicies, analysis.totalPolicies)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Monitoring</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {percentage(analysis.disabledPolicies, analysis.totalPolicies)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Inactive</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No policies to display
            </div>
          )}
        </div>

        {/* Security Score */}
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-2 mb-6">
            <div className="icon-container">
              <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Security Score
            </h3>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className={`w-36 h-36 transform -rotate-90 ${scoreRingClass}`}>
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke={scoreStroke}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${analysis.securityScore * 3.77} 377`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor}`}>
                  {analysis.securityScore}
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
            {getScoreLabel(analysis.securityScore)}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {securityMetrics.map((metric, index) => (
              <div key={index} className="stat-card-premium text-center p-4">
                <div className="relative z-10">
                  <metric.icon className={`h-5 w-5 mx-auto mb-2 ${metric.color}`} />
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Condition Usage */}
      <div className="glass-card rounded-2xl p-6 hover-lift">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Condition Usage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {conditionMetrics.map((metric, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover-lift"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                  <metric.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent security posture';
  if (score >= 60) return 'Good, but room for improvement';
  if (score >= 40) return 'Needs attention';
  return 'Critical improvements needed';
}

export default PolicyAnalytics;
