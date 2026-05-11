import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import MultiChipInput from './MultiChipInput';

const Demo: FC<Omit<ComponentProps<typeof MultiChipInput>, 'value' | 'onChange'>> = (props) => {
	const [value, setValue] = useState<string[]>(['alpha', 'beta']);
	return <MultiChipInput {...props} value={value} onChange={setValue} />;
};

const meta = {
	title: 'Atoms/MultiChipInput',
	component: MultiChipInput,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof MultiChipInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <Demo {...args} />,
	args: {
		label: 'Tags',
		placeholder: 'Type and press Enter',
	},
};
