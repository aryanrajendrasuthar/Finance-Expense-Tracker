import { useEffect, useState, useCallback } from 'react';
import { Plus, PiggyBank } from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { budgetsApi, categoriesApi } from '../services/api';
import type { Budget, Category } from '../types';
import { BudgetProgress } from '../components/Budgets/BudgetProgress';
import { Modal } from '../components/ui/Modal';

const currentMonthStr = format(new Date(), 'yyyy-MM');

export const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthStr);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);

  const [form, setForm] = useState({ categoryId: '', limit: '', month: currentMonthStr });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetsApi.getAll(month);
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoriesApi.getAll()
      .then(r => setCategories(r.data.filter((c: Category) => c.type === 'expense' || c.type === 'both')))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ categoryId: '', limit: '', month });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (b: Budget) => {
    setEditTarget(b);
    setForm({ categoryId: b.categoryId, limit: String(b.limit), month: b.month });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await budgetsApi.delete(id);
    load();
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.categoryId) { setFormError('Please select a category'); return; }
    if (!form.limit || Number(form.limit) <= 0) { setFormError('Enter a valid budget limit'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await budgetsApi.update(editTarget.id, { limit: Number(form.limit) });
      } else {
        await budgetsApi.create({ categoryId: form.categoryId, limit: Number(form.limit), month: form.month });
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setFormError(axiosErr.response?.data?.error || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => setMonth(format(subMonths(parseISO(month + '-01'), 1), 'yyyy-MM'));
  const nextMonth = () => setMonth(format(addMonths(parseISO(month + '-01'), 1), 'yyyy-MM'));

  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const exceeded = budgets.filter(b => b.exceeded).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 text-sm mt-1">Set spending limits per category</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">‹</button>
        <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">
          {format(parseISO(month + '-01'), 'MMMM yyyy')}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">›</button>
      </div>

      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Budgeted</p>
            <p className="text-lg font-bold text-gray-900">${totalBudgeted.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Spent</p>
            <p className="text-lg font-bold text-rose-600">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Exceeded</p>
            <p className={`text-lg font-bold ${exceeded > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {exceeded} {exceeded === 1 ? 'category' : 'categories'}
            </p>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <PiggyBank size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-3">No budgets set for this month</p>
          <button onClick={openAdd} className="text-indigo-600 text-sm font-medium hover:underline">
            Create your first budget
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => (
            <BudgetProgress key={b.id} budget={b} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Budget' : 'New Budget'} maxWidth="max-w-md">
        <div className="space-y-4">
          {!editTarget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Limit ($)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.limit}
              onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          {!editTarget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
              <input
                type="month"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {formError && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
