import type { Meta, StoryObj } from '@storybook/react';
import type { FC, ComponentProps } from 'react';
import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

const DateRangePickerStateful: FC<Omit<ComponentProps<typeof DateRangePicker>, 'onChange' | 'startDate' | 'endDate'>> = (props) => {
	const [range, setRange] = useState<{ startDate?: Date; endDate?: Date }>({
		startDate: new Date('2026-05-01'),
		endDate: new Date('2026-05-15'),
	});
	return (
		<DateRangePicker
			{...props}
			startDate={range.startDate}
			endDate={range.endDate}
			onChange={(next) => setRange((prev) => ({ ...prev, ...next }))}
		/>
	);
};

const meta = {
	title: 'Atoms/DateRangePicker',
	component: DateRangePicker,
	tags: ['autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <DateRangePickerStateful {...args} />,
	args: {
		title: 'Reporting period',
		placeholder: 'Select range',
	},
};
