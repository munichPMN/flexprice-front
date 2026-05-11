/**
 * Stub used only inside Storybook (see .storybook/main.ts viteFinal alias).
 * Keeps FeatureMultiSelect / SelectFeature stories offline.
 */

import type {
	CreateFeatureRequest,
	UpdateFeatureRequest,
	FeatureResponse,
	ListFeaturesResponse,
	FeatureFilter,
	GetFeaturesPayload,
	GetFeaturesResponse,
	GetFeatureByFilterPayload,
	UpdateFeaturePayload,
} from '@/types/dto';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models';

const base = {
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-01T00:00:00.000Z',
	created_by: 'storybook',
	updated_by: 'storybook',
	status: ENTITY_STATUS.PUBLISHED,
	environment_id: 'env_story',
};

const MOCK_FEATURES: FeatureResponse[] = [
	{
		...base,
		id: 'story-feat-metered',
		name: 'API calls',
		description: 'Metered usage feature',
		type: FEATURE_TYPE.METERED,
		meter_id: 'meter_story',
		metadata: {},
		unit_plural: 'calls',
		unit_singular: 'call',
		tenant_id: 'tenant_story',
	},
	{
		...base,
		id: 'story-feat-boolean',
		name: 'SSO enabled',
		description: 'Boolean entitlement',
		type: FEATURE_TYPE.BOOLEAN,
		meter_id: '',
		metadata: {},
		unit_plural: '',
		unit_singular: '',
		tenant_id: 'tenant_story',
	},
	{
		...base,
		id: 'story-feat-static',
		name: 'Support tier',
		description: 'Static configuration',
		type: FEATURE_TYPE.STATIC,
		meter_id: '',
		metadata: {},
		unit_plural: '',
		unit_singular: '',
		tenant_id: 'tenant_story',
	},
];

function filterItems(filter: FeatureFilter = {}): FeatureResponse[] {
	let items = [...MOCK_FEATURES];
	if (filter.name_contains?.trim()) {
		const q = filter.name_contains.toLowerCase();
		items = items.filter((f) => f.name.toLowerCase().includes(q));
	}
	return items;
}

class FeatureApi {
	public static async createFeature(_data: CreateFeatureRequest): Promise<FeatureResponse> {
		return MOCK_FEATURES[0];
	}

	public static async getFeatureById(id: string): Promise<FeatureResponse> {
		const found = MOCK_FEATURES.find((f) => f.id === id);
		if (!found) {
			throw new Error(`Storybook FeatureApi: unknown id ${id}`);
		}
		return found;
	}

	public static async listFeatures(filter: FeatureFilter = {}): Promise<ListFeaturesResponse> {
		const items = filterItems(filter);
		const limit = filter.limit ?? items.length;
		const offset = filter.offset ?? 0;
		return {
			items: items.slice(offset, offset + limit),
			pagination: { total: items.length, limit, offset },
		};
	}

	public static async updateFeature(id: string, _data: UpdateFeatureRequest): Promise<FeatureResponse> {
		return this.getFeatureById(id);
	}

	public static async deleteFeature(_id: string): Promise<void> {
		return;
	}

	public static async listFeaturesByFilter(filter: FeatureFilter): Promise<ListFeaturesResponse> {
		return this.listFeatures(filter);
	}

	public static async getAllFeatures(_payload?: GetFeaturesPayload): Promise<GetFeaturesResponse> {
		const list = await this.listFeatures({});
		return list as unknown as GetFeaturesResponse;
	}

	public static async getFeaturesByFilter(_payload: GetFeatureByFilterPayload): Promise<GetFeaturesResponse> {
		const list = await this.listFeatures({});
		return list as unknown as GetFeaturesResponse;
	}

	public static async updateFeatureLegacy(id: string, _data: UpdateFeaturePayload): Promise<FeatureResponse> {
		return this.getFeatureById(id);
	}
}

export default FeatureApi;
