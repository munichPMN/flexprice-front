import type { Meta, StoryObj } from '@storybook/react';
import { CopyIdButton } from './CopyIdButton';

const meta = {
	title: 'Atoms/CopyIdButton',
	component: CopyIdButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof CopyIdButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'feat_abc123xyz',
		entityType: 'Feature',
	},
};

export const CustomToast: Story = {
	args: {
		id: 'id_to_copy',
		toastMessage: 'Copied to clipboard',
	},
};
