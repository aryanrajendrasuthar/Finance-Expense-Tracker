import type { Budget } from '../../types';

interface Props {
  budget: Budget;
  onEdit: (b: Budget) => void;
  onDelete: (id: string) => void;
}

export const BudgetProgress = ({ budget, onEdit, onDelete }: Props) => {
  const pct = Math.min(budget.percentage, 100);
  const barColor = budget.exceeded
    ? 'bg-rose-500'
    : budget.alert
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{budget.category?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{budget.category?.name}</p>
            <p className="text-xs text-gray-400">Budget: ${Number(budget.limit).toFixed(2)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${budget.exceeded ? 'text-rose-600' : budget.alert ? 'text-amber-600' : 'text-gray-900'}`}>
            ${Number(budget.spent).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">{pct}% used</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Alert badges */}
      {(budget.alert || budget.exceeded) && (
        <div className={`text-xs rounded-lg px-2.5 py-1.5 mb-3 font-medium ${
          budget.exceeded
            ? 'bg-rose-50 text-rose-700 border border-rose-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {budget.exceeded
            ? `⚠️ Budget exceeded by $${(budget.spent - budget.limit).toFixed(2)}`
            : `⚡ ${budget.percentage}% of budget used`}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(budget)}
          className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="flex-1 text-xs py-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
