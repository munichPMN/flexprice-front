import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router';
import ShortPagination from './ShortPagination';

const meta = {
	title: 'Atoms/ShortPagination',
	component: ShortPagination,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof ShortPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiPage: Story = {
	render: (args) => (
		<Routes>
			<Route path='/' element={<ShortPagination {...args} />} />
		</Routes>
	),
	args: {
		totalItems: 45,
		pageSize: 10,
		showPages: true,
		unit: 'rows',
	},
};
