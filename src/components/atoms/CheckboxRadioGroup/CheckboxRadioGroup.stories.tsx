import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import CheckboxRadioGroup from './CheckboxRadioGroup';
import type { CheckboxRadioGroupItem } from './CheckboxRadioGroup';

const items: CheckboxRadioGroupItem[] = [
	{ label: 'Option A', value: 'a', description: 'First choice' },
	{ label: 'Option B', value: 'b', description: 'Second choice' },
	{ label: 'Option C', value: 'c', disabled: true, description: 'Disabled' },
];

const CheckboxRadioGroupDemo: FC = () => {
	const [value, setValue] = useState('a');
	return <CheckboxRadioGroup title='Select one' checkboxItems={items} value={value} onChange={setValue} />;
};

const meta = {
	title: 'Atoms/CheckboxRadioGroup',
	component: CheckboxRadioGroup,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof CheckboxRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <CheckboxRadioGroupDemo />,
};
