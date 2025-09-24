import React, { useState } from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';

interface PolicyReportsProps {
  policies: ConditionalAccessPolicy[];
}

const PolicyReports: React.FC<PolicyReportsProps> = ({ policies }) => {
  const [selectedReport, setSelectedReport] = useState<string>('overview');

  const generateOverviewReport = () => {
    const report = {
      totalPolicies: policies.length,
      byState: policies.reduce((acc, p) => {
        acc[p.state || 'unknown'] = (acc[p.state || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withMFA: policies.filter(p => 
        p.grantControls?.builtInControls?.includes('mfa')
      ).length,
      withCompliantDevice: policies.filter(p =>
        p.grantControls?.builtInControls?.includes('compliantDevice')
      ).length,
      lastModified: policies
        .filter(p => p.modifiedDateTime)
        .sort((a, b) => new Date(b.modifiedDateTime!).getTime() - new Date(a.modifiedDateTime!).getTime())
        .slice(0, 5),
    };
    return report;
  };

  const generateSecurityReport = () => {
    const weakPolicies = policies.filter(p => 
      p.state === 'disabled' || 
      !p.grantControls?.builtInControls?.length ||
      p.conditions?.users?.includeUsers?.includes('All')
    );

    const strongPolicies = policies.filter(p =>
      p.state === 'enabled' &&
      p.grantControls?.builtInControls?.includes('mfa') &&
      p.conditions?.locations?.excludeLocations?.length
    );

    return {
      weakPolicies,
      strongPolicies,
      riskScore: Math.max(0, 100 - (weakPolicies.length / Math.max(policies.length, 1)) * 100),
    };
  };

  const exportToCSV = () => {
    const csvContent = [
      'Name,State,Created,Modified,Users,Applications,Grant Controls',
      ...policies.map(p => [
        p.displayName || '',
        p.state || '',
        p.createdDateTime || '',
        p.modifiedDateTime || '',
        p.conditions?.users?.includeUsers?.length || 0,
        p.conditions?.applications?.includeApplications?.length || 0,
        p.grantControls?.builtInControls?.join(';') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conditional-access-policies.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const overviewReport = generateOverviewReport();
  const securityReport = generateSecurityReport();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Policy Reports</h2>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      <div className="flex space-x-4 border-b">
        {['overview', 'security', 'compliance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedReport(tab)}
            className={`px-4 py-2 capitalize ${
              selectedReport === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Policy Summary</h3>
            <div className="space-y-2">
              <p>Total Policies: <span className="font-medium">{overviewReport.totalPolicies}</span></p>
              {Object.entries(overviewReport.byState).map(([state, count]) => (
                <p key={state}>
                  {state.charAt(0).toUpperCase() + state.slice(1)}: <span className="font-medium">{count}</span>
                </p>
              ))}
              <p>With MFA: <span className="font-medium">{overviewReport.withMFA}</span></p>
              <p>With Compliant Device: <span className="font-medium">{overviewReport.withCompliantDevice}</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recently Modified</h3>
            <div className="space-y-2">
              {overviewReport.lastModified.map((policy) => (
                <div key={policy.id} className="border-b pb-2">
                  <p className="font-medium truncate">{policy.displayName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(policy.modifiedDateTime!).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'security' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Security Score</h3>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(securityReport.riskScore)}%
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full" 
                  style={{ width: `${securityReport.riskScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Weak Policies ({securityReport.weakPolicies.length})</h3>
              <div className="space-y-2">
                {securityReport.weakPolicies.slice(0, 5).map((policy) => (
                  <div key={policy.id} className="text-sm">
                    <p className="font-medium">{policy.displayName}</p>
                    <p className="text-gray-600">State: {policy.state}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-green-600">Strong Policies ({securityReport.strongPolicies.length})</h3>
              <div className="space-y-2">
                {securityReport.strongPolicies.slice(0, 5).map((policy) => (
                  <div key={policy.id} className="text-sm">
                    <p className="font-medium">{policy.displayName}</p>
                    <p className="text-gray-600">MFA + Location restrictions</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'compliance' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
          <p className="text-gray-600">
            Compliance reporting features would be implemented here based on specific regulatory requirements.
          </p>
        </div>
      )}
    </div>
  );
};

export default PolicyReports;