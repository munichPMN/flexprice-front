import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';

const steps = [{ label: 'Details' }, { label: 'Pricing' }, { label: 'Review' }];

const meta = {
	title: 'Atoms/Stepper',
	component: Stepper,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
	args: {
		steps,
		activeStep: 0,
	},
};

export const MiddleStep: Story = {
	args: {
		steps,
		activeStep: 1,
	},
};

export const LastStep: Story = {
	args: {
		steps,
		activeStep: 2,
	},
};
