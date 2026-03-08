// Policy States
export const POLICY_STATES = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  REPORT_ONLY: 'enabledForReportingButNotEnforced',
} as const;

export type PolicyState = typeof POLICY_STATES[keyof typeof POLICY_STATES];

// Policy state display configuration
export const POLICY_STATE_CONFIG = {
  [POLICY_STATES.ENABLED]: {
    label: 'Enabled',
    color: 'success',
    description: 'Policy is actively enforcing access controls',
  },
  [POLICY_STATES.DISABLED]: {
    label: 'Disabled',
    color: 'danger',
    description: 'Policy is not active',
  },
  [POLICY_STATES.REPORT_ONLY]: {
    label: 'Report Only',
    color: 'warning',
    description: 'Policy is logging but not enforcing',
  },
} as const;

// Navigation views
export const VIEWS = {
  POLICIES: 'policies',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
} as const;

export type ViewType = typeof VIEWS[keyof typeof VIEWS];

// Report tabs
export const REPORT_TABS = {
  OVERVIEW: 'overview',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
} as const;

export type ReportTabType = typeof REPORT_TABS[keyof typeof REPORT_TABS];

// Grant controls that indicate strong security
export const STRONG_CONTROLS = ['mfa', 'compliantDevice', 'domainJoinedDevice'] as const;

// Risk thresholds for security scoring
export const SECURITY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
