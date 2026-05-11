interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

export const KPICard = ({ title, value, icon, iconBg, change, changeType }: KPICardProps) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
    <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${
          changeType === 'positive' ? 'text-emerald-600'
          : changeType === 'negative' ? 'text-rose-600'
          : 'text-gray-500'
        }`}>
          {change}
        </p>
      )}
    </div>
  </div>
);
