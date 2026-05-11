import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { MonthlyStats } from '../../types';

interface Props {
  data: MonthlyStats[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-sm">
            {p.name}: ${p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MonthlyLineChart = ({ data }: Props) => {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.month + '-01'), 'MMM'),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm capitalize text-gray-700">{value}</span>}
          />
          <Line
            type="monotone" dataKey="income" name="Income"
            stroke="#10B981" strokeWidth={2.5} dot={false}
            activeDot={{ r: 5, fill: '#10B981' }}
          />
          <Line
            type="monotone" dataKey="expenses" name="Expenses"
            stroke="#F43F5E" strokeWidth={2.5} dot={false}
            activeDot={{ r: 5, fill: '#F43F5E' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
