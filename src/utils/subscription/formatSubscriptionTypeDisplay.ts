import { SUBSCRIPTION_TYPE } from '@/models/Subscription';

const DISPLAY_LABEL_BY_TYPE: Record<SUBSCRIPTION_TYPE, string> = {
	[SUBSCRIPTION_TYPE.STANDALONE]: 'Standalone',
	[SUBSCRIPTION_TYPE.DELEGATED_INVOICING]: 'Delegated invoicing',
	[SUBSCRIPTION_TYPE.PARENT]: 'Parent',
	[SUBSCRIPTION_TYPE.INHERITED]: 'Inherited',
	[SUBSCRIPTION_TYPE.GROUPED_INVOICING]: 'Grouped invoicing',
};

/** Human-readable label for API `subscription_type` (snake_case enums or unknown values). */
export function formatSubscriptionTypeDisplayLabel(raw: string | null | undefined): string {
	if (!raw?.trim()) return DISPLAY_LABEL_BY_TYPE[SUBSCRIPTION_TYPE.STANDALONE];

	const key = raw.trim().toLowerCase() as SUBSCRIPTION_TYPE;
	const known = DISPLAY_LABEL_BY_TYPE[key];
	if (known) return known;

	return key
		.split('_')
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
}
