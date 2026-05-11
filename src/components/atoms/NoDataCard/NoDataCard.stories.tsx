import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/atoms';
import NoDataCard from './NoDataCard';

const meta = {
	title: 'Atoms/NoDataCard',
	component: NoDataCard,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof NoDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'No data yet',
		subtitle: 'Create your first record to see it here.',
		cta: <Button size='sm'>Get started</Button>,
	},
};
