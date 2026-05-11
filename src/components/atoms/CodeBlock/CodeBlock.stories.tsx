import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from './CodeBlock';

const sample = `import { ping } from './api'

export async function main() {
  await ping({ retries: 3 })
}
`;

const meta = {
	title: 'Atoms/CodeBlock',
	component: CodeBlock,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScript: Story = {
	args: {
		code: sample,
		language: 'typescript',
	},
};

export const Json: Story = {
	args: {
		code: JSON.stringify({ event: 'usage.recorded', quantity: 42 }, null, 2),
		language: 'json',
	},
};
