import type { Meta, StoryObj } from '@storybook/react';
import CodePreview from './CodePreview';

const snippet = `const price = await client.prices.retrieve('price_123');
console.log(price.unit_amount);`;

const meta = {
	title: 'Atoms/CodePreview',
	component: CodePreview,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof CodePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Example',
		code: snippet,
		language: 'javascript',
	},
};

export const WithoutTitle: Story = {
	args: {
		code: snippet,
		language: 'javascript',
	},
};
