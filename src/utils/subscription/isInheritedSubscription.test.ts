import { describe, expect, it } from 'vitest';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { SUBSCRIPTION_TYPE } from '@/models/Subscription';

describe('isInheritedSubscription', () => {
	it('returns true only for subscription_type inherited', () => {
		expect(isInheritedSubscription({ subscription_type: SUBSCRIPTION_TYPE.INHERITED })).toBe(true);
		expect(isInheritedSubscription({ subscription_type: 'inherited' })).toBe(true);
	});

	it('returns false for grouped_invoicing even with a parent link', () => {
		expect(isInheritedSubscription({ subscription_type: SUBSCRIPTION_TYPE.GROUPED_INVOICING })).toBe(false);
		expect(
			isInheritedSubscription({
				subscription_type: SUBSCRIPTION_TYPE.GROUPED_INVOICING,
			}),
		).toBe(false);
	});

	it('returns false for standalone, parent, delegated_invoicing, and missing type', () => {
		expect(isInheritedSubscription({ subscription_type: SUBSCRIPTION_TYPE.STANDALONE })).toBe(false);
		expect(isInheritedSubscription({ subscription_type: SUBSCRIPTION_TYPE.PARENT })).toBe(false);
		expect(isInheritedSubscription({ subscription_type: SUBSCRIPTION_TYPE.DELEGATED_INVOICING })).toBe(false);
		expect(isInheritedSubscription({})).toBe(false);
		expect(isInheritedSubscription({ subscription_type: '' })).toBe(false);
	});
});
