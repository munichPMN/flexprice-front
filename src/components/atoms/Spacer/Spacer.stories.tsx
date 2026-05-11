import type { Meta, StoryObj } from '@storybook/react';
import Spacer from './Spacer';

const meta = {
	title: 'Atoms/Spacer',
	component: Spacer,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
	args: {
		height: 48,
		width: '100%',
	},
};

export const Horizontal: Story = {
	args: {
		width: 80,
		height: 1,
	},
};
