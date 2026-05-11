import type { Meta, StoryObj } from '@storybook/react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

const meta = {
	title: 'Atoms/Tooltip',
	component: Tooltip,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content: 'This is helpful tooltip text.',
		delayDuration: 0,
		children: (
			<button type='button' className='inline-flex items-center gap-1 rounded border px-2 py-1 text-sm'>
				Hover me
				<HelpCircle className='h-4 w-4' />
			</button>
		),
	},
};
