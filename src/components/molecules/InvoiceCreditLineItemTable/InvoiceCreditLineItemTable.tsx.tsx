import { FormHeader } from '@/components/atoms';
import { LineItem } from '@/models/Invoice';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC } from 'react';

interface Props {
	data: LineItem[];
	currency?: string;
	total_amount?: number;
	sub_total?: number;
	tax?: number;
	title?: string;
	total_label?: string;
}

const formatAmount = (amount: number, currency: string): string => {
	return `${getCurrencySymbol(currency)}${amount}`;
};

const InvoiceCreditLineItemTable: FC<Props> = ({ data, total_amount, currency, title, sub_total, tax, total_label }) => {
	if (data.length === 0) {
		return <div></div>;
	}

	return (
		<div>
			<div className='w-full '>
				<FormHeader className='!mb-0' title={title} variant='form-component-title' titleClassName='font-semibold' />

				<div className='overflow-x-auto'>
					<table className='table-auto w-full border-collapse text-start text-sm text-gray-800 my-4 px-4'>
						<thead className='border-b border-gray-200'>
							<tr>
								<th className='py-2 px-2 text-gray-600'>Subscription</th>

								<th className='py-2 px-2 text-gray-600 text-center'>Credit Quantity</th>
								<th className='py-2 px-2 text-gray-600 text-center'>Unit Price</th>
								<th className='py-2 px-2 text-gray-600 text-end'> Credit Amount</th>
							</tr>
						</thead>
						<tbody>
							{data?.map((item, index) => {
								return (
									<tr key={index}>
										<td className='py-3 px-2 text-gray-800'>{item.display_name ?? '--'}</td>
										<td className='py-3 px-2 text-center text-gray-800'>{item.quantity ?? '--'}</td>
										<td className='py-3 px-2 text-center text-gray-800'>{'--'}</td>
										<td className='py-3 px-2 text-end text-[#2A9D90]'>{formatAmount(item.amount ?? '--', item.currency)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className='flex justify-end px-[6px]  py-4 border-t border-gray-200'>
					<div className='text-sm text-gray-800 space-y-4 w-1/3'>
						<div className='flex justify-between'>
							<span>Subtotal</span>
							<span className='text-[#2A9D90] '>{`${getCurrencySymbol(currency ?? '')}${sub_total}`}</span>
						</div>
						<div className='flex justify-between'>
							<span>Tax</span>
							<span>{tax || '--'}</span>
						</div>
						<div className=' border-t '></div>
						<div className='flex justify-between font-bold text-gray-900 '>
							<span>{total_label || 'Credit on Customer Wallet'}</span>
							<span className=' text-[#2A9D90] '>{formatAmount(total_amount ?? 0, currency ?? '')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InvoiceCreditLineItemTable;
