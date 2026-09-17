import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';

export const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Form states
  const [pickupDate, setPickupDate] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [cardNumber, setCardNumber] = useState('4111111111111111');
  const [expiryDate, setExpiryDate] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Minimum date selection constraint (today)
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('salon_cart') || '[]');
    if (cart.length === 0) {
      navigate('/customer/shop');
    } else {
      setCartItems(cart);
    }
  }, [navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!pickupDate) {
      setError('Please select a pickup date.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const orderData = {
        pickupDate,
        customerNote,
        paymentMethod: 'PAY_AT_SALON',
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/orders', orderData);

      if (res.data && res.data.success) {
        // Clear local storage cart
        localStorage.setItem('salon_cart', '[]');
        // Redirect to order history
        navigate('/customer/orders');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Check stock availability or inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Checkout Order</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Verify your pickup details and reserve products. Settle your payment conveniently at the salon upon collection.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Checkout Forms */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 space-y-6">
          {/* Pickup configurations */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Pickup Information</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Pickup Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Pickup Instructions / Notes</label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Optional details or specific timing preferences..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none h-20"
                />
              </div>
            </div>
          </div>

          {/* Prominent Notice for Online Payment Coming Soon / Pay at Salon */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                ℹ️
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                Payment Notice (Phase 1)
              </span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Pay at Salon
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-950 leading-relaxed pl-8">
              "Online Payment feature is coming soon and get your order from saloon and pay at the saloon , book your pickup time and date now"
            </p>
          </div>

          {/* Secure mock payment details (Untouchable / Grayed Out for Phase 1) */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-100/70 p-6 shadow-sm space-y-4 opacity-60 pointer-events-none select-none cursor-not-allowed">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Online Card Payment</h3>
                <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded">Unavailable in Phase 1</span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Direct card gateway integration is coming in the next phase. Please pay at the front desk when picking up your products.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Card Number</label>
                <input
                  type="text"
                  disabled
                  value="•••• •••• •••• 1111"
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-200/60 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Expiration Date</label>
                  <input
                    type="text"
                    disabled
                    value="MM/YY"
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-200/60 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">CVV / Code</label>
                  <input
                    type="password"
                    disabled
                    value="..."
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-200/60 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/customer/cart"
              className="text-xs font-bold text-slate-500 hover:text-slate-600"
            >
              ← Back to Cart
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-pink-700 hover:bg-pink-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-pink-900/10 transition disabled:opacity-50"
            >
              {loading ? 'Reserving Pickup Order...' : 'Book Pickup & Place Order (Pay at Salon)'}
            </button>
          </div>
        </form>

        {/* Order review sidebar */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Review Items</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-slate-600 font-medium">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Qty: {item.quantity} x LKR {item.price.toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-slate-900">LKR {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm font-medium text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800">LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200/50">
                <span>Total Due</span>
                <span className="text-pink-700">LKR {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800">Payment Option</div>
              <p className="font-semibold text-amber-950">Pay at Salon upon Pickup</p>
              <p className="text-[11px] text-amber-900/80 leading-snug">Online card payment will be activated in Phase 2.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
