import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const InvoiceView = ({ saleId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sales/${saleId}`);
        if (res.data && res.data.success) {
          setSale(res.data.data.sale);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchInvoiceDetails();
    }
  }, [saleId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
        {error || 'Invoice not found.'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 max-w-2xl mx-auto print:border-0 print:shadow-none print:p-0">
      
      {/* Action buttons (hidden on print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          ← Back to Log
        </button>
        <button
          onClick={handlePrint}
          className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition"
        >
          Print Invoice 🖨️
        </button>
      </div>

      {/* Invoice Receipt layout */}
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Salon Shyani</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">123 Galle Road, Colombo 03</p>
            <p className="text-xs text-slate-400 font-semibold">Tel: +94 11 234 5678</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-extrabold text-pink-700">INVOICE</h2>
            <p className="text-xs font-bold text-slate-700 mt-1">{sale.invoice_number}</p>
            <p className="text-[11px] text-slate-400 font-semibold">Date: {new Date(sale.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6 text-xs text-slate-500 font-medium">
          <div>
            <h4 className="font-bold text-slate-900 uppercase mb-1">Bill To:</h4>
            <p className="text-slate-700 font-bold">{sale.customer_name || 'General Customer'}</p>
            {sale.customer_phone && <p>Phone: {sale.customer_phone}</p>}
            {sale.customer_email && <p>Email: {sale.customer_email}</p>}
          </div>
          <div className="text-right">
            <h4 className="font-bold text-slate-900 uppercase mb-1">Served By:</h4>
            <p className="text-slate-700 font-bold">{sale.cashier_name}</p>
            <p>Payment: <span className="font-bold text-pink-700">{sale.payments?.[0]?.payment_method || 'CASH'}</span></p>
            {sale.payments?.[0]?.transaction_reference && (
              <p>Reference: {sale.payments[0].transaction_reference}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-2 font-bold text-slate-900 uppercase">Item Detail</th>
              <th className="px-4 py-2 font-bold text-slate-900 uppercase text-center w-16">Qty</th>
              <th className="px-4 py-2 font-bold text-slate-900 uppercase text-right w-24">Unit Price</th>
              <th className="px-4 py-2 font-bold text-slate-900 uppercase text-right w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/20">
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-800">{item.item_name_snapshot}</span>
                  <span className={`ml-2 text-[9px] font-extrabold px-1 py-0.5 rounded ${
                    item.item_type === 'SERVICE' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.item_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-800 font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-800 font-medium">LKR {Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-bold">LKR {Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="border-t border-slate-200 pt-4 flex flex-col items-end text-xs font-semibold text-slate-500 space-y-1.5 pr-4">
          <div className="flex justify-between w-64">
            <span>Subtotal:</span>
            <span className="text-slate-800">LKR {Number(sale.subtotal).toFixed(2)}</span>
          </div>
          {Number(sale.discount_amount) > 0 && (
            <div className="flex justify-between w-64 text-red-600">
              <span>Discount Applied:</span>
              <span>-LKR {Number(sale.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
            <span>Total Amount Paid:</span>
            <span className="text-pink-700">LKR {Number(sale.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 font-semibold">
          <p>Thank you for choosing Salon Shyani! Have a wonderful day.</p>
          <p className="mt-1">Software Powered by Antigravity OS.</p>
        </div>

      </div>
    </div>
  );
};
export default InvoiceView;
