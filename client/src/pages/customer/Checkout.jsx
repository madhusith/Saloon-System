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
        paymentMethod: 'ONLINE',
        cardDetails: {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expiryDate,
          cvv
        },
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
        <p className="mt-1 text-sm text-slate-500 font-medium">Verify products subtotal and complete secure mock online payment settlement.</p>
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

          {/* Secure mock payment details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Mock Online Payment</h3>
              <span className="text-[10px] bg-pink-100 text-pink-800 font-extrabold px-2 py-0.5 rounded">Mock Gateway</span>
            </div>

            <p className="text-xs text-slate-500 font-medium">Use prefilled values for local sandbox checkout verification. Real credit cards are not processed.</p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Card Number</label>
                <input
                  type="text"
                  maxLength="16"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  placeholder="4111 1111 1111 1111"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Expiration Date</label>
                  <input
                    type="text"
                    maxLength="5"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">CVV / Code</label>
                  <input
                    type="password"
                    maxLength="3"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                    placeholder="123"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none font-mono"
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
              {loading ? 'Confirming Online Payment...' : 'Secure Mock Pay & Place Order'}
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
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
