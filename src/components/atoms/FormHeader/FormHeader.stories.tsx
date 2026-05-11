import type { Meta, StoryObj } from '@storybook/react';
import FormTitle from './FormHeader';

const meta = {
	title: 'Atoms/FormHeader',
	component: FormTitle,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof FormTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormTitleVariant: Story = {
	args: {
		variant: 'form-title',
		title: 'Billing address',
		subtitle: 'Used on invoices and receipts.',
	},
};

export const DefaultHeading: Story = {
	args: {
		variant: 'default',
		title: 'Account settings',
		subtitle: 'Manage your workspace preferences.',
	},
};

export const SubHeader: Story = {
	args: {
		variant: 'sub-header',
		title: 'Line items',
		subtitle: 'Drag to reorder.',
	},
};

export const CardTitle: Story = {
	args: {
		variant: 'card-title',
		title: 'Payment method',
	},
};
