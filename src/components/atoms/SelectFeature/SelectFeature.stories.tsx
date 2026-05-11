import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC } from 'react';
import type { Feature } from '@/models/Feature';
import SelectFeature from './SelectFeature';

const Demo: FC = () => {
	const [value, setValue] = useState<string | undefined>('story-feat-metered');
	const [selected, setSelected] = useState<Feature | undefined>();
	return (
		<div className='max-w-md space-y-6'>
			<SelectFeature
				label='Feature (controlled id)'
				value={value}
				onChange={(feature) => {
					setSelected(feature);
					setValue(feature?.id);
				}}
				placeholder='Search…'
			/>
			<p className='text-xs text-muted-foreground'>
				Selection: {selected ? `${selected.name} (${selected.id})` : value ? `id: ${value}` : 'none'} — Storybook FeatureApi stub.
			</p>
		</div>
	);
};

const meta = {
	title: 'Atoms/SelectFeature',
	component: SelectFeature,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof SelectFeature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Demo />,
};
