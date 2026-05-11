import type { Meta, StoryObj } from '@storybook/react';
import Progress from './Progress';

const meta = {
	title: 'Atoms/Progress',
	component: Progress,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Half: Story = {
	args: {
		value: 50,
		label: '50% complete',
	},
};

export const Complete: Story = {
	args: {
		value: 100,
		label: 'Done',
	},
};

export const Low: Story = {
	args: {
		value: 15,
		label: 'Starting…',
	},
};
