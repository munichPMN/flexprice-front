import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import Textarea from './Textarea';

const TextareaControlled: FC<Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange'>> = (props) => {
	const [value, setValue] = useState('Initial text');
	return <Textarea {...props} value={value} onChange={setValue} />;
};

const meta = {
	title: 'Atoms/Textarea',
	component: Textarea,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <TextareaControlled {...args} />,
	args: {
		label: 'Notes',
		placeholder: 'Add details…',
	},
};

export const WithError: Story = {
	render: (args) => <TextareaControlled {...args} />,
	args: {
		label: 'Description',
		error: 'This field is required.',
		placeholder: '…',
	},
};
