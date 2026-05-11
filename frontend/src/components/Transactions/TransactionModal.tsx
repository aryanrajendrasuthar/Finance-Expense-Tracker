import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import type { Transaction, Category } from '../../types';
import { transactionsApi } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (t: Transaction) => void;
  categories: Category[];
  transaction?: Transaction | null;
}

const EMPTY_FORM = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  recurringInterval: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
};

export const TransactionModal = ({ isOpen, onClose, onSuccess, categories, transaction }: Props) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [budgetAlert, setBudgetAlert] = useState<null | { alert: boolean; exceeded: boolean; percentage: number; budgetLimit: number; spent: number }>(null);

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        categoryId: transaction.categoryId || '',
        description: transaction.description || '',
        date: transaction.date,
        isRecurring: transaction.isRecurring,
        recurringInterval: transaction.recurringInterval || 'monthly',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
    setBudgetAlert(null);
  }, [transaction, isOpen]);

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'both'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || undefined,
        description: form.description,
        date: form.date,
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      };
      const res = transaction
        ? await transactionsApi.update(transaction.id, payload)
        : await transactionsApi.create(payload);

      const data = res.data as { transaction: Transaction; budgetAlert: null | { alert: boolean; exceeded: boolean; percentage: number; budgetLimit: number; spent: number } };
      if (data.budgetAlert?.alert) {
        setBudgetAlert(data.budgetAlert);
      }
      onSuccess(data.transaction);
      if (!data.budgetAlert?.alert) onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                form.type === t
                  ? t === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0.01" required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={`${inputClass} pl-7`}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date" required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className={inputClass}
          >
            <option value="">— Uncategorized —</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
            placeholder="Optional note..."
            maxLength={500}
          />
        </div>

        {/* Recurring */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <input
            id="recurring"
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex-1">
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700 cursor-pointer">
              Recurring transaction
            </label>
            {form.isRecurring && (
              <select
                value={form.recurringInterval}
                onChange={(e) => setForm((f) => ({ ...f, recurringInterval: e.target.value as typeof form.recurringInterval }))}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
            {error}
          </div>
        )}

        {budgetAlert && (
          <div className={`text-sm rounded-xl p-3 border ${
            budgetAlert.exceeded
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {budgetAlert.exceeded
              ? `⚠️ Budget exceeded! Spent $${budgetAlert.spent.toFixed(2)} of $${budgetAlert.budgetLimit.toFixed(2)} (${budgetAlert.percentage}%)`
              : `⚡ Budget alert: ${budgetAlert.percentage}% of budget used ($${budgetAlert.spent.toFixed(2)} / $${budgetAlert.budgetLimit.toFixed(2)})`}
            <button type="button" onClick={onClose} className="ml-2 underline">Close</button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
