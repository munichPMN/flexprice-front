import type { Meta, StoryObj } from '@storybook/react';
import Page from './Page';
import SectionHeader from '../SectionHeader/SectionHeader';

const meta = {
	title: 'Atoms/Page',
	component: Page,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeading: Story = {
	args: {
		heading: 'Storybook page',
		documentTitle: 'Storybook',
		children: <p className='text-muted-foreground'>Placeholder body content.</p>,
	},
};

export const LeftAligned: Story = {
	args: {
		type: 'left-aligned',
		heading: 'Left aligned layout',
		children: <p className='text-muted-foreground'>Wider horizontal padding.</p>,
	},
};

export const WithCustomHeader: Story = {
	args: {
		header: <SectionHeader title='Custom header' className='py-4' />,
		children: <p className='text-muted-foreground'>Uses the header prop instead of heading.</p>,
	},
};
