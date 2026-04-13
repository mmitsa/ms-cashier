import { useState, useEffect } from 'react';
import { Save, Store, Phone, Globe, FileText, Palette } from 'lucide-react';
import { storeSettingsApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export function StoreSettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeSettingsApi.get().then(res => {
      if (res.success) setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await storeSettingsApi.save(settings);
      if (res.success) toast.success('تم حفظ الإعدادات');
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (!settings) return <p className="text-red-500">فشل تحميل الإعدادات</p>;

  const set = (key: string, val: any) => setSettings((s: any) => ({ ...s, [key]: val }));
  const setInvoice = (key: string, val: any) => setSettings((s: any) => ({ ...s, invoice: { ...s.invoice, [key]: val } }));

  return (
    <div className="space-y-6">
      {/* Store Info */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Store size={20} className="text-brand-600" /> معلومات المتجر</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم المتجر" value={settings.storeName ?? ''} onChange={v => set('storeName', v)} />
          <Field label="الشعار (سطر ترويجي)" value={settings.tagline ?? ''} onChange={v => set('tagline', v)} />
          <Field label="البريد الإلكتروني" value={settings.email ?? ''} onChange={v => set('email', v)} dir="ltr" />
          <Field label="الموقع الإلكتروني" value={settings.website ?? ''} onChange={v => set('website', v)} dir="ltr" />
        </div>
      </div>

      {/* Phones */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Phone size={20} className="text-brand-600" /> أرقام التواصل</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="هاتف 1" value={settings.phone1 ?? ''} onChange={v => set('phone1', v)} dir="ltr" />
          <Field label="هاتف 2" value={settings.phone2 ?? ''} onChange={v => set('phone2', v)} dir="ltr" />
          <Field label="واتساب" value={settings.whatsApp ?? ''} onChange={v => set('whatsApp', v)} dir="ltr" />
        </div>
      </div>

      {/* Address */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Globe size={20} className="text-brand-600" /> العنوان</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="العنوان" value={settings.address ?? ''} onChange={v => set('address', v)} /></div>
          <Field label="المدينة" value={settings.city ?? ''} onChange={v => set('city', v)} />
          <Field label="المنطقة" value={settings.region ?? ''} onChange={v => set('region', v)} />
          <Field label="الرمز البريدي" value={settings.postalCode ?? ''} onChange={v => set('postalCode', v)} dir="ltr" />
          <Field label="الدولة" value={settings.country ?? ''} onChange={v => set('country', v)} />
        </div>
      </div>

      {/* Invoice Design */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><FileText size={20} className="text-brand-600" /> تصميم الفاتورة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="نص الهيدر (أعلى الفاتورة)" value={settings.invoice?.headerText ?? ''} onChange={v => setInvoice('headerText', v)} /></div>
          <div className="md:col-span-2"><Field label="نص الفوتر (أسفل الفاتورة)" value={settings.invoice?.footerText ?? ''} onChange={v => setInvoice('footerText', v)} /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نوع الباركود</label>
            <select value={settings.invoice?.barcodeType ?? 'QR'} onChange={e => setInvoice('barcodeType', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none">
              <option value="QR">QR Code</option>
              <option value="Code128">Code 128</option>
              <option value="EAN13">EAN-13</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2"><Palette size={14} /> اللون الأساسي</label>
            <input type="color" value={settings.invoice?.primaryColor ?? '#6366f1'} onChange={e => setInvoice('primaryColor', e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer" />
          </div>
          <div className="space-y-2">
            <Toggle label="إظهار اللوجو" checked={settings.invoice?.showLogo ?? true} onChange={v => setInvoice('showLogo', v)} />
            <Toggle label="إظهار الباركود" checked={settings.invoice?.showBarcode ?? true} onChange={v => setInvoice('showBarcode', v)} />
            <Toggle label="إظهار الرقم الضريبي" checked={settings.invoice?.showTaxNumber ?? true} onChange={v => setInvoice('showTaxNumber', v)} />
            <Toggle label="إظهار اسم الكاشير" checked={settings.invoice?.showCashierName ?? true} onChange={v => setInvoice('showCashierName', v)} />
            <Toggle label="إظهار اسم المندوب" checked={settings.invoice?.showSalesRepName ?? true} onChange={v => setInvoice('showSalesRepName', v)} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
        <Save size={18} /> {saving ? 'جارٍ الحفظ...' : 'حفظ جميع الإعدادات'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} dir={dir}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}
