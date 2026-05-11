import type { Meta, StoryObj } from '@storybook/react';
import Loader, { PageLoader } from './Loader';

const meta = {
	title: 'Atoms/Loader',
	component: Loader,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className='h-64 w-full border border-dashed rounded-md'>
			<Loader />
		</div>
	),
};

export const PageLoaderStory: Story = {
	render: () => <PageLoader />,
};
