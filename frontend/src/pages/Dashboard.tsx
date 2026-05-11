import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { KPICard } from '../components/Dashboard/KPICard';
import { SpendingPieChart } from '../components/Dashboard/SpendingPieChart';
import { MonthlyLineChart } from '../components/Dashboard/MonthlyLineChart';
import { statsApi } from '../services/api';
import type { OverviewStats, MonthlyStats, CategoryStats } from '../types';

export const Dashboard = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStats[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, mo, cat] = await Promise.all([
          statsApi.overview(),
          statsApi.monthly(currentYear),
          statsApi.categories(currentMonth, 'expense'),
        ]);
        setOverview(ov.data);
        setMonthly(mo.data);
        setCategories(cat.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentMonth, currentYear]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl h-80 animate-pulse" />
          <div className="bg-white rounded-2xl h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Income"
          value={fmt(overview?.totalIncome ?? 0)}
          icon={<TrendingUp size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          change="All time"
          changeType="neutral"
        />
        <KPICard
          title="Total Expenses"
          value={fmt(overview?.totalExpenses ?? 0)}
          icon={<TrendingDown size={20} className="text-rose-500" />}
          iconBg="bg-rose-50"
          change="All time"
          changeType="neutral"
        />
        <KPICard
          title="Net Balance"
          value={fmt(overview?.netBalance ?? 0)}
          icon={<DollarSign size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          change={(overview?.netBalance ?? 0) >= 0 ? 'Positive balance' : 'Negative balance'}
          changeType={(overview?.netBalance ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="Savings Rate"
          value={`${overview?.savingsRate ?? 0}%`}
          icon={<PiggyBank size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
          change={
            (overview?.savingsRate ?? 0) >= 20
              ? 'Great savings!'
              : (overview?.savingsRate ?? 0) >= 10
              ? 'Moderate savings'
              : 'Low savings'
          }
          changeType={
            (overview?.savingsRate ?? 0) >= 20
              ? 'positive'
              : (overview?.savingsRate ?? 0) >= 10
              ? 'neutral'
              : 'negative'
          }
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <MonthlyLineChart data={monthly} />
        <SpendingPieChart data={categories} />
      </div>
    </div>
  );
};
