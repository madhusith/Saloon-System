import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const InventoryHistory = () => {
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [productFilter, setProductFilter] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            setError('');

            let queryStr = `page=${page}&limit=15`;
            if (productFilter) queryStr += `&productId=${productFilter}`;
            if (reasonFilter) queryStr += `&movementType=${reasonFilter}`;

            const res = await api.get(`/inventory/movements?${queryStr}`);
            if (res.data && res.data.success) {
                setMovements(res.data.data.movements);
                setTotalPages(res.data.data.meta.totalPages);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch stock logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial products catalog load for filter drop-down
        const fetchCatalog = async () => {
            try {
                const res = await api.get('/products');
                if (res.data && res.data.success) {
                    setProducts(res.data.data.products);
                }
            } catch (err) {
                console.warn('Failed to load products list for dropdown filters', err);
            }
        };
        fetchCatalog();
    }, []);

    useEffect(() => {
        fetchMovements();
    }, [page, productFilter, reasonFilter]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Inventory Audit Logs</h1>
                <p className="mt-1 text-sm text-slate-500 font-medium">Verify all recorded stock changes, sales deductions, returns, and manual adjustments.</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
                    {error}
                </div>
            )}

            {/* Filter panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Filter Product</label>
                    <select
                        value={productFilter}
                        onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                    >
                        <option value="">All Products</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Movement Reason</label>
                    <select
                        value={reasonFilter}
                        onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                    >
                        <option value="">All Reasons</option>
                        <option value="STOCK_PURCHASE">Stock Purchase</option>
                        <option value="POS_SALE">POS Sale Deduction</option>
                        <option value="CUSTOMER_RETURN">Customer Return</option>
                        <option value="DAMAGED_PRODUCT">Damaged / Expired</option>
                        <option value="MANUAL_ADJUSTMENT">Manual adjustment</option>
                    </select>
                </div>

                <button
                    onClick={() => { setProductFilter(''); setReasonFilter(''); setPage(1); }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                    Clear Filters
                </button>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500 border-collapse">
                            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Timestamp</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-center">Change Qty</th>
                                    <th className="px-6 py-3 text-center">Stock Log</th>
                                    <th className="px-6 py-3">Logged By</th>
                                    <th className="px-6 py-3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {movements.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No stock movements recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    movements.map((move) => {
                                        const isAddition = move.quantity > 0;
                                        return (
                                            <tr key={move.id} className="hover:bg-slate-50/20">
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                                    {new Date(move.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{move.product_sku}</td>
                                                <td className="px-6 py-4 text-slate-700 font-semibold">{move.product_name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${move.movement_type === 'STOCK_PURCHASE' ? 'bg-emerald-100 text-emerald-800' :
                                                            move.movement_type === 'POS_SALE' ? 'bg-blue-100 text-blue-800' :
                                                                move.movement_type === 'DAMAGED_PRODUCT' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                        {move.movement_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold">
                                                    <span className={isAddition ? 'text-emerald-600' : 'text-red-600'}>
                                                        {isAddition ? `+${move.quantity}` : move.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-medium text-slate-600">
                                                    {move.stock_before} → {move.stock_after}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-700">{move.creator_name}</td>
                                                <td className="px-6 py-4 text-xs italic text-slate-400">{move.note || '—'}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default InventoryHistory;
