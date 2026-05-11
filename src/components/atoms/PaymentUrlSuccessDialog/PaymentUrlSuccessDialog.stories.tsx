import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import { Button } from '@/components/atoms';
import PaymentUrlSuccessDialog from './PaymentUrlSuccessDialog';

const Demo: FC = () => {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	return (
		<div>
			<Button onClick={() => setOpen(true)}>Show payment success</Button>
			<PaymentUrlSuccessDialog
				isOpen={open}
				paymentUrl='https://pay.example.test/checkout/demo'
				isCopied={copied}
				onClose={() => setOpen(false)}
				onCopyUrl={() => setCopied(true)}
				onGoToLink={() => setOpen(false)}
			/>
		</div>
	);
};

const meta = {
	title: 'Atoms/PaymentUrlSuccessDialog',
	component: PaymentUrlSuccessDialog,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof PaymentUrlSuccessDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Demo />,
};
