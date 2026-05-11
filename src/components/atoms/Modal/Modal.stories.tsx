import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import { Button } from '@/components/atoms';
import Modal from './Modal';
import Card from '@/components/atoms/Card/Card';

const ModalPlayground: FC = () => {
	const [open, setOpen] = useState(false);
	return (
		<div>
			<Button onClick={() => setOpen(true)}>Open modal</Button>
			<Modal isOpen={open} onOpenChange={setOpen}>
				<Card className='w-full max-w-md p-8'>
					<h2 className='text-lg font-medium'>Modal content</h2>
					<p className='mt-2 text-sm text-muted-foreground'>Rendered via portal into #modal-root.</p>
					<Button className='mt-4' onClick={() => setOpen(false)}>
						Close
					</Button>
				</Card>
			</Modal>
		</div>
	);
};

const meta = {
	title: 'Atoms/Modal',
	component: Modal,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <ModalPlayground />,
};
