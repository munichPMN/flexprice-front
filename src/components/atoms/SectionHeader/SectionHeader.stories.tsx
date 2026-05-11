import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import SectionHeader from './SectionHeader';

const meta = {
	title: 'Atoms/SectionHeader',
	component: SectionHeader,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Customers',
	},
};

export const WithActions: Story = {
	args: {
		title: 'Invoices',
		showSearch: true,
		showFilter: true,
		showButton: true,
		buttonText: 'Create',
		buttonIcon: <Plus className='size-4' />,
		onSearchClick: () => {},
		onFilterClick: () => {},
		onButtonClick: () => {},
	},
};

export const WithChildren: Story = {
	args: {
		title: 'Usage',
		children: <span className='text-sm text-muted-foreground'>Extra slot</span>,
	},
};
