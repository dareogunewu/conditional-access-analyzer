import React from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Card, CardContent, Badge, Button } from './ui';
import { formatDate, formatRelativeTime } from '../lib/utils';
import {
  Users,
  AppWindow,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';

interface PolicyCardProps {
  policy: ConditionalAccessPolicy;
  onView?: (policy: ConditionalAccessPolicy) => void;
  onEdit?: (policy: ConditionalAccessPolicy) => void;
  onDelete?: (id: string) => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onView, onEdit, onDelete }) => {
  const getStateBadge = (state?: string) => {
    switch (state) {
      case 'enabled':
        return { variant: 'success' as const, label: 'Enabled', dot: true, borderColor: 'border-l-emerald-500', glow: 'hover:shadow-emerald-500/20' };
      case 'disabled':
        return { variant: 'danger' as const, label: 'Disabled', dot: true, borderColor: 'border-l-rose-500', glow: 'hover:shadow-rose-500/20' };
      case 'enabledForReportingButNotEnforced':
        return { variant: 'warning' as const, label: 'Report Only', dot: true, borderColor: 'border-l-amber-500', glow: 'hover:shadow-amber-500/20' };
      default:
        return { variant: 'default' as const, label: 'Unknown', dot: true, borderColor: 'border-l-gray-500', glow: 'hover:shadow-gray-500/20' };
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

  const stateBadge = getStateBadge(policy.state);
  const conditions = getConditionSummary();
  const grantControls = getGrantControls();

  return (
    <Card
      hover
      className={`group transition-all duration-300 animate-fade-in border-l-4 ${stateBadge.borderColor} ${stateBadge.glow} hover:shadow-xl`}
      padding="none"
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1">
              {policy.displayName || 'Unnamed Policy'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Modified {formatRelativeTime(policy.modifiedDateTime)}</span>
            </div>
          </div>
          <Badge
            variant={stateBadge.variant}
            dot={stateBadge.dot}
            size="sm"
          >
            {stateBadge.label}
          </Badge>
        </div>

        {/* Conditions Summary */}
        {conditions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Applies to
            </p>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700/50 rounded-md text-xs text-purple-700 dark:text-purple-300"
                >
                  <condition.icon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
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
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Requires
            </p>
            <div className="flex flex-wrap gap-1.5">
              {grantControls.map((control, index) => (
                <Badge key={index} variant="info" size="sm">
                  {formatControlName(control)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(policy.createdDateTime)}</span>
          </div>
        </div>
      </CardContent>

      {/* Actions Footer */}
      {(onView || onEdit || onDelete) && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between rounded-b-xl">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(policy)}
              icon={<Eye className="h-4 w-4" />}
            >
              View Details
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(policy)}
                icon={<Edit2 className="h-4 w-4" />}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(policy.id!)}
                icon={<Trash2 className="h-4 w-4" />}
                className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
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
