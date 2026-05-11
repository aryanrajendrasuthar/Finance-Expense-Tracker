import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryStats } from '../../types';

interface Props {
  data: CategoryStats[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: CategoryStats }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="font-medium text-gray-900">{d.icon} {d.name}</p>
        <p className="text-gray-600 text-sm">${d.total.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export const SpendingPieChart = ({ data }: Props) => {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No expense data this month
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="total"
            nameKey="name"
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
