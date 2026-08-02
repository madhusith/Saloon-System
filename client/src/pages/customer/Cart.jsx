import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('salon_cart') || '[]');
    setCartItems(cart);
  }, []);

  const updateQuantity = (id, change) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + change;
        if (newQty < 1) return item;
        // Verify stock limit
        if (change > 0 && newQty > item.maxStock) {
          alert(`Cannot purchase more. Only ${item.maxStock} items available in stock.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem('salon_cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('salon_cart', JSON.stringify(updated));
  };

  const clearCart = () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    setCartItems([]);
    localStorage.setItem('salon_cart', '[]');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Verify your items before proceeding to pick-up checkout.</p>
        </div>
        <Link
          to="/customer/shop"
          className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
        >
          ← Continue Shopping
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-4">
          <span className="text-5xl block">🛒</span>
          <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet. Head back to the shop to browse our collections.</p>
          <Link
            to="/customer/shop"
            className="inline-flex rounded-xl bg-pink-700 hover:bg-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500 border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-center">Quantity</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/20">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">{item.sku}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition text-slate-600 font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-7 w-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition text-slate-600 font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700">
                          LKR {Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          LKR {(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-600 transition"
                            title="Remove item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={clearCart}
              className="rounded-lg border border-red-200 hover:bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition"
            >
              Clear Cart
            </button>
          </div>

          {/* Cart totals */}
          <div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Order Summary</h3>

              <div className="space-y-4 text-sm font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">LKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping/Pickup</span>
                  <span className="text-emerald-600 font-bold">FREE Salon Pickup</span>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-pink-700">LKR {subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/customer/checkout"
                className="block w-full rounded-xl bg-pink-700 hover:bg-pink-600 py-3 text-center text-sm font-bold text-white shadow-md shadow-pink-900/10 transition"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Cart;
