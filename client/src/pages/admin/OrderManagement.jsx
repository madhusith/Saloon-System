import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/orders?limit=100';
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setOrders(res.data.data.orders);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve order queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const confirmMsg = newStatus === 'CANCELLED' 
      ? 'Are you sure you want to cancel this order? Stock will be restored and payment refunded.'
      : `Advance order status to ${newStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      setError('');
      const res = await api.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
      if (res.data && res.data.success) {
        // Refresh orders and selected order if details panel is open
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          const detailRes = await api.get(`/orders/${orderId}`);
          setSelectedOrder(detailRes.data.data.order);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${order.id}`);
      if (res.data && res.data.success) {
        setSelectedOrder(res.data.data.order);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Online Order Management</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Verify, pack, and mark product online orders as ready for pick-up.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end justify-between">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
          >
            <option value="">All Orders</option>
            <option value="PAID">Paid (New)</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY">Ready for Pickup</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          onClick={() => { setStatusFilter(''); setSelectedOrder(null); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Orders queue listing */}
        <div className="lg:col-span-2 space-y-4">
          {loading && orders.length === 0 ? (
            <div className="flex h-48 items-center justify-center bg-white border border-slate-200 rounded-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500 border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Pickup</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                          No product orders in queue.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-slate-50/20 cursor-pointer ${
                            selectedOrder?.id === order.id ? 'bg-pink-50/10' : ''
                          }`}
                          onClick={() => handleViewDetails(order)}
                        >
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.order_reference}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 block">{order.customer_name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{order.customer_email}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700">
                            {new Date(order.pickup_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            LKR {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              order.order_status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' :
                              order.order_status === 'READY' ? 'bg-purple-100 text-purple-800' :
                              order.order_status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                              order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            {order.order_status === 'PAID' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                                disabled={actionLoading}
                                className="rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 transition"
                              >
                                Process
                              </button>
                            )}
                            {order.order_status === 'PROCESSING' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'READY')}
                                disabled={actionLoading}
                                className="rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 transition"
                              >
                                Ready
                              </button>
                            )}
                            {order.order_status === 'READY' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                disabled={actionLoading}
                                className="rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                              >
                                Handover
                              </button>
                            )}
                            {order.order_status !== 'COMPLETED' && order.order_status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                                disabled={actionLoading}
                                className="rounded border border-red-200 bg-white hover:bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div>
          {selectedOrder ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 sticky top-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Order Information</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Customer details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Contacts</span>
                <span className="text-sm font-bold text-slate-900 block">{selectedOrder.customer_name}</span>
                <span className="text-xs text-slate-500 block">{selectedOrder.customer_email}</span>
                <span className="text-xs text-slate-500 block">{selectedOrder.customer_phone || 'No phone provided'}</span>
              </div>

              {/* Items snaps */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Products Ordered</span>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-slate-600 font-medium">
                      <div>
                        <span className="font-bold text-slate-800">{item.product_name_snapshot}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Qty: {item.quantity} x LKR {Number(item.unit_price).toFixed(2)}</span>
                      </div>
                      <span className="font-bold text-slate-900">LKR {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations summary */}
              <div className="bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">LKR {Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/50 font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="text-pink-700">LKR {Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Pickup Date</span>
                <span className="text-xs font-bold text-slate-700">{new Date(selectedOrder.pickup_date).toLocaleDateString()}</span>
                {selectedOrder.customer_note && (
                  <>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block pt-2">Notes</span>
                    <p className="text-xs italic text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">{selectedOrder.customer_note}</p>
                  </>
                )}
              </div>

              {/* Payments transaction */}
              {selectedOrder.payments?.[0] && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Detail</span>
                  <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span className="text-slate-800 font-bold">{selectedOrder.payments[0].payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ref Code</span>
                      <span className="text-slate-800 font-mono font-bold">{selectedOrder.payments[0].transaction_reference}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 font-medium h-48 flex items-center justify-center">
              Select an order from the list to view items breakdown and customer details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OrderManagement;
