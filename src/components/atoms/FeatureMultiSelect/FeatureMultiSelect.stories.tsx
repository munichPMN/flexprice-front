import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import type { Feature } from '@/models/Feature';
import FeatureMultiSelect from './FeatureMultiSelect';

const Demo: FC = () => {
	const [selected, setSelected] = useState<Feature[]>([]);
	return (
		<div className='max-w-md'>
			<FeatureMultiSelect
				label='Features'
				placeholder='Pick features'
				values={selected.map((f) => f.id)}
				onChange={(f) => {
					setSelected(f);
				}}
			/>
			<p className='mt-2 text-xs text-muted-foreground'>Selected: {selected.map((f) => f.name).join(', ') || '—'}</p>
		</div>
	);
};

const meta = {
	title: 'Atoms/FeatureMultiSelect',
	component: FeatureMultiSelect,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof FeatureMultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Demo />,
};
