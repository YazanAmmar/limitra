import { SubscriptionPlan } from './plans';
import { Capability, PLAN_CAPABILITIES } from './capabilities';
import { LimitType, PLAN_LIMITS } from './limits';

export class SubscriptionService {
  public getCurrentPlan(): SubscriptionPlan {
    return SubscriptionPlan.FREE; // MVP Status
  }

  public hasCapability(capability: Capability): boolean {
    const plan = this.getCurrentPlan();
    const capabilities = PLAN_CAPABILITIES[plan];

    if (capabilities === 'ALL') return true;
    return capabilities.includes(capability);
  }

  public getLimit(limit: LimitType): number {
    const plan = this.getCurrentPlan();
    return PLAN_LIMITS[plan][limit] || 0;
  }
}
