import type { Meta, StoryObj } from '@storybook/react';
import Chip from './Chip';

const meta = {
	title: 'Atoms/Chip',
	component: Chip,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Default',
		variant: 'default',
	},
};

export const Success: Story = {
	args: {
		label: 'Active',
		variant: 'success',
	},
};

export const Warning: Story = {
	args: {
		label: 'Pending',
		variant: 'warning',
	},
};

export const Failed: Story = {
	args: {
		label: 'Error',
		variant: 'failed',
	},
};

export const Info: Story = {
	args: {
		label: 'Info',
		variant: 'info',
	},
};
