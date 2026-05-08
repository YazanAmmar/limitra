import { SubscriptionPlan } from './plans';

export enum LimitType {
  ANALYTICS_RETENTION_DAYS = 'ANALYTICS_RETENTION_DAYS',
  MAX_CUSTOM_DOMAINS = 'MAX_CUSTOM_DOMAINS',
  MAX_AI_REQUESTS = 'MAX_AI_REQUESTS',
}

export const PLAN_LIMITS: Record<SubscriptionPlan, Record<LimitType, number>> = {
  [SubscriptionPlan.FREE]: {
    [LimitType.ANALYTICS_RETENTION_DAYS]: 7,
    [LimitType.MAX_CUSTOM_DOMAINS]: 0,
    [LimitType.MAX_AI_REQUESTS]: 0,
  },
  [SubscriptionPlan.PRO]: {
    [LimitType.ANALYTICS_RETENTION_DAYS]: 365,
    [LimitType.MAX_CUSTOM_DOMAINS]: 10,
    [LimitType.MAX_AI_REQUESTS]: 100,
  },
  [SubscriptionPlan.ULTIMATE]: {
    [LimitType.ANALYTICS_RETENTION_DAYS]: 9999,
    [LimitType.MAX_CUSTOM_DOMAINS]: 9999,
    [LimitType.MAX_AI_REQUESTS]: 9999,
  },
};
