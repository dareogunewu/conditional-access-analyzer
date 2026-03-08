import React from 'react';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Modal, Badge, Card, CardContent } from './ui';
import { formatDate } from '../lib/utils';
import {
  Users,
  UserX,
  AppWindow,
  MapPin,
  Shield,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Laptop,
  Smartphone,
} from 'lucide-react';

interface PolicyDetailModalProps {
  policy: ConditionalAccessPolicy | null;
  isOpen: boolean;
  onClose: () => void;
}

const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policy,
  isOpen,
  onClose,
}) => {
  if (!policy) return null;

  const getStateBadge = (state?: string) => {
    switch (state) {
      case 'enabled':
        return { variant: 'success' as const, label: 'Enabled', icon: CheckCircle };
      case 'disabled':
        return { variant: 'danger' as const, label: 'Disabled', icon: XCircle };
      case 'enabledForReportingButNotEnforced':
        return { variant: 'warning' as const, label: 'Report Only', icon: AlertTriangle };
      default:
        return { variant: 'default' as const, label: 'Unknown', icon: AlertTriangle };
    }
  };

  const stateBadge = getStateBadge(policy.state);
  const StateIcon = stateBadge.icon;

  const sections = [
    {
      title: 'Users & Groups',
      icon: Users,
      items: [
        {
          label: 'Include Users',
          value: policy.conditions?.users?.includeUsers?.join(', ') || 'None',
          type: 'include',
        },
        {
          label: 'Exclude Users',
          value: policy.conditions?.users?.excludeUsers?.join(', ') || 'None',
          type: 'exclude',
        },
        {
          label: 'Include Groups',
          value: policy.conditions?.users?.includeGroups?.join(', ') || 'None',
          type: 'include',
        },
        {
          label: 'Exclude Groups',
          value: policy.conditions?.users?.excludeGroups?.join(', ') || 'None',
          type: 'exclude',
        },
      ],
    },
    {
      title: 'Applications',
      icon: AppWindow,
      items: [
        {
          label: 'Include Apps',
          value: policy.conditions?.applications?.includeApplications?.join(', ') || 'None',
          type: 'include',
        },
        {
          label: 'Exclude Apps',
          value: policy.conditions?.applications?.excludeApplications?.join(', ') || 'None',
          type: 'exclude',
        },
      ],
    },
    {
      title: 'Locations',
      icon: MapPin,
      items: [
        {
          label: 'Include Locations',
          value: policy.conditions?.locations?.includeLocations?.join(', ') || 'None',
          type: 'include',
        },
        {
          label: 'Exclude Locations',
          value: policy.conditions?.locations?.excludeLocations?.join(', ') || 'None',
          type: 'exclude',
        },
      ],
    },
    {
      title: 'Platforms',
      icon: Smartphone,
      items: [
        {
          label: 'Include Platforms',
          value: policy.conditions?.platforms?.includePlatforms?.join(', ') || 'All',
          type: 'include',
        },
        {
          label: 'Exclude Platforms',
          value: policy.conditions?.platforms?.excludePlatforms?.join(', ') || 'None',
          type: 'exclude',
        },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={policy.displayName || 'Policy Details'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3">
            <StateIcon className={`h-6 w-6 ${
              policy.state === 'enabled' ? 'text-green-500' :
              policy.state === 'disabled' ? 'text-red-500' : 'text-amber-500'
            }`} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant={stateBadge.variant} size="lg">
                {stateBadge.label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              Created: {formatDate(policy.createdDateTime)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="h-4 w-4" />
              Modified: {formatDate(policy.modifiedDateTime)}
            </div>
          </div>
        </div>

        {/* Grant Controls */}
        {policy.grantControls?.builtInControls?.length && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Grant Controls
              </h3>
              {policy.grantControls.operator && (
                <Badge variant="outline" size="sm">
                  {policy.grantControls.operator}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {policy.grantControls.builtInControls.map((control, index) => (
                <Badge key={index} variant="info" size="md">
                  {formatControlName(control)}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Session Controls */}
        {policy.sessionControls && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Laptop className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Session Controls
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {policy.sessionControls.signInFrequency && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Sign-in Frequency</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {policy.sessionControls.signInFrequency.value}{' '}
                    {policy.sessionControls.signInFrequency.type}
                  </p>
                </div>
              )}
              {policy.sessionControls.persistentBrowser && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Persistent Browser</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {policy.sessionControls.persistentBrowser.mode}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Conditions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Conditions</h3>
          {sections.map((section, sectionIndex) => {
            const hasValues = section.items.some(item => item.value !== 'None');
            if (!hasValues) return null;

            return (
              <Card key={sectionIndex} padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <section.icon className="h-5 w-5 text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h4>
                </div>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    item.value !== 'None' && (
                      <div key={itemIndex} className="flex items-start gap-2">
                        <span className={`mt-1 ${
                          item.type === 'include' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.type === 'include' ? '+' : '-'}
                        </span>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white break-all">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Risk Levels */}
        {(policy.conditions?.signInRiskLevels?.length || policy.conditions?.userRiskLevels?.length) && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Risk Levels</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {policy.conditions?.signInRiskLevels?.length && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sign-in Risk</p>
                  <div className="flex flex-wrap gap-1">
                    {policy.conditions.signInRiskLevels.map((level, index) => (
                      <Badge key={index} variant="warning" size="sm">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {policy.conditions?.userRiskLevels?.length && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Risk</p>
                  <div className="flex flex-wrap gap-1">
                    {policy.conditions.userRiskLevels.map((level, index) => (
                      <Badge key={index} variant="warning" size="sm">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

function formatControlName(control: string): string {
  const controlNames: Record<string, string> = {
    mfa: 'Multi-Factor Authentication',
    compliantDevice: 'Compliant Device Required',
    domainJoinedDevice: 'Domain Joined Device',
    approvedApplication: 'Approved Application',
    compliantApplication: 'Compliant Application',
    passwordChange: 'Password Change Required',
    block: 'Block Access',
  };
  return controlNames[control] || control;
}

export default PolicyDetailModal;
