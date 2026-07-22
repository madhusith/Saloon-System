import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export const POS = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Prefilled appointment state from QueueBoard redirection
  const prefilledAppointment = location.state?.appointment || null;

  // POS State variables
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Checkout cart item rows
  const [cartItems, setCartItems] = useState([]);
  
  // Checkout details
  const [selectedCustomerId, setSelectedCustomerId] = useState(prefilledAppointment?.customer_id || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Admin override credentials if discount > 10%
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial catalogs fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, productsRes, staffRes, usersRes] = await Promise.all([
          api.get('/services?status=ACTIVE'),
          api.get('/products?status=ACTIVE'),
          api.get('/staff'),
          api.get('/users?role=CUSTOMER&limit=200')
        ]);

        setServicesCatalog(servicesRes.data.data.services || []);
        setProductsCatalog(productsRes.data.data.products || []);
        setStylists(staffRes.data.data.staff || []);
        setCustomers(usersRes.data.data.users || []);

        // Prefill cart if appointment is passed
        if (prefilledAppointment) {
          const serviceRows = prefilledAppointment.services.map(s => ({
            id: `service-${s.id}-${Date.now()}`,
            itemType: 'SERVICE',
            serviceId: s.id,
            productId: null,
            itemNameSnapshot: s.name,
            quantity: 1,
            unitPrice: Number(s.price),
            subtotal: Number(s.price),
            staffId: prefilledAppointment.staff_id || ''
          }));
          setCartItems(serviceRows);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to initialize POS catalogs.');
      }
    };
    fetchData();
  }, [prefilledAppointment]);

  const addServiceToCart = (serviceId) => {
    const s = servicesCatalog.find(item => item.id === Number(serviceId));
    if (!s) return;

    setCartItems([
      ...cartItems,
      {
        id: `service-${s.id}-${Date.now()}`,
        itemType: 'SERVICE',
        serviceId: s.id,
        productId: null,
        itemNameSnapshot: s.name,
        quantity: 1,
        unitPrice: Number(s.price),
        subtotal: Number(s.price),
        staffId: prefilledAppointment?.staff_id || ''
      }
    ]);
  };

  const addProductToCart = (productId) => {
    const p = productsCatalog.find(item => item.id === Number(productId));
    if (!p) return;

    // Check if product is already in cart, increment quantity if so
    const existingIndex = cartItems.findIndex(item => item.itemType === 'PRODUCT' && item.productId === p.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: `product-${p.id}-${Date.now()}`,
          itemType: 'PRODUCT',
          serviceId: null,
          productId: p.id,
          itemNameSnapshot: p.name,
          quantity: 1,
          unitPrice: Number(p.selling_price),
          subtotal: Number(p.selling_price)
        }
      ]);
    }
  };

  const updateItemQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          const qty = Number(newQty);
          return {
            ...item,
            quantity: qty,
            subtotal: qty * item.unitPrice
          };
        }
        return item;
      })
    );
  };

  const updateServiceStylist = (id, staffId) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          return { ...item, staffId: Number(staffId) };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Subtotal calculation
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Sync discount percent and LKR amount
  const handleDiscountPercentChange = (val) => {
    const pct = Math.max(0, Math.min(100, Number(val)));
    setDiscountPercent(pct);
    setDiscountAmount(Number(((pct / 100) * subtotal).toFixed(2)));
  };

  const handleDiscountAmountChange = (val) => {
    const amt = Math.max(0, Math.min(subtotal, Number(val)));
    setDiscountAmount(amt);
    setDiscountPercent(subtotal > 0 ? Number(((amt / subtotal) * 100).toFixed(2)) : 0);
  };

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const exceedsCashierLimit = discountPercent > 10;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Cannot checkout with an empty cart.');
      return;
    }

    // Verify all services have stylist assigned
    const missingStylist = cartItems.some(item => item.itemType === 'SERVICE' && !item.staffId);
    if (missingStylist) {
      setError('Please assign a stylist to all service items.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const checkoutData = {
        appointmentId: prefilledAppointment?.id || null,
        customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
        subtotal,
        discountAmount,
        totalAmount,
        paymentMethod,
        transactionReference: transactionRef,
        items: cartItems.map(item => ({
          itemType: item.itemType,
          productId: item.productId,
          serviceId: item.serviceId,
          itemNameSnapshot: item.itemNameSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        adminOverrideEmail: exceedsCashierLimit ? adminEmail : null,
        adminOverridePassword: exceedsCashierLimit ? adminPassword : null
      };

      const res = await api.post('/pos/checkout', checkoutData);

      if (res.data && res.data.success) {
        const { saleId } = res.data.data;
        // Redirect to print invoice view
        navigate(`/cashier/sales?invoice=${saleId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Checkout failed. Please check credentials or stock availability.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Point of Sale (POS)</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          {prefilledAppointment 
            ? `Completing appointment billing checkout for customer ${prefilledAppointment.customer_name}`
            : 'Start walk-in billing and product checkout.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Cart and Catalog Pickers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Billing Cart</h2>
              {prefilledAppointment && (
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-800">
                  Ref: {prefilledAppointment.booking_reference}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead className="bg-slate-50/50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Item Detail</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                        Cart is currently empty. Add items from the selectors below.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-900">{item.itemNameSnapshot}</span>
                            <span className={`ml-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              item.itemType === 'SERVICE' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.itemType}
                            </span>
                          </div>
                          {item.itemType === 'SERVICE' && (
                            <div className="mt-2 flex items-center space-x-2">
                              <label className="text-xs font-semibold text-slate-500">Stylist:</label>
                              <select
                                value={item.staffId}
                                onChange={(e) => updateServiceStylist(item.id, e.target.value)}
                                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-none"
                              >
                                <option value="">Assign Stylist</option>
                                {stylists.map(st => (
                                  <option key={st.id} value={st.id}>{st.fullName}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.itemType === 'PRODUCT' ? (
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQty(item.id, e.target.value)}
                              className="w-16 rounded-md border border-slate-200 text-center py-1 text-sm focus:outline-none focus:border-pink-500"
                            />
                          ) : (
                            <span className="font-medium text-slate-800">{item.quantity}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">
                          LKR {Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          LKR {Number(item.subtotal).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-600 transition"
                            title="Remove line"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catalog Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Services catalog */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Add Service</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {servicesCatalog.map(service => (
                  <button
                    key={service.id}
                    onClick={() => addServiceToCart(service.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-100 hover:border-pink-100 hover:bg-pink-50/20 p-3 transition text-left"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{service.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{service.duration_minutes} mins</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800">LKR {Number(service.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products catalog */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Add Product</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {productsCatalog.map(product => (
                  <button
                    key={product.id}
                    disabled={product.stock_quantity <= 0}
                    onClick={() => addProductToCart(product.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-100 hover:border-pink-100 hover:bg-pink-50/20 p-3 transition text-left disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Stock: {product.stock_quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800">LKR {Number(product.selling_price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Totals, Discounts and Submission */}
        <div>
          <form onSubmit={handleCheckoutSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Checkout Details</h3>
            
            {/* Customer Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Customer Profile</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-pink-500 focus:outline-none"
              >
                <option value="">General Walk-in Customer</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>{cust.fullName} ({cust.phone})</option>
                ))}
              </select>
            </div>

            {/* Calculations Summary */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-sm font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-900">LKR {subtotal.toFixed(2)}</span>
              </div>

              {/* Discount inputs */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase block">Apply Discount</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => handleDiscountPercentChange(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discountAmount}
                      onChange={(e) => handleDiscountAmountChange(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">LKR</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                <span>Total Due</span>
                <span className="text-pink-700">LKR {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Admin override section if discount > 10% */}
            {exceedsCashierLimit && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
                <p className="text-xs font-semibold text-red-700">
                  ⚠️ Discount percentage ({discountPercent}%) exceeds cashier limit (10%). Requires Administrator credential override approval.
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Admin Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase block">Payment Settlement</label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'ONLINE'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-lg py-2 text-xs font-bold border transition ${
                      paymentMethod === method
                        ? 'border-pink-700 bg-pink-50 text-pink-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod !== 'CASH' && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-slate-500">Transaction Reference / Code</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="E.g. TXN-18239A"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="w-full rounded-xl bg-pink-700 py-3 text-sm font-bold text-white shadow-md shadow-pink-900/10 hover:bg-pink-600 transition disabled:opacity-50"
            >
              {loading ? 'Processing Checkout...' : 'Record Payment & Invoicing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default POS;
