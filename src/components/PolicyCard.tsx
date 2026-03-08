import React from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Button } from './ui';
import { formatDate, formatRelativeTime } from '../lib/utils';
import {
  Users,
  AppWindow,
  MapPin,
  Calendar,
  Clock,
  Eye,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from 'lucide-react';

interface PolicyCardProps {
  policy: ConditionalAccessPolicy;
  onView?: (policy: ConditionalAccessPolicy) => void;
  onEdit?: (policy: ConditionalAccessPolicy) => void;
  onDelete?: (id: string) => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onView }) => {
  const getStateConfig = (state?: string) => {
    switch (state) {
      case 'enabled':
        return {
          label: 'Enabled',
          stateClass: 'state-enabled',
          badgeClass: 'badge-glow-green',
          icon: ShieldCheck,
        };
      case 'disabled':
        return {
          label: 'Disabled',
          stateClass: 'state-disabled',
          badgeClass: 'badge-glow-red',
          icon: ShieldX,
        };
      case 'enabledForReportingButNotEnforced':
        return {
          label: 'Report Only',
          stateClass: 'state-report',
          badgeClass: 'badge-glow-amber',
          icon: ShieldAlert,
        };
      default:
        return {
          label: 'Unknown',
          stateClass: '',
          badgeClass: 'bg-slate-500',
          icon: ShieldAlert,
        };
    }
  };

  const getConditionSummary = () => {
    const conditions: { icon: typeof Users; label: string; count: number }[] = [];

    const userCount =
      (policy.conditions?.users?.includeUsers?.length || 0) +
      (policy.conditions?.users?.includeGroups?.length || 0);
    if (userCount > 0 || policy.conditions?.users?.includeUsers?.includes('All')) {
      conditions.push({
        icon: Users,
        label: 'Users/Groups',
        count: policy.conditions?.users?.includeUsers?.includes('All')
          ? -1
          : userCount,
      });
    }

    const appCount = policy.conditions?.applications?.includeApplications?.length || 0;
    if (appCount > 0 || policy.conditions?.applications?.includeApplications?.includes('All')) {
      conditions.push({
        icon: AppWindow,
        label: 'Applications',
        count: policy.conditions?.applications?.includeApplications?.includes('All')
          ? -1
          : appCount,
      });
    }

    const locationCount = policy.conditions?.locations?.includeLocations?.length || 0;
    if (locationCount > 0) {
      conditions.push({ icon: MapPin, label: 'Locations', count: locationCount });
    }

    return conditions;
  };

  const getGrantControls = () => {
    return policy.grantControls?.builtInControls || [];
  };

  const stateConfig = getStateConfig(policy.state);
  const conditions = getConditionSummary();
  const grantControls = getGrantControls();
  const StateIcon = stateConfig.icon;

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden hover-lift ${stateConfig.stateClass} animate-fade-in`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate mb-1">
              {policy.displayName || 'Unnamed Policy'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Modified {formatRelativeTime(policy.modifiedDateTime)}</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium text-white ${stateConfig.badgeClass}`}>
            <div className="flex items-center gap-1.5">
              <StateIcon className="h-3 w-3" />
              {stateConfig.label}
            </div>
          </div>
        </div>

        {/* Conditions Summary */}
        {conditions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Applies to
            </p>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
                >
                  <condition.icon className="h-3 w-3 text-violet-500" />
                  <span>
                    {condition.count === -1 ? 'All' : condition.count} {condition.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grant Controls */}
        {grantControls.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Requires
            </p>
            <div className="flex flex-wrap gap-1.5">
              {grantControls.map((control, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                >
                  {formatControlName(control)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(policy.createdDateTime)}</span>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      {onView && (
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(policy)}
            icon={<Eye className="h-4 w-4" />}
            className="w-full justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
          >
            View Details
          </Button>
        </div>
      )}
    </div>
  );
};

function formatControlName(control: string): string {
  const controlNames: Record<string, string> = {
    mfa: 'MFA',
    compliantDevice: 'Compliant Device',
    domainJoinedDevice: 'Domain Joined',
    approvedApplication: 'Approved App',
    compliantApplication: 'Compliant App',
    passwordChange: 'Password Change',
    block: 'Block Access',
  };
  return controlNames[control] || control;
}

export default PolicyCard;
