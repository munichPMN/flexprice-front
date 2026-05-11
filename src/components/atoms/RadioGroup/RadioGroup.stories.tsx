import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import RadioGroup from './RadioGroup';
import type { RadioMenuItem } from './RadioGroup';

const items: RadioMenuItem[] = [
	{ value: 'card', label: 'Card', description: 'Pay with card', icon: CreditCard },
	{ value: 'wallet', label: 'Wallet', description: 'Apply balance', icon: Wallet },
];

const RadioGroupDemo: FC = () => {
	const [selected, setSelected] = useState<RadioMenuItem | undefined>(items[0]);
	return <RadioGroup title='Payment method' items={items} selected={selected} onChange={setSelected} />;
};

const meta = {
	title: 'Atoms/RadioGroup',
	component: RadioGroup,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <RadioGroupDemo />,
};
