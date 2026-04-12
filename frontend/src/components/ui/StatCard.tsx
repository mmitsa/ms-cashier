import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  color: string;
  sub?: string;
}

export function StatCard({ icon: Icon, label, value, change, color, sub }: StatCardProps) {
  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}
        >
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 ${
              change > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
