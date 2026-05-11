import type { Meta, StoryObj } from '@storybook/react';
import type { FC, ComponentProps } from 'react';
import { useState } from 'react';
import DatePicker from './DatePicker';

const DatePickerStateful: FC<Omit<ComponentProps<typeof DatePicker>, 'date' | 'setDate'>> = (props) => {
	const [date, setDate] = useState<Date | undefined>(new Date('2026-06-01T12:00:00'));
	return <DatePicker {...props} date={date} setDate={setDate} />;
};

const meta = {
	title: 'Atoms/DatePicker',
	component: DatePicker,
	tags: ['autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <DatePickerStateful {...args} />,
	args: {
		label: 'Start date',
		placeholder: 'Pick a date',
	},
};

export const WithBounds: Story = {
	render: (args) => <DatePickerStateful {...args} />,
	args: {
		label: 'Bounded',
		minDate: new Date('2026-01-01'),
		maxDate: new Date('2026-12-31'),
	},
};

export const Disabled: Story = {
	render: (args) => <DatePickerStateful {...args} />,
	args: {
		label: 'Disabled',
		disabled: true,
	},
};
