import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import Toggle from './Toggle';

const ToggleDemo: FC<Omit<ComponentProps<typeof Toggle>, 'checked' | 'onChange'>> = (props) => {
	const [checked, setChecked] = useState(false);
	return <Toggle {...props} checked={checked} onChange={setChecked} />;
};

const meta = {
	title: 'Atoms/Toggle',
	component: Toggle,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <ToggleDemo {...args} />,
	args: {
		title: 'Notifications',
		label: 'Email alerts',
		description: 'Receive email when usage crosses limits.',
	},
};

export const Disabled: Story = {
	render: (args) => <ToggleDemo {...args} />,
	args: {
		title: 'Beta',
		label: 'Experimental features',
		description: 'Unavailable in this environment.',
		disabled: true,
	},
};
