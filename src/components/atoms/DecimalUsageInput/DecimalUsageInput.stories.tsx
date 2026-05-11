import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import DecimalUsageInput from './DecimalUsageInput';

const DecimalDemo: FC<Omit<ComponentProps<typeof DecimalUsageInput>, 'value' | 'onChange'>> = (props) => {
	const [value, setValue] = useState('1.234');
	return <DecimalUsageInput {...props} value={value} onChange={setValue} />;
};

const meta = {
	title: 'Atoms/DecimalUsageInput',
	component: DecimalUsageInput,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof DecimalUsageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <DecimalDemo {...args} />,
	args: {
		label: 'Usage amount',
		description: 'Up to 3 decimal places.',
		suffix: 'units',
		precision: 3,
		max: 9999,
	},
};
