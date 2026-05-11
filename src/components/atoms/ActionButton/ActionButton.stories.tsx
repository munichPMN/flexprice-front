import type { Meta, StoryObj } from '@storybook/react';
import ActionButton from './ActionButton';

const deleteOk = async (_id: string) => {
	await Promise.resolve();
};

const meta = {
	title: 'Atoms/ActionButton',
	component: ActionButton,
	tags: ['autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithOnEdit: Story = {
	args: {
		id: 'ent_1',
		deleteMutationFn: deleteOk,
		refetchQueryKey: 'storybook-action-button',
		entityName: 'customer',
		edit: {
			enabled: true,
			onClick: () => {},
			text: 'Edit',
		},
		archive: {
			enabled: true,
			text: 'Archive',
		},
	},
};

export const EditNavigates: Story = {
	args: {
		id: 'ent_2',
		deleteMutationFn: deleteOk,
		refetchQueryKey: 'storybook-action-button',
		entityName: 'plan',
		edit: {
			enabled: true,
			path: '/settings/plans/story',
		},
		archive: { enabled: false },
	},
};

export const CustomActions: Story = {
	args: {
		id: 'ent_3',
		deleteMutationFn: deleteOk,
		refetchQueryKey: 'storybook-action-button',
		entityName: 'subscription',
		edit: { enabled: false },
		archive: { enabled: false },
		customActions: [
			{ text: 'Duplicate', onClick: () => {} },
			{ text: 'Export CSV', onClick: () => {} },
		],
	},
};
