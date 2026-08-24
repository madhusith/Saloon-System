import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';

export const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders/my?limit=50');
      if (res.data && res.data.success) {
        setOrders(res.data.data.orders);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">View and track status of all product pickup orders placed at Beauty Lane.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Order Reference</th>
                  <th className="px-6 py-3">Pickup Date</th>
                  <th className="px-6 py-3 text-right">Total Paid</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                      You haven't placed any product orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/20">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.order_reference}</td>
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
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/customer/orders/${order.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Details
                        </Link>
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
  );
};
export default MyOrders;
