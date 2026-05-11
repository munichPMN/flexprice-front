import type { Meta, StoryObj } from '@storybook/react';
import type { FC, ComponentProps } from 'react';
import { useState } from 'react';
import DateTimePicker from './DateTimePicker';

const DateTimePickerStateful: FC<Omit<ComponentProps<typeof DateTimePicker>, 'date' | 'setDate'>> = (props) => {
	const [date, setDate] = useState<Date | undefined>(new Date('2026-06-01T14:30:00'));
	return <DateTimePicker {...props} date={date} setDate={setDate} />;
};

const meta = {
	title: 'Atoms/DateTimePicker',
	component: DateTimePicker,
	tags: ['autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => <DateTimePickerStateful {...args} />,
	args: {
		title: 'Scheduled at',
		placeholder: 'Pick date and time',
	},
};

export const Disabled: Story = {
	render: (args) => <DateTimePickerStateful {...args} />,
	args: {
		title: 'Disabled',
		disabled: true,
	},
};
