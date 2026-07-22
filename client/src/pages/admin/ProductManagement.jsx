import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal / Form state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [form, setForm] = useState({
        sku: '',
        name: '',
        description: '',
        category: 'HAIR',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: 0,
        reorderLevel: 5
    });

    // Adjust stock state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        quantityDiff: '',
        movementType: 'MANUAL_ADJUSTMENT',
        note: ''
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/products');
            if (res.data && res.data.success) {
                setProducts(res.data.data.products);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch product catalog.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('CREATE');
        setForm({
            sku: '',
            name: '',
            description: '',
            category: 'HAIR',
            costPrice: '',
            sellingPrice: '',
            stockQuantity: 0,
            reorderLevel: 5
        });
        setSelectedProduct(null);
        setShowModal(true);
    };

    const handleOpenEdit = (product) => {
        setModalMode('EDIT');
        setSelectedProduct(product);
        setForm({
            name: product.name,
            description: product.description || '',
            category: product.category,
            costPrice: Number(product.cost_price),
            sellingPrice: Number(product.selling_price),
            reorderLevel: Number(product.reorder_level),
            status: product.status
        });
        setShowModal(true);
    };

    const handleOpenAdjust = (product) => {
        setSelectedProduct(product);
        setAdjustForm({
            quantityDiff: '',
            movementType: 'MANUAL_ADJUSTMENT',
            note: ''
        });
        setShowAdjustModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            if (modalMode === 'CREATE') {
                const res = await api.post('/products', form);
                if (res.data.success) setShowModal(false);
            } else {
                const res = await api.patch(`/products/${selectedProduct.id}`, form);
                if (res.data.success) setShowModal(false);
            }
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product details.');
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const res = await api.post(`/products/${selectedProduct.id}/adjust-stock`, {
                quantityDiff: Number(adjustForm.quantityDiff),
                movementType: adjustForm.movementType,
                note: adjustForm.note
            });
            if (res.data.success) {
                setShowAdjustModal(false);
                fetchProducts();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to adjust stock levels.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate/delete this product?')) return;
        try {
            setError('');
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete product.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Product Catalog & Inventory</h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium">Add, update, deactivate products, or perform manual stock adjustments.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
                >
                    + Add New Product
                </button>
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
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500 border-collapse">
                            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Cost Price</th>
                                    <th className="px-6 py-3 text-right">Selling Price</th>
                                    <th className="px-6 py-3 text-center">Stock Level</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No products found. Add your first item.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((prod) => {
                                        const isLowStock = prod.stock_quantity <= prod.reorder_level;
                                        return (
                                            <tr key={prod.id} className="hover:bg-slate-50/20">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">{prod.sku}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-800 block">{prod.name}</span>
                                                    <span className="text-[11px] text-slate-400 truncate max-w-xs block">{prod.description || 'No description'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold">{prod.category}</td>
                                                <td className="px-6 py-4 text-right font-medium">LKR {Number(prod.cost_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900">LKR {Number(prod.selling_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                        {prod.stock_quantity}
                                                    </span>
                                                    {isLowStock && <p className="text-[10px] text-red-600 font-bold mt-1">Reorder level: {prod.reorder_level}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${prod.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                                        }`}>
                                                        {prod.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center space-x-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(prod)}
                                                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenAdjust(prod)}
                                                        className="rounded bg-pink-50 hover:bg-pink-100 border border-pink-200 px-2 py-1 text-xs font-bold text-pink-700 transition"
                                                    >
                                                        Adjust Stock
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(prod.id)}
                                                        className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                        <h3 className="text-base font-bold text-slate-950">{modalMode === 'CREATE' ? 'Add New Product' : 'Modify Product details'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">SKU Code</label>
                                    <input
                                        type="text"
                                        disabled={modalMode === 'EDIT'}
                                        value={form.sku}
                                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                        required
                                        placeholder="E.g. SHAM-001"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none disabled:bg-slate-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Product Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        placeholder="E.g. Premium Shampoo"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional details..."
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none h-16"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    >
                                        <option value="HAIR">Hair Care</option>
                                        <option value="FACE">Face Care</option>
                                        <option value="BODY">Body Care</option>
                                        <option value="NAILS">Nails</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Reorder Level Alert</label>
                                    <input
                                        type="number"
                                        value={form.reorderLevel}
                                        onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Cost Price (LKR)</label>
                                    <input
                                        type="number"
                                        value={form.costPrice}
                                        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Selling Price (LKR)</label>
                                    <input
                                        type="number"
                                        value={form.sellingPrice}
                                        onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {modalMode === 'CREATE' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Starting Stock Intake</label>
                                    <input
                                        type="number"
                                        value={form.stockQuantity}
                                        onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {modalMode === 'EDIT' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Catalog Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md transition"
                                >
                                    Save Product
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* ADJUST STOCK MODAL */}
            {showAdjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-950">Adjust Inventory Stock</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Product: <strong>{selectedProduct?.name}</strong> (Available: {selectedProduct?.stock_quantity})</p>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-4">

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">Adjustment Amount (Difference)</label>
                                <input
                                    type="number"
                                    value={adjustForm.quantityDiff}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, quantityDiff: e.target.value })}
                                    required
                                    placeholder="E.g. +10 (Add) or -5 (Reduce)"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">Adjustment Reason</label>
                                <select
                                    value={adjustForm.movementType}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                >
                                    <option value="STOCK_PURCHASE">Stock Purchase (Intake)</option>
                                    <option value="DAMAGED_PRODUCT">Damaged / Expired Product</option>
                                    <option value="MANUAL_ADJUSTMENT">Manual Count Adjustments</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">Internal Notes</label>
                                <input
                                    type="text"
                                    value={adjustForm.note}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                                    placeholder="Damaged in transit, shelf recount..."
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md transition"
                                >
                                    Record Adjustment
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
export default ProductManagement;
