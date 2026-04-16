import { useState, useMemo } from 'react';
import {
  UserPlus, Users, Wallet, CreditCard, Search, X, Loader2,
  AlertCircle, MapPin, ChevronLeft, ChevronRight, Banknote,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  useContacts, useCreateContact, useRecordPayment, useFinanceAccounts,
} from '@/hooks/useApi';
import { formatCurrency, getPriceTypeLabel, cn } from '@/lib/utils/cn';
import type { ContactDto, CreateContactRequest } from '@/types/api.types';
import { ContactType, PriceType } from '@/types/api.types';
import { countries, getRegions, getCities } from '@/lib/data/saudi-locations';

type TabType = 'customers' | 'suppliers';

export function CustomersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentContact, setPaymentContact] = useState<ContactDto | null>(null);

  const contactType = activeTab === 'customers' ? ContactType.Customer : ContactType.Supplier;

  const { data: contactsData, isLoading, isError, refetch } = useContacts({
    search: searchText || undefined,
    type: contactType,
    page,
    pageSize,
  });

  const contacts = contactsData?.items ?? [];
  const totalCount = contactsData?.totalCount ?? 0;
  const totalPages = contactsData?.totalPages ?? 1;

  // Compute stats from loaded data
  const stats = useMemo(() => {
    const totalOwed = contacts.filter((c) => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
    const totalOwesUs = Math.abs(contacts.filter((c) => c.balance < 0).reduce((sum, c) => sum + c.balance, 0));
    return { totalOwed, totalOwesUs };
  }, [contacts]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearchText('');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeTab === 'customers' ? 'العملاء' : 'الموردين'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة بيانات العملاء والموردين</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shrink-0">
          <UserPlus size={18} />
          {activeTab === 'customers' ? 'إضافة عميل' : 'إضافة مورد'}
        </button>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'customers'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Users size={16} />
          العملاء
        </button>
        <button
          onClick={() => handleTabChange('suppliers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'suppliers'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <CreditCard size={16} />
          الموردين
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label={`إجمالي ${activeTab === 'customers' ? 'العملاء' : 'الموردين'}`}
          value={totalCount}
          color="bg-brand-600"
        />
        <StatCard
          icon={Wallet}
          label="لهم عندنا"
          value={formatCurrency(stats.totalOwed)}
          color="bg-emerald-600"
        />
        <StatCard
          icon={CreditCard}
          label="لنا عندهم"
          value={formatCurrency(stats.totalOwesUs)}
          color="bg-red-500"
        />
      </div>

      {/* Search */}
      <div className="card p-5 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Table / Loading / Error */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الاسم</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الهاتف</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الرصيد</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">حد الائتمان</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">نوع السعر</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => {
                      const balanceColor = contact.balance > 0 ? 'text-emerald-600' : contact.balance < 0 ? 'text-red-600' : 'text-gray-500';
                      return (
                        <tr key={contact.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                                {contact.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{contact.phone ?? '—'}</td>
                          <td className="py-3 px-4">
                            <span className={cn('text-sm font-bold', balanceColor)}>
                              {formatCurrency(contact.balance)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {contact.creditLimit ? formatCurrency(contact.creditLimit) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="info">{getPriceTypeLabel(contact.priceType)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={contact.isActive ? 'success' : 'danger'}>
                              {contact.isActive ? 'نشط' : 'متوقف'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setPaymentContact(contact)}
                              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
                            >
                              <Banknote size={16} />
                              تسجيل دفعة
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} من {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          contactType={contactType}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Record Payment Modal */}
      {paymentContact && (
        <RecordPaymentModal
          contact={paymentContact}
          onClose={() => setPaymentContact(null)}
        />
      )}
    </div>
  );
}

// ==================== Add Contact Modal ====================

function AddContactModal({ contactType, onClose }: { contactType: ContactType; onClose: () => void }) {
  const createContact = useCreateContact();
  const isCustomer = contactType === ContactType.Customer;

  const [form, setForm] = useState<CreateContactRequest>({
    contactType,
    name: '',
    phone: '',
    email: '',
    address: '',
    priceType: PriceType.Retail,
    creditLimit: 0,
    countryCode: 'SA',
    province: '',
    city: '',
    district: '',
    street: '',
  });

  const regions = useMemo(() => getRegions(form.countryCode ?? 'SA'), [form.countryCode]);
  const citiesList = useMemo(() => getCities(form.countryCode ?? 'SA', form.province ?? ''), [form.countryCode, form.province]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    // Compose legacy address from structured fields
    const composed = [form.street, form.district, form.city, form.province]
      .map(s => s?.trim())
      .filter(Boolean)
      .join('، ');
    createContact.mutate({ ...form, address: composed || form.address }, { onSuccess: () => onClose() });
  };

  const updateField = <K extends keyof CreateContactRequest>(key: K, value: CreateContactRequest[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'countryCode') { next.province = ''; next.city = ''; }
      else if (key === 'province') { next.city = ''; }
      return next;
    });
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isCustomer ? 'إضافة عميل جديد' : 'إضافة مورد جديد'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الاسم <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} placeholder={isCustomer ? 'اسم العميل' : 'اسم المورد'} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label>
              <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} placeholder="05xxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد</label>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} placeholder="email@example.com" />
            </div>
          </div>

          {/* Address dropdowns */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <MapPin size={14} className="text-brand-500" /> العنوان
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدولة</label>
              <select value={form.countryCode ?? 'SA'} onChange={(e) => updateField('countryCode', e.target.value)} className={inputClass}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.nameAr}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنطقة</label>
                <select value={form.province ?? ''} onChange={(e) => updateField('province', e.target.value)} className={inputClass}>
                  <option value="">-- اختر --</option>
                  {regions.map((r) => <option key={r.nameAr} value={r.nameAr}>{r.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
                <select value={form.city ?? ''} onChange={(e) => updateField('city', e.target.value)} className={inputClass} disabled={!form.province}>
                  <option value="">-- اختر --</option>
                  {citiesList.map((c) => <option key={c.nameAr} value={c.nameAr}>{c.nameAr}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحي</label>
                <input type="text" value={form.district ?? ''} onChange={(e) => updateField('district', e.target.value)} className={inputClass} placeholder="اسم الحي" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الشارع</label>
                <input type="text" value={form.street ?? ''} onChange={(e) => updateField('street', e.target.value)} className={inputClass} placeholder="اسم الشارع" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
            <textarea value={form.notes ?? ''} onChange={(e) => updateField('notes', e.target.value)} className={cn(inputClass, 'resize-none')} placeholder="ملاحظات إضافية..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع السعر</label>
              <select value={form.priceType} onChange={(e) => updateField('priceType', Number(e.target.value) as PriceType)} className={inputClass}>
                <option value={PriceType.Retail}>قطاعي</option>
                <option value={PriceType.HalfWholesale}>نصف جملة</option>
                <option value={PriceType.Wholesale}>جملة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حد الائتمان</label>
              <input type="number" min={0} value={form.creditLimit ?? 0} onChange={(e) => updateField('creditLimit', Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="submit" disabled={createContact.isPending || !form.name.trim()} className="btn-primary flex-1 disabled:opacity-50">
              {createContact.isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              حفظ
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Record Payment Modal ====================

function RecordPaymentModal({ contact, onClose }: { contact: ContactDto; onClose: () => void }) {
  const recordPayment = useRecordPayment();
  const { data: accounts, isLoading: accountsLoading } = useFinanceAccounts();

  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || accountId <= 0) return;
    recordPayment.mutate(
      { contactId: contact.id, amount, accountId },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">تسجيل دفعة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{contact.name}</p>
            <p className={cn('font-bold mt-1', contact.balance > 0 ? 'text-emerald-600' : contact.balance < 0 ? 'text-red-600' : 'text-gray-500')}>
              الرصيد: {formatCurrency(contact.balance)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الحساب المالي <span className="text-red-500">*</span>
            </label>
            {accountsLoading ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                required
              >
                <option value={0}>اختر الحساب</option>
                {(accounts ?? []).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={recordPayment.isPending || amount <= 0 || accountId <= 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {recordPayment.isPending ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
              تسجيل الدفعة
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
