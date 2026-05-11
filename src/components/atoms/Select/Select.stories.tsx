import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FC, type ComponentProps } from 'react';
import { Select, SearchableSelect, AsyncSearchableSelect, AsyncMultiSearchableSelect } from './index';
import type { SelectOption } from './Select';

const staticOptions: SelectOption[] = [
	{ value: 'us', label: 'United States' },
	{ value: 'uk', label: 'United Kingdom', description: 'Great Britain' },
	{ value: 'de', label: 'Germany', disabled: true },
];

const meta = {
	title: 'Atoms/Select',
	component: Select,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const SelectControlled: FC<ComponentProps<typeof Select>> = (props) => {
	const [value, setValue] = useState<string | undefined>(props.value ?? 'us');
	return <Select {...props} value={value} onChange={setValue} />;
};

export const BasicSelect: Story = {
	render: (args) => <SelectControlled {...args} />,
	args: {
		label: 'Country',
		placeholder: 'Choose…',
		options: staticOptions,
	},
};

const SearchableStory: FC = () => {
	const [value, setValue] = useState<string | undefined>();
	return (
		<div className='max-w-sm'>
			<SearchableSelect label='Searchable' options={staticOptions} value={value} onChange={setValue} placeholder='Pick one' />
		</div>
	);
};

export const Searchable: StoryObj<typeof SearchableSelect> = {
	render: () => <SearchableStory />,
};

type SimpleRow = { id: string; name: string };

const asyncRows: SimpleRow[] = [
	{ id: 'a', name: 'Acme Corp' },
	{ id: 'b', name: 'Beta LLC' },
];

const AsyncSearchableStory: FC = () => {
	const [value, setValue] = useState<SimpleRow | undefined>();
	return (
		<div className='max-w-sm'>
			<AsyncSearchableSelect<SimpleRow>
				search={{
					searchFn: async (query) => {
						const q = query.trim().toLowerCase();
						return asyncRows
							.filter((r) => !q || r.name.toLowerCase().includes(q))
							.map((r) => ({
								value: r.id,
								label: r.name,
								data: r,
							}));
					},
					debounceTime: 200,
					placeholder: 'Search customers…',
				}}
				extractors={{
					valueExtractor: (r) => r.id,
					labelExtractor: (r) => r.name,
				}}
				display={{ label: 'Customer', placeholder: 'Select customer' }}
				value={value}
				onChange={setValue}
			/>
		</div>
	);
};

export const AsyncSearchable: StoryObj<typeof AsyncSearchableSelect<SimpleRow>> = {
	render: () => <AsyncSearchableStory />,
};

const AsyncMultiSearchableStory: FC = () => {
	const [value, setValue] = useState<SimpleRow[]>([]);
	return (
		<div className='max-w-md'>
			<AsyncMultiSearchableSelect<SimpleRow>
				search={{
					searchFn: async (query) => {
						const q = query.trim().toLowerCase();
						return asyncRows
							.filter((r) => !q || r.name.toLowerCase().includes(q))
							.map((r) => ({
								value: r.id,
								label: r.name,
								data: r,
							}));
					},
					debounceTime: 200,
				}}
				extractors={{
					valueExtractor: (r) => r.id,
					labelExtractor: (r) => r.name,
				}}
				display={{ label: 'Customers', placeholder: 'Select accounts' }}
				value={value}
				onChange={setValue}
				options={{ maxCount: 4 }}
			/>
		</div>
	);
};

export const AsyncMultiSearchable: StoryObj<typeof AsyncMultiSearchableSelect<SimpleRow>> = {
	render: () => <AsyncMultiSearchableStory />,
};
