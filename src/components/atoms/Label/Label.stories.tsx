import type { Meta, StoryObj } from '@storybook/react';
import Label from './Label';

const meta = {
	title: 'Atoms/Label',
	component: Label,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Field label',
		htmlFor: 'story-field',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Disabled label',
		htmlFor: 'story-field-2',
		disabled: true,
	},
};
