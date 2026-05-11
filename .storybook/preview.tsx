import 'tailwindcss/tailwind.css';
import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { Toaster } from 'react-hot-toast';

function createStorybookQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		(Story) => {
			const queryClient = createStorybookQueryClient();
			return (
				<QueryClientProvider client={queryClient}>
					<MemoryRouter>
						<div id='modal-root' />
						<Toaster position='bottom-center' />
						<Story />
					</MemoryRouter>
				</QueryClientProvider>
			);
		},
	],
};

export default preview;
