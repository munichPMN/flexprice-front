import type { Meta, StoryObj } from '@storybook/react';
import Card, { CardHeader } from './Card';

const meta = {
	title: 'Atoms/Card',
	component: Card,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: 'default',
		children: <p className='text-sm text-muted-foreground'>Card body content.</p>,
		className: 'max-w-md',
	},
};

export const Notched: Story = {
	args: {
		variant: 'notched',
		children: <p className='text-sm text-muted-foreground'>Notched variant.</p>,
		className: 'max-w-md',
	},
};

export const WithCardHeader: Story = {
	render: () => (
		<Card className='max-w-md'>
			<CardHeader title='Title' subtitle='Optional subtitle' cta={<span className='text-xs text-primary'>Action</span>} />
			<p className='text-sm text-muted-foreground'>Additional content.</p>
		</Card>
	),
};
