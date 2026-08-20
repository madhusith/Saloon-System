import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';

export const ProductShop = () => {
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/products?status=ACTIVE';
      if (categoryFilter) {
        url += `&category=${categoryFilter}`;
      }
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setProducts(res.data.data.products);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load products catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Sync cart count
    const cart = JSON.parse(localStorage.getItem('salon_cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  }, [categoryFilter]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('salon_cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      // Check stock limit
      if (cart[existingIndex].quantity >= product.stock_quantity) {
        setMessage(`Cannot add more. Only ${product.stock_quantity} available in stock.`);
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.selling_price),
        quantity: 1,
        maxStock: product.stock_quantity
      });
    }

    localStorage.setItem('salon_cart', JSON.stringify(cart));
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    setMessage(`Added "${product.name}" to cart successfully!`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Online Product Shop</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Browse premium haircare, skincare, and styling products for home delivery/salon pickup.</p>
        </div>
        <Link
          to="/customer/cart"
          className="relative inline-flex items-center rounded-xl bg-pink-700 hover:bg-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
        >
          <span>🛒 View Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-extrabold text-white animate-bounce border-2 border-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {message && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 font-medium animate-fade-in">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { key: '', label: 'All Products' },
          { key: 'HAIR', label: 'Hair Care' },
          { key: 'FACE', label: 'Face Care' },
          { key: 'BODY', label: 'Body Care' },
          { key: 'NAILS', label: 'Nails' },
          { key: 'OTHER', label: 'Other' }
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition border ${
              categoryFilter === cat.key
                ? 'bg-pink-700 border-pink-700 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium">
              No products found in this category.
            </div>
          ) : (
            products.map((product) => {
              const outOfStock = product.stock_quantity <= 0;
              const serverUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5050';
              const imageUrl = product.image_url 
                ? (product.image_url.startsWith('http') ? product.image_url : `${serverUrl}${product.image_url}`) 
                : null;
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-200"
                >
                  <div>
                    {/* Image placeholder or product category */}
                    <div className="h-40 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-4 relative">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <span className="text-4xl">🧴</span>
                      )}
                      <span className="absolute top-2.5 right-2.5 rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-600 uppercase">
                        {product.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">{product.sku}</span>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight block group-hover:text-pink-700 transition">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed">
                        {product.description || 'Premium saloon styling solution.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">LKR {Number(product.selling_price).toFixed(2)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        outOfStock 
                          ? 'bg-red-100 text-red-800' 
                          : product.stock_quantity <= product.reorder_level
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {outOfStock ? 'Out of Stock' : `${product.stock_quantity} In Stock`}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                      className="w-full rounded-xl bg-pink-700 hover:bg-pink-600 disabled:bg-slate-100 text-xs font-bold text-white disabled:text-slate-400 py-2.5 text-center transition shadow-sm hover:shadow"
                    >
                      {outOfStock ? 'Unavailable' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
export default ProductShop;
