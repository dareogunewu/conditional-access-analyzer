import React, { useMemo } from 'react';
import { ConditionalAccessPolicy, PolicyAnalysis } from '../types/conditionalAccess';

interface PolicyAnalyticsProps {
  policies: ConditionalAccessPolicy[];
}

const PolicyAnalytics: React.FC<PolicyAnalyticsProps> = ({ policies }) => {
  const analysis: PolicyAnalysis = useMemo(() => {
    const totalPolicies = policies.length;
    const enabledPolicies = policies.filter(p => p.state === 'enabled').length;
    const disabledPolicies = policies.filter(p => p.state === 'disabled').length;
    const reportOnlyPolicies = policies.filter(p => p.state === 'enabledForReportingButNotEnforced').length;

    const commonConditions = policies
      .flatMap(p => [
        ...(p.conditions?.applications?.includeApplications || []),
        ...(p.conditions?.users?.includeGroups || []),
        ...(p.conditions?.locations?.includeLocations || [])
      ])
      .reduce((acc: Record<string, number>, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {});

    const topConditions = Object.entries(commonConditions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([condition]) => condition);

    return {
      totalPolicies,
      enabledPolicies,
      disabledPolicies,
      reportOnlyPolicies,
      riskDistribution: { low: 0, medium: 0, high: 0 },
      commonConditions: topConditions,
      orphanedPolicies: [],
    };
  }, [policies]);

  const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg ${color}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Policy Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Policies"
          value={analysis.totalPolicies}
          color="bg-gray-100"
        />
        <StatCard
          title="Enabled"
          value={analysis.enabledPolicies}
          color="bg-green-100"
        />
        <StatCard
          title="Disabled"
          value={analysis.disabledPolicies}
          color="bg-red-100"
        />
        <StatCard
          title="Report Only"
          value={analysis.reportOnlyPolicies}
          color="bg-yellow-100"
        />
      </div>

      {analysis.totalPolicies > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Policy Distribution</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-l-full" 
              style={{ width: `${(analysis.enabledPolicies / analysis.totalPolicies) * 100}%` }}
            ></div>
            <div 
              className="bg-yellow-500 h-4" 
              style={{ width: `${(analysis.reportOnlyPolicies / analysis.totalPolicies) * 100}%` }}
            ></div>
            <div 
              className="bg-red-500 h-4 rounded-r-full" 
              style={{ width: `${(analysis.disabledPolicies / analysis.totalPolicies) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Enabled ({analysis.enabledPolicies})</span>
            <span>Report Only ({analysis.reportOnlyPolicies})</span>
            <span>Disabled ({analysis.disabledPolicies})</span>
          </div>
        </div>
      )}

      {analysis.commonConditions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Common Conditions</h3>
          <ul className="space-y-2">
            {analysis.commonConditions.map((condition, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <span className="text-gray-700">{condition}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PolicyAnalytics;