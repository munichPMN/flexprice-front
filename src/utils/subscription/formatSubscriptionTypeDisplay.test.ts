import { describe, expect, it } from 'vitest';
import { formatSubscriptionTypeDisplayLabel } from '@/utils/subscription/formatSubscriptionTypeDisplay';
import { SUBSCRIPTION_TYPE } from '@/models/Subscription';

describe('formatSubscriptionTypeDisplayLabel', () => {
	it('maps known subscription types to labels', () => {
		expect(formatSubscriptionTypeDisplayLabel(SUBSCRIPTION_TYPE.DELEGATED_INVOICING)).toBe('Delegated invoicing');
		expect(formatSubscriptionTypeDisplayLabel(SUBSCRIPTION_TYPE.GROUPED_INVOICING)).toBe('Grouped invoicing');
		expect(formatSubscriptionTypeDisplayLabel(undefined)).toBe('Standalone');
	});

	it('title-cases unknown snake_case values', () => {
		expect(formatSubscriptionTypeDisplayLabel('future_type_here')).toBe('Future Type Here');
	});
});
