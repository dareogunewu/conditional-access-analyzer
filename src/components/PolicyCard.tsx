import React from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';

interface PolicyCardProps {
  policy: ConditionalAccessPolicy;
  onEdit?: (policy: ConditionalAccessPolicy) => void;
  onDelete?: (id: string) => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onEdit, onDelete }) => {
  const getStateColor = (state?: string) => {
    switch (state) {
      case 'enabled':
        return 'bg-green-100 text-green-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      case 'enabledForReportingButNotEnforced':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatConditions = () => {
    const conditions = [];
    if (policy.conditions?.users?.includeUsers?.length) {
      conditions.push(`${policy.conditions.users.includeUsers.length} users`);
    }
    if (policy.conditions?.users?.includeGroups?.length) {
      conditions.push(`${policy.conditions.users.includeGroups.length} groups`);
    }
    if (policy.conditions?.applications?.includeApplications?.length) {
      conditions.push(`${policy.conditions.applications.includeApplications.length} apps`);
    }
    return conditions.join(', ') || 'No conditions';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {policy.displayName || 'Unnamed Policy'}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(policy.state)}`}>
          {policy.state}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Conditions:</p>
          <p className="text-sm text-gray-600">{formatConditions()}</p>
        </div>
        
        {policy.grantControls?.builtInControls?.length && (
          <div>
            <p className="text-sm font-medium text-gray-700">Grant Controls:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {policy.grantControls.builtInControls.map((control, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {control}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Created: {policy.createdDateTime ? new Date(policy.createdDateTime).toLocaleDateString() : 'Unknown'}</p>
          <p>Modified: {policy.modifiedDateTime ? new Date(policy.modifiedDateTime).toLocaleDateString() : 'Unknown'}</p>
        </div>
      </div>
      
      {(onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(policy)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(policy.id!)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PolicyCard;