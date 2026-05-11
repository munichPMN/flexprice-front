import type { Meta, StoryObj } from '@storybook/react';
import { Cpu, Database } from 'lucide-react';
import MultiSelect from './MultiSelect';

const options = [
	{ label: 'Postgres', value: 'pg', icon: Database },
	{ label: 'Compute', value: 'cpu', icon: Cpu },
	{ label: 'Disabled', value: 'off', disabled: true },
];

const meta = {
	title: 'Atoms/MultiSelect',
	component: MultiSelect,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <MultiSelect {...args} />,
	args: {
		options,
		onValueChange: () => {},
		placeholder: 'Select services',
		maxCount: 2,
		className: 'max-w-md',
	},
};
