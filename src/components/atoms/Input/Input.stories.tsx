import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import Input from './Input';

/** Storybook `render` callbacks are not hooks components; keep state in a named component. */
const InputWithValue: FC<Omit<ComponentProps<typeof Input>, 'value' | 'onChange'>> = (props) => {
	const [value, setValue] = useState('John Doe');
	return <Input {...props} value={value} onChange={setValue} />;
};

const meta = {
	title: 'Atoms/Input',
	component: Input,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		onChange: { action: 'changed' },
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Enter text here',
	},
};

export const WithLabel: Story = {
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'email',
	},
};

export const WithError: Story = {
	args: {
		label: 'Password',
		type: 'password',
		error: 'Password must be at least 8 characters',
		placeholder: 'Enter your password',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Username',
		placeholder: 'Enter your username',
		disabled: true,
	},
};

export const WideField: Story = {
	args: {
		label: 'Full name',
		placeholder: 'Enter your full name',
		className: 'min-w-[320px]',
	},
	parameters: {
		layout: 'padded',
	},
};

export const WithValue: Story = {
	render: (args) => <InputWithValue {...args} />,
	args: {
		label: 'Name',
		placeholder: 'Enter your name',
	},
};
