import { useState, useEffect } from 'react';
import { Coins, Receipt, Plus, Trash2, Save, Star, AlertCircle } from 'lucide-react';
import { storeSettingsApi } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export function CurrencyTaxTab() {
  return (
    <div className="space-y-6">
      <CurrenciesSection />
      <TaxSection />
    </div>
  );
}

function CurrenciesSection() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ currencyCode: '', currencyName: '', symbol: '', exchangeRate: '1', isDefault: false });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => storeSettingsApi.getCurrencies().then(res => { if (res.success) setCurrencies(res.data ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.currencyCode || !form.currencyName) return toast.error('اسم ورمز العملة مطلوبان');
    const res = await storeSettingsApi.saveCurrency(editId, { ...form, exchangeRate: Number(form.exchangeRate) });
    if (res.success) { toast.success('تم الحفظ'); setForm({ currencyCode: '', currencyName: '', symbol: '', exchangeRate: '1', isDefault: false }); setEditId(null); load(); }
    else toast.error(res.errors?.join(', ') || 'خطأ');
  };

  const del = async (id: number) => {
    if (!confirm('حذف العملة؟')) return;
    const res = await storeSettingsApi.deleteCurrency(id);
    if (res.success) { toast.success('تم الحذف'); load(); } else toast.error(res.errors?.join(', ') || 'خطأ');
  };

  const edit = (c: any) => { setEditId(c.id); setForm({ currencyCode: c.currencyCode, currencyName: c.currencyName, symbol: c.symbol ?? '', exchangeRate: String(c.exchangeRate), isDefault: c.isDefault }); };

  return (
    <div className="card p-5">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Coins size={20} className="text-brand-600" /> العملات</h3>

      {/* Current Currencies */}
      {currencies.length > 0 && (
        <div className="space-y-2 mb-4">
          {currencies.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm">{c.symbol || c.currencyCode}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{c.currencyName}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.currencyCode}</span>
                  {c.isDefault && <Badge variant="success"><Star size={10} className="inline" /> أساسية</Badge>}
                </div>
                {!c.isDefault && <p className="text-xs text-gray-500 dark:text-gray-400">سعر الصرف: {c.exchangeRate}</p>}
              </div>
              <button onClick={() => edit(c)} className="text-xs text-brand-600 hover:underline">تعديل</button>
              {!c.isDefault && <button onClick={() => del(c.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">رمز العملة</label>
          <input value={form.currencyCode} onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value.toUpperCase() }))} placeholder="EGP" maxLength={5}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم العملة</label>
          <input value={form.currencyName} onChange={e => setForm(f => ({ ...f, currencyName: e.target.value }))} placeholder="جنيه مصري"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">الرمز</label>
          <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="ج.م"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">سعر الصرف</label>
          <input type="number" step="any" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
        </div>
        <button onClick={save} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition flex items-center gap-1">
          <Plus size={14} /> {editId ? 'تحديث' : 'إضافة'}
        </button>
      </div>
    </div>
  );
}

function TaxSection() {
  const [tax, setTax] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { storeSettingsApi.getTax().then(res => { if (res.success) setTax(res.data); setLoading(false); }); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await storeSettingsApi.saveTax(tax);
      if (res.success) toast.success('تم حفظ إعدادات الضريبة');
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  if (!tax) return null;

  const set = (key: string, val: any) => setTax((t: any) => ({ ...t, [key]: val }));

  return (
    <div className="card p-5">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Receipt size={20} className="text-brand-600" /> إعدادات الضريبة</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={tax.isEnabled} onChange={e => set('isEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تفعيل الربط الضريبي</span>
          </label>
          <select value={tax.provider} onChange={e => set('provider', e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none">
            <option value="ETA">مصلحة الضرائب المصرية (ETA)</option>
            <option value="ZATCA">هيئة الزكاة والضريبة السعودية</option>
            <option value="Manual">يدوي</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">نسبة ضريبة القيمة المضافة %</label>
            <input type="number" value={tax.defaultVatRate} onChange={e => set('defaultVatRate', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ضريبة الجدول % (اختياري)</label>
            <input type="number" value={tax.tableTaxRate ?? ''} onChange={e => set('tableTaxRate', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">رقم التسجيل الضريبي</label>
            <input value={tax.taxRegistrationNumber ?? ''} onChange={e => set('taxRegistrationNumber', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={tax.taxInclusive} onChange={e => set('taxInclusive', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">الضريبة شاملة في السعر</span>
        </label>

        {tax.isEnabled && tax.provider === 'ETA' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2"><AlertCircle size={16} /> بيانات الربط مع مصلحة الضرائب</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client ID</label>
                <input value={tax.etaClientId ?? ''} onChange={e => set('etaClientId', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client Secret</label>
                <input type="password" value={tax.etaClientSecret ?? ''} onChange={e => set('etaClientSecret', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API URL</label>
                <input value={tax.etaApiUrl ?? ''} onChange={e => set('etaApiUrl', e.target.value)} placeholder="https://api.invoicing.eta.gov.eg" className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">كود النشاط</label>
                <input value={tax.etaActivityCode ?? ''} onChange={e => set('etaActivityCode', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" dir="ltr" />
              </div>
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ إعدادات الضريبة'}
        </button>
      </div>
    </div>
  );
}
