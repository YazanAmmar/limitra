import { SubscriptionPlan } from './plans';

export enum Capability {
  ANALYTICS_BASIC = 'ANALYTICS_BASIC',
  ANALYTICS_ADVANCED = 'ANALYTICS_ADVANCED',
  ANALYTICS_EXPORT = 'ANALYTICS_EXPORT',
  AI_INSIGHTS = 'AI_INSIGHTS',
  CUSTOM_DOMAINS = 'CUSTOM_DOMAINS',
}

export const PLAN_CAPABILITIES: Record<SubscriptionPlan, Capability[] | 'ALL'> = {
  [SubscriptionPlan.FREE]: [Capability.ANALYTICS_BASIC],
  [SubscriptionPlan.PRO]: [
    Capability.ANALYTICS_BASIC,
    Capability.ANALYTICS_ADVANCED,
    Capability.ANALYTICS_EXPORT,
    Capability.CUSTOM_DOMAINS,
  ],
  [SubscriptionPlan.ULTIMATE]: 'ALL',
};
