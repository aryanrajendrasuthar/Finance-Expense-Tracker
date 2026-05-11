import { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Upload, Search, ChevronLeft, ChevronRight, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { transactionsApi, categoriesApi } from '../services/api';
import type { Transaction, Category, TransactionFilters } from '../types';
import { TransactionModal } from '../components/Transactions/TransactionModal';
import { CSVImport } from '../components/Transactions/CSVImport';

const PAGE_SIZE = 15;

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1, limit: PAGE_SIZE, sortBy: 'date', sortOrder: 'DESC',
    type: '', categoryId: '', startDate: '', endDate: '', search: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransactionFilters = { ...filters };
      if (!params.type) delete params.type;
      if (!params.categoryId) delete params.categoryId;
      if (!params.startDate) delete params.startDate;
      if (!params.endDate) delete params.endDate;
      if (!params.search) delete params.search;

      const res = await transactionsApi.getAll(params);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoriesApi.getAll().then(r => setCategories(r.data)).catch(() => {}); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionsApi.delete(id);
    load();
  };

  const handleExport = async () => {
    try {
      const res = await transactionsApi.exportCsv();
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const setPage = (p: number) => setFilters(f => ({ ...f, page: p }));
  const setFilter = (key: keyof TransactionFilters, val: string) =>
    setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Upload size={16} /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 md:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search description..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilter('categoryId', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date" value={filters.startDate}
            onChange={(e) => setFilter('startDate', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date" value={filters.endDate}
            onChange={(e) => setFilter('endDate', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={24} className="animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No transactions found</p>
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
            >
              Add your first transaction
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Description', 'Category', 'Type', 'Amount', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {format(new Date(t.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-900">{t.description || '—'}</p>
                    {t.isRecurring && (
                      <span className="text-xs text-indigo-500 font-medium">↻ {t.recurringInterval}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {t.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: t.category.color + '20', color: t.category.color }}>
                        {t.category.icon} {t.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Uncategorized</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
                      t.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditTarget(t); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {filters.page} of {totalPages} · {total} records
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, (filters.page || 1) - 1))}
                disabled={(filters.page || 1) <= 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, (filters.page || 1) + 1))}
                disabled={(filters.page || 1) >= totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        onSuccess={() => load()}
        categories={categories}
        transaction={editTarget}
      />
      <CSVImport
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => load()}
      />
    </div>
  );
};
