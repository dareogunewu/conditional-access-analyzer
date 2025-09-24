export interface ConditionalAccessPolicy {
  id?: string;
  displayName?: string;
  state?: "enabled" | "disabled" | "enabledForReportingButNotEnforced";
  conditions?: {
    applications?: {
      includeApplications?: string[];
      excludeApplications?: string[];
    };
    users?: {
      includeUsers?: string[];
      excludeUsers?: string[];
      includeGroups?: string[];
      excludeGroups?: string[];
      includeRoles?: string[];
      excludeRoles?: string[];
    };
    locations?: {
      includeLocations?: string[];
      excludeLocations?: string[];
    };
    platforms?: {
      includePlatforms?: string[];
      excludePlatforms?: string[];
    };
    signInRiskLevels?: string[];
    userRiskLevels?: string[];
  };
  grantControls?: {
    operator?: "AND" | "OR";
    builtInControls?: string[];
    customAuthenticationFactors?: string[];
  };
  sessionControls?: {
    applicationEnforcedRestrictions?: boolean;
    cloudAppSecurity?: {
      cloudAppSecurityType?: string;
    };
    signInFrequency?: {
      value?: number;
      type?: "days" | "hours";
    };
    persistentBrowser?: {
      mode?: "always" | "never";
    };
  };
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface PolicyAnalysis {
  totalPolicies: number;
  enabledPolicies: number;
  disabledPolicies: number;
  reportOnlyPolicies: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  commonConditions: string[];
  orphanedPolicies: string[];
}