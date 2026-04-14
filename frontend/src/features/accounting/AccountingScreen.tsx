import { useState } from 'react';
import { BookOpen, FileBarChart2, Network, Scale, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TrialBalanceReport } from './components/TrialBalanceReport';
import { IncomeStatementReport } from './components/IncomeStatementReport';
import { BalanceSheetReport } from './components/BalanceSheetReport';
import { ContactStatementReport } from './components/ContactStatementReport';
import { ChartOfAccountsBrowser } from './components/ChartOfAccountsBrowser';

type TabId = 'trial-balance' | 'income-statement' | 'balance-sheet' | 'contact-statement' | 'chart-of-accounts';

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'trial-balance', label: 'ميزان المراجعة', icon: BookOpen },
  { id: 'income-statement', label: 'قائمة الدخل', icon: FileBarChart2 },
  { id: 'balance-sheet', label: 'الميزانية العمومية', icon: Scale },
  { id: 'contact-statement', label: 'كشف حساب', icon: User },
  { id: 'chart-of-accounts', label: 'شجرة الحسابات', icon: Network },
];

export function AccountingScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('trial-balance');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">المحاسبة</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">التقارير المحاسبية الرئيسية</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all -mb-px border-b-2',
                isActive
                  ? 'border-brand-500 text-brand-700 dark:text-brand-400 bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'trial-balance' && <TrialBalanceReport />}
        {activeTab === 'income-statement' && <IncomeStatementReport />}
        {activeTab === 'balance-sheet' && <BalanceSheetReport />}
        {activeTab === 'contact-statement' && <ContactStatementReport />}
        {activeTab === 'chart-of-accounts' && <ChartOfAccountsBrowser />}
      </div>
    </div>
  );
}
