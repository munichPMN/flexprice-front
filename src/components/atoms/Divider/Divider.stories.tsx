import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';

const meta = {
	title: 'Atoms/Divider',
	component: Divider,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		width: '100%',
		alignment: 'center',
	},
};

export const Narrow: Story = {
	args: {
		width: '120px',
		alignment: 'left',
	},
};
