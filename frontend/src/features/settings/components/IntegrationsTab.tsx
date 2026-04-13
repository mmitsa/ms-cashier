import { useState, useEffect } from 'react';
import { Plug, Plus, Trash2, Power, Wifi, AlertCircle, ExternalLink, ShoppingCart, CreditCard, Truck, Calculator } from 'lucide-react';
import { integrationsApi } from '@/lib/api/endpoints';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const CATEGORY_ICONS: Record<string, typeof ShoppingCart> = { Ecommerce: ShoppingCart, BNPL: CreditCard, Delivery: Truck, Accounting: Calculator };
const CATEGORY_LABELS: Record<string, string> = { Ecommerce: 'تجارة إلكترونية', BNPL: 'اشتري الآن ادفع لاحقاً', Delivery: 'شحن وتوصيل', Accounting: 'محاسبة' };

export function IntegrationsTab() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const load = async () => {
    const [catRes, intRes] = await Promise.all([integrationsApi.getCatalog(), integrationsApi.getAll()]);
    if (catRes.success) setCatalog(catRes.data ?? []);
    if (intRes.success) setIntegrations(intRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: number) => {
    const res = await integrationsApi.toggle(id);
    if (res.success) { toast.success(res.message || 'تم'); load(); }
  };

  const testConn = async (id: number) => {
    toast.loading('جارٍ الاختبار...', { id: 'test' });
    const res = await integrationsApi.test(id);
    toast.dismiss('test');
    if (res.success) toast.success('تم الاتصال بنجاح'); else toast.error(res.errors?.join(', ') || 'فشل');
    load();
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذا التكامل؟')) return;
    const res = await integrationsApi.delete(id);
    if (res.success) { toast.success('تم الحذف'); load(); }
  };

  const connectedProviders = new Set(integrations.map(i => i.provider));
  const availableProviders = catalog.filter(p => !connectedProviders.has(p.provider));

  const categories = [...new Set(catalog.map(c => c.category))];

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Connected */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Plug size={20} className="text-brand-600" /> التكاملات المفعّلة</h3>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700">
            <Plus size={14} /> إضافة تكامل
          </button>
        </div>

        {integrations.length === 0 ? (
          <div className="py-8 text-center text-gray-400"><Plug size={40} className="mx-auto mb-2 opacity-30" /><p>لا توجد تكاملات مُعدّة</p></div>
        ) : (
          <div className="space-y-3">
            {integrations.map(i => {
              const Icon = CATEGORY_ICONS[i.category] ?? Plug;
              return (
                <div key={i.id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${i.isEnabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center"><Icon size={24} className="text-brand-600 dark:text-brand-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{i.displayName || i.provider}</span>
                      <Badge variant={i.isEnabled ? 'success' : 'default'}>{i.isEnabled ? 'مفعّل' : 'معطّل'}</Badge>
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[i.category]}</span>
                    </div>
                    {i.lastSyncStatus && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">آخر اتصال: {i.lastSyncStatus}</p>}
                    <div className="flex gap-2 mt-1 text-[10px]">
                      {i.syncProducts && <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">منتجات</span>}
                      {i.syncOrders && <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded">طلبات</span>}
                      {i.syncInventory && <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded">مخزون</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => testConn(i.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="اختبار"><Wifi size={14} /></button>
                    <button onClick={() => toggle(i.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="تبديل"><Power size={14} /></button>
                    <button onClick={() => del(i.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400" title="حذف"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal open onClose={() => { setShowAdd(false); setSelectedProvider(null); }} title="إضافة تكامل جديد" size="lg">
          {!selectedProvider ? (
            <div className="space-y-4 p-1">
              {categories.map(cat => (
                <div key={cat}>
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{CATEGORY_LABELS[cat] ?? cat}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableProviders.filter(p => p.category === cat).map(p => (
                      <button key={p.provider} onClick={() => setSelectedProvider(p)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition text-right">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs">{p.provider[0]}</div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{p.displayName}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {availableProviders.length === 0 && <p className="text-center text-gray-400 py-6">كل المزودين مُضافين بالفعل</p>}
            </div>
          ) : (
            <AddIntegrationForm provider={selectedProvider} onDone={() => { setShowAdd(false); setSelectedProvider(null); load(); }} />
          )}
        </Modal>
      )}
    </div>
  );
}

function AddIntegrationForm({ provider, onDone }: { provider: any; onDone: () => void }) {
  const [form, setForm] = useState<any>({
    category: provider.category, provider: provider.provider, displayName: provider.displayName,
    isEnabled: true, apiKey: '', apiSecret: '', accessToken: '', merchantId: '', storeUrl: '',
    syncProducts: provider.category === 'Ecommerce', syncOrders: provider.category === 'Ecommerce', syncInventory: provider.category === 'Ecommerce',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await integrationsApi.save(null, form);
      if (res.success) { toast.success('تم إضافة التكامل'); onDone(); }
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="p-3 bg-brand-50 dark:bg-brand-950 rounded-xl">
        <p className="font-bold text-brand-700 dark:text-brand-300">{provider.displayName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
      </div>

      {provider.requiredFields?.includes('ApiKey') && (
        <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
        <input value={form.apiKey} onChange={e => setForm((f: any) => ({ ...f, apiKey: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" /></div>
      )}
      {provider.requiredFields?.includes('ApiSecret') && (
        <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Secret</label>
        <input type="password" value={form.apiSecret} onChange={e => setForm((f: any) => ({ ...f, apiSecret: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" /></div>
      )}
      {provider.requiredFields?.includes('AccessToken') && (
        <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Access Token</label>
        <input value={form.accessToken} onChange={e => setForm((f: any) => ({ ...f, accessToken: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" /></div>
      )}
      {provider.requiredFields?.includes('MerchantId') && (
        <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Merchant ID</label>
        <input value={form.merchantId} onChange={e => setForm((f: any) => ({ ...f, merchantId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" /></div>
      )}
      {provider.requiredFields?.includes('StoreUrl') && (
        <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store URL</label>
        <input value={form.storeUrl} onChange={e => setForm((f: any) => ({ ...f, storeUrl: e.target.value }))} placeholder="https://mystore.salla.sa" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" /></div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50">
        {saving ? 'جارٍ الحفظ...' : 'إضافة وتفعيل'}
      </button>
    </div>
  );
}
