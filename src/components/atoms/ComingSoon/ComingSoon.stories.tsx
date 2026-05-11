import type { Meta, StoryObj } from '@storybook/react';
import ComingSoonTag from './ComingSoon';

const meta = {
	title: 'Atoms/ComingSoonTag',
	component: ComingSoonTag,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof ComingSoonTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className='relative inline-flex min-h-16 min-w-48 items-center justify-center rounded-lg border border-dashed'>
			<span className='text-sm text-muted-foreground'>Feature area</span>
			<div className='absolute top-2 right-2'>
				<ComingSoonTag />
			</div>
		</div>
	),
};
