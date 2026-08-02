import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/orders/${id}`);
      if (res.data && res.data.success) {
        setOrder(res.data.data.order);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? You will receive a full mock refund.')) return;

    try {
      setCancelLoading(true);
      setError('');
      const res = await api.post(`/orders/${id}/cancel`);
      if (res.data && res.data.success) {
        fetchOrderDetails();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
        {error}
      </div>
    );
  }

  const isCancellable = order.order_status === 'PAID' || order.order_status === 'PENDING';
  const payment = order.payments?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            to="/customer/orders"
            className="text-xs font-bold text-pink-700 hover:text-pink-600 block mb-2"
          >
            ← Back to Order History
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order details</h1>
            <span className="font-mono font-bold text-slate-400">#{order.order_reference}</span>
          </div>
        </div>

        {isCancellable && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelLoading}
            className="rounded-xl border border-red-200 bg-red-50/20 hover:bg-red-50 text-xs font-bold text-red-600 px-4 py-2.5 transition"
          >
            {cancelLoading ? 'Cancelling Order...' : 'Cancel Order (Refund)'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Line Items Snapshot</h2>
            </div>
            
            <table className="w-full text-left text-sm text-slate-500 border-collapse">
              <thead className="bg-slate-50/50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-slate-900">
                      {item.product_name_snapshot}
                      {item.product_sku && <span className="block font-mono text-[9px] text-slate-400 font-bold mt-0.5">{item.product_sku}</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-800">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">LKR {Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-900 font-bold">LKR {Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order tracking sidebar */}
        <div className="space-y-6">
          {/* Status info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Tracking & Status</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Order Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  order.order_status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' :
                  order.order_status === 'READY' ? 'bg-purple-100 text-purple-800' :
                  order.order_status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                  order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {order.order_status}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Payment Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  order.payment_status === 'REFUNDED' ? 'bg-slate-200 text-slate-700' :
                  order.payment_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Scheduled Pickup</span>
                <span className="text-slate-900 font-bold">{new Date(order.pickup_date).toLocaleDateString()}</span>
              </div>
              {order.customer_note && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold block mb-1">Your Instructions</span>
                  <p className="text-xs italic text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{order.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment receipt */}
          {payment && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Online Settlement</h3>
              
              <div className="space-y-3 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="text-slate-800 font-bold">{payment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gateway</span>
                  <span className="text-slate-800 font-bold">{payment.gateway_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Txn Code</span>
                  <span className="text-slate-800 font-mono font-bold">{payment.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid At</span>
                  <span className="text-slate-800 font-bold">{new Date(payment.paid_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OrderDetails;
