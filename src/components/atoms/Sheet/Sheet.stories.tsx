import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import { Button } from '@/components/atoms';
import Sheet from './Sheet';

const SheetPlayground: FC = () => {
	const [open, setOpen] = useState(false);
	return (
		<div>
			<Button onClick={() => setOpen(true)}>Open sheet</Button>
			<Sheet isOpen={open} onOpenChange={setOpen} title='Sheet title' description='Side panel description' size='md'>
				<div className='mt-4 text-sm text-muted-foreground'>
					<p>Sheet panel body.</p>
				</div>
			</Sheet>
		</div>
	);
};

const meta = {
	title: 'Atoms/Sheet',
	component: Sheet,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
	render: () => <SheetPlayground />,
};

export const WithTrigger: Story = {
	render: () => (
		<Sheet trigger={<Button variant='outline'>Open with trigger</Button>} title='Triggered sheet' description='Opened via SheetTrigger'>
			<p className='mt-4 text-sm'>Content</p>
		</Sheet>
	),
};
