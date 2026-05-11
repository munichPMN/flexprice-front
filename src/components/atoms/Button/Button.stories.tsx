import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import Button from './Button';
import AddButton from './AddButton';

const meta = {
	title: 'Atoms/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: 'Button',
		variant: 'default',
	},
};

export const Outline: Story = {
	args: {
		children: 'Outline',
		variant: 'outline',
	},
};

export const Destructive: Story = {
	args: {
		children: 'Delete',
		variant: 'destructive',
	},
};

export const Loading: Story = {
	args: {
		children: 'Saving',
		isLoading: true,
	},
};

export const WithIcons: Story = {
	args: {
		children: 'Create',
		prefixIcon: <Plus />,
	},
};

export const AddButtonStory: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-3'>
			<AddButton />
			<AddButton label='New item' />
		</div>
	),
};
