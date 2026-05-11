import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import { Button } from '@/components/atoms';
import Dialog from './Dialog';

const DialogPlayground: FC = () => {
	const [open, setOpen] = useState(false);
	return (
		<div>
			<Button onClick={() => setOpen(true)}>Open dialog</Button>
			<Dialog
				isOpen={open}
				onOpenChange={setOpen}
				title='Dialog title'
				description='Short description shown below the title.'
				className='sm:max-w-md'>
				<p className='text-sm text-muted-foreground'>Dialog body content goes here.</p>
			</Dialog>
		</div>
	);
};

const meta = {
	title: 'Atoms/Dialog',
	component: Dialog,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <DialogPlayground />,
};
