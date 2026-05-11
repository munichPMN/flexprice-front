import { SUBSCRIPTION_TYPE } from '@/models/Subscription';

/** True only for inherited “mirror” subscriptions (no own line items); not `grouped_invoicing` children. */
export function isInheritedSubscription(sub: { subscription_type?: string | null }): boolean {
	const t = sub.subscription_type?.toLowerCase();
	return t === SUBSCRIPTION_TYPE.INHERITED;
}
