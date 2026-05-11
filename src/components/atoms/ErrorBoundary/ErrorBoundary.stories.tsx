import type { Meta, StoryObj } from '@storybook/react';
import type { FC } from 'react';
import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

const ThrowOnClick: FC = () => {
	const [shouldThrow, setShouldThrow] = useState(false);
	if (shouldThrow) throw new Error('Triggered error boundary (Storybook)');
	return (
		<button type='button' className='rounded border px-3 py-2 text-sm' onClick={() => setShouldThrow(true)}>
			Throw error
		</button>
	);
};

const ThrowsImmediately: FC = () => {
	throw new Error('Render-time failure (Storybook)');
};

function ResettableBoundaryPlayground() {
	const [boundaryKey, setBoundaryKey] = useState(0);
	return (
		<div className='space-y-4 p-4 max-w-xl'>
			<p className='text-muted-foreground text-sm'>
				Trigger an error on demand, then use &quot;Reset boundary&quot; to remount and try again.
			</p>
			<button type='button' className='rounded border px-3 py-2 text-sm' onClick={() => setBoundaryKey((k) => k + 1)}>
				Reset boundary
			</button>
			<ErrorBoundary key={boundaryKey} name='storybook-interactive'>
				<ThrowOnClick />
			</ErrorBoundary>
		</div>
	);
}

const meta = {
	title: 'Atoms/ErrorBoundary',
	component: ErrorBoundary,
	tags: ['autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
	render: () => <ResettableBoundaryPlayground />,
};

export const ImmediateFailure: Story = {
	render: () => (
		<ErrorBoundary name='storybook-immediate'>
			<ThrowsImmediately />
		</ErrorBoundary>
	),
};
