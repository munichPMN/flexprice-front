import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import Combobox from './Combobox';

const OPTIONS = [
	{ value: 'next', label: 'Next.js' },
	{ value: 'vite', label: 'Vite' },
	{ value: 'rs', label: 'Remix' },
];

const Demo: FC = () => {
	const [value, setValue] = useState<string | undefined>();
	return (
		<div className='max-w-xs'>
			<Combobox options={OPTIONS} value={value} onChange={setValue} placeholder='Framework' width='100%' />
		</div>
	);
};

const meta = {
	title: 'Atoms/Combobox',
	component: Combobox,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Demo />,
};
