import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import Checkbox from './Checkbox';

const CheckboxDemo: FC<Omit<ComponentProps<typeof Checkbox>, 'checked' | 'onCheckedChange'>> = (props) => {
	const [checked, setChecked] = useState(false);
	return <Checkbox {...props} checked={checked} onCheckedChange={setChecked} id={props.id ?? 'story-checkbox'} />;
};

const meta = {
	title: 'Atoms/Checkbox',
	component: Checkbox,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <CheckboxDemo {...args} />,
	args: {
		label: 'Accept terms',
		description: 'You must accept to continue.',
		id: 'terms',
	},
};
