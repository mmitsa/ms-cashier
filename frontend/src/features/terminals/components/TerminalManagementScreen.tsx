import { useState } from 'react';
import {
  CreditCard, Plus, Edit2, Trash2, Wifi, WifiOff, RefreshCw,
  Star, Shield, Smartphone, DollarSign, Clock, CheckCircle2,
  XCircle, ArrowUpDown, Settings2, Activity, BarChart3, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import {
  usePaymentTerminals, useSavePaymentTerminal, useDeletePaymentTerminal,
  useSetDefaultTerminal, usePingTerminal, useReconcileTerminal,
  useTerminalTransactions,
} from '@/hooks/useApi';

const providers = [
  { id: 'Geidea', label: 'Geidea (قيديا)', color: '#0052FF' },
  { id: 'Nearpay', label: 'Nearpay (نيرباي)', color: '#00C853' },
  { id: 'Moyasar', label: 'Moyasar (ميسر)', color: '#6366f1' },
  { id: 'Ingenico', label: 'Ingenico', color: '#E65100' },
  { id: 'Verifone', label: 'Verifone', color: '#1565C0' },
  { id: 'StcPay', label: 'STC Pay', color: '#4B0082' },
  { id: 'HyperPay', label: 'HyperPay', color: '#FF6D00' },
  { id: 'Foodics', label: 'Foodics', color: '#00897B' },
  { id: 'Manual', label: 'يدوي (تأكيد كاشير)', color: '#78909C' },
];

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Maintenance: 'bg-amber-100 text-amber-700',
  Disconnected: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  Active: 'متصل', Inactive: 'غير فعال', Maintenance: 'صيانة', Disconnected: 'غير متصل',
};

export default function TerminalManagementScreen() {
  const [activeTab, setActiveTab] = useState<'terminals' | 'transactions'>('terminals');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: terminalsRes, isLoading } = usePaymentTerminals();
  const { data: txnsRes } = useTerminalTransactions({ limit: 30 });
  const saveMut = useSavePaymentTerminal();
  const deleteMut = useDeletePaymentTerminal();
  const setDefaultMut = useSetDefaultTerminal();
  const pingMut = usePingTerminal();
  const reconcileMut = useReconcileTerminal();

  const terminals = terminalsRes?.data ?? [];
  const transactions = txnsRes?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl"><CreditCard size={24} className="text-blue-600 dark:text-blue-400" /></div>
            ماكينات الدفع
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة أجهزة نقاط البيع ومدى والبطاقات</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
          <Plus size={18} /> إضافة جهاز
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border dark:border-gray-700 gap-1">
        {[
          { id: 'terminals' as const, label: 'الأجهزة', Icon: CreditCard },
          { id: 'transactions' as const, label: 'العمليات', Icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>
            <tab.Icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'terminals' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CreditCard} label="إجمالي الأجهزة" value={terminals.length} color="blue" />
            <StatCard icon={Wifi} label="متصل" value={terminals.filter((t: any) => t.status === 'Active').length} color="green" />
            <StatCard icon={DollarSign} label="مبيعات اليوم" value={`${terminals.reduce((s: number, t: any) => s + (t.todayTxnTotal || 0), 0).toFixed(0)} ر.س`} color="indigo" />
            <StatCard icon={BarChart3} label="عمليات اليوم" value={terminals.reduce((s: number, t: any) => s + (t.todayTxnCount || 0), 0)} color="amber" />
          </div>

          {/* Terminals Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : terminals.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700">
              <CreditCard size={56} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد أجهزة دفع</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">أضف جهاز مدى أو نقطة بيع لبدء استقبال الدفع بالبطاقات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {terminals.map((t: any) => {
                const prov = providers.find(p => p.id === t.provider);
                return (
                  <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700 p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: prov?.color || '#6366f1' }}>
                          {t.provider === 'Manual' ? <Settings2 size={20} /> : <CreditCard size={20} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {t.name}
                            {t.isDefault && <Star size={14} className="text-amber-500 fill-amber-500" />}
                          </h3>
                          <span className="text-xs text-gray-500">{prov?.label || t.provider}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[t.status] || 'bg-gray-100'}`}>
                        {t.status === 'Active' ? <Wifi size={10} className="inline ml-1" /> : <WifiOff size={10} className="inline ml-1" />}
                        {statusLabels[t.status] || t.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {t.terminalId && <div>TID: <span className="font-mono text-gray-700 dark:text-gray-300">{t.terminalId}</span></div>}
                      {t.merchantId && <div>MID: <span className="font-mono text-gray-700 dark:text-gray-300">{t.merchantId}</span></div>}
                      {t.serialNumber && <div>S/N: <span className="font-mono text-gray-700 dark:text-gray-300">{t.serialNumber}</span></div>}
                      {t.ipAddress && <div>IP: <span className="font-mono text-gray-700 dark:text-gray-300">{t.ipAddress}:{t.port}</span></div>}
                    </div>

                    <div className="flex items-center gap-2 text-xs mb-4">
                      {t.supportsContactless && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full"><Smartphone size={10} className="inline ml-0.5" />NFC</span>}
                      {t.supportsRefund && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full"><RefreshCw size={10} className="inline ml-0.5" />استرداد</span>}
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full">{t.currency}</span>
                    </div>

                    {(t.todayTxnCount > 0) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-3 flex justify-between text-xs">
                        <span>عمليات اليوم: <b>{t.todayTxnCount}</b></span>
                        <span>المبلغ: <b className="text-blue-600">{t.todayTxnTotal?.toFixed(2)} ر.س</b></span>
                      </div>
                    )}

                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => pingMut.mutate(t.id)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition">
                        <Wifi size={12} className="inline ml-1" /> فحص
                      </button>
                      <button onClick={() => reconcileMut.mutate(t.id)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                        <ArrowUpDown size={12} className="inline ml-1" /> تسوية
                      </button>
                      {!t.isDefault && (
                        <button onClick={() => setDefaultMut.mutate(t.id)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
                          <Star size={12} className="inline ml-1" /> افتراضي
                        </button>
                      )}
                      <button onClick={() => { setEditing(t); setShowForm(true); }}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                        <Edit2 size={12} className="inline ml-1" /> تعديل
                      </button>
                      <button onClick={() => { if (confirm('حذف هذا الجهاز؟')) deleteMut.mutate(t.id); }}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">المرجع</th>
                  <th className="text-right px-4 py-3 font-medium">الجهاز</th>
                  <th className="text-right px-4 py-3 font-medium">النوع</th>
                  <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                  <th className="text-right px-4 py-3 font-medium">البطاقة</th>
                  <th className="text-right px-4 py-3 font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد عمليات</td></tr>
                ) : transactions.map((txn: any) => (
                  <tr key={txn.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-mono text-xs">{txn.referenceNumber}</td>
                    <td className="px-4 py-3 text-xs">{txn.terminalName}</td>
                    <td className="px-4 py-3 text-xs">{txn.txnType === 'Purchase' ? 'شراء' : txn.txnType === 'Refund' ? 'استرداد' : txn.txnType}</td>
                    <td className="px-4 py-3 font-bold text-xs">{txn.amount?.toFixed(2)} {txn.currency}</td>
                    <td className="px-4 py-3 text-xs">
                      {txn.cardScheme && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{txn.cardScheme}</span>}
                      {txn.cardLast4 && <span className="font-mono mr-1">****{txn.cardLast4}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        txn.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        txn.status === 'Declined' ? 'bg-red-100 text-red-700' :
                        txn.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {txn.status === 'Approved' ? 'مقبولة' : txn.status === 'Declined' ? 'مرفوضة' :
                         txn.status === 'Pending' ? 'قيد الانتظار' : txn.status === 'Cancelled' ? 'ملغية' : txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(txn.initiatedAt).toLocaleString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <TerminalFormModal
          terminal={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(data: any) => saveMut.mutate({ id: editing?.id, data }, { onSuccess: () => { setShowForm(false); setEditing(null); } })}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function TerminalFormModal({ terminal, onClose, onSave, saving }: { terminal: any; onClose: () => void; onSave: (d: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    name: terminal?.name || '', provider: terminal?.provider || 'Geidea',
    terminalId: terminal?.terminalId || '', merchantId: terminal?.merchantId || '',
    serialNumber: terminal?.serialNumber || '', apiKey: terminal?.apiKey || '',
    apiSecret: terminal?.apiSecret || '', apiBaseUrl: terminal?.apiBaseUrl || '',
    branchId: terminal?.branchId || null, ipAddress: terminal?.ipAddress || '',
    port: terminal?.port || null, isDefault: terminal?.isDefault ?? false,
    supportsRefund: terminal?.supportsRefund ?? true, supportsPreAuth: terminal?.supportsPreAuth ?? false,
    supportsContactless: terminal?.supportsContactless ?? true, currency: terminal?.currency || 'SAR',
  });

  return (
    <Modal open onClose={onClose} title={terminal ? 'تعديل جهاز الدفع' : 'إضافة جهاز دفع'}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">اسم الجهاز *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="مثال: جهاز الكاشير الرئيسي" className="w-full px-3 py-2.5 border rounded-xl text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">مزود الخدمة *</label>
            <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm">
              {providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Terminal ID (TID)</label>
            <input value={form.terminalId} onChange={e => setForm(f => ({ ...f, terminalId: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" placeholder="من مزود الخدمة" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Merchant ID (MID)</label>
            <input value={form.merchantId} onChange={e => setForm(f => ({ ...f, merchantId: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" placeholder="من مزود الخدمة" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
            <input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
            <input value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              type="password" className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">عنوان IP</label>
            <input value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
              placeholder="192.168.1.100" className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">المنفذ (Port)</label>
            <input type="number" value={form.port || ''} onChange={e => setForm(f => ({ ...f, port: e.target.value ? Number(e.target.value) : null }))}
              placeholder="8080" className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { key: 'isDefault', label: 'افتراضي' },
            { key: 'supportsContactless', label: 'NFC / تلامسي' },
            { key: 'supportsRefund', label: 'يدعم الاسترداد' },
            { key: 'supportsPreAuth', label: 'تفويض مسبق' },
          ].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
              className={`px-3 py-2 rounded-xl border text-xs transition ${(form as any)[key] ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-3 border-t">
          <button onClick={() => { if (!form.name.trim()) { toast.error('اسم الجهاز مطلوب'); return; } onSave(form); }} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : terminal ? 'تحديث' : 'إضافة'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof CreditCard; label: string; value: any; color: string }) {
  const c: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${c[color]}`}><Icon size={20} /></div>
        <div><div className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</div><div className="text-xs text-gray-500 dark:text-gray-400">{label}</div></div>
      </div>
    </div>
  );
}
