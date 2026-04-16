import { useState, useMemo } from 'react';
import { ArrowRight, Building2, Loader2, MapPin, Plus, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateContact } from '@/hooks/useApi';
import { cn } from '@/lib/utils/cn';
import { ContactType, PriceType } from '@/types/api.types';
import type { ContactDto, CreateContactRequest } from '@/types/api.types';
import { countries, getRegions, getCities } from '@/lib/data/saudi-locations';

// ── Types ───────────────────────────────────────────────────────────────────

type CustomerMode = 'individual' | 'company';

type FormData = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  // ZATCA structured address
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
  buildingNumber: string;
  plotIdentification: string;
  // Identification
  idScheme: string;
  nationalId: string;
  commercialRegister: string;
  otherId: string;
  taxNumber: string;
  // Credit & payment
  creditLimit: string;
  creditPeriodDays: string;
  preferredPayment: string;
  // Bank
  bankName: string;
  bankAccountNumber: string;
  iban: string;
  // Project
  hasProject: boolean;
  projectName: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  street: '',
  district: '',
  city: '',
  province: '',
  postalCode: '',
  countryCode: 'SA',
  buildingNumber: '',
  plotIdentification: '',
  idScheme: '',
  nationalId: '',
  commercialRegister: '',
  otherId: '',
  taxNumber: '',
  creditLimit: '',
  creditPeriodDays: '',
  preferredPayment: '',
  bankName: '',
  bankAccountNumber: '',
  iban: '',
  hasProject: false,
  projectName: '',
};

const ID_SCHEMES = [
  { value: 'CRN', label: 'سجل تجاري (CRN)' },
  { value: 'MOM', label: 'وزارة التجارة (MOM)' },
  { value: 'MLS', label: 'رخصة بلدية (MLS)' },
  { value: 'SAG', label: 'اتفاقية سعودية (SAG)' },
  { value: 'NAT', label: 'هوية وطنية (NAT)' },
  { value: 'GCC', label: 'هوية خليجية (GCC)' },
  { value: 'IQA', label: 'إقامة (IQA)' },
  { value: 'PAS', label: 'جواز سفر (PAS)' },
  { value: 'OTH', label: 'أخرى (OTH)' },
];

// ── Field component ────────────────────────────────────────────────────────

function FormField({
  label,
  field,
  type = 'text',
  placeholder,
  required,
  dir,
  value,
  error,
  onChange,
  className: extraClass,
}: {
  label: string;
  field: keyof FormData;
  type?: string;
  placeholder?: string;
  required?: boolean;
  dir?: string;
  value: string;
  error?: string;
  onChange: (field: keyof FormData, value: string) => void;
  className?: string;
}) {
  return (
    <div className={extraClass}>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className={cn(
          'input w-full text-sm',
          error && 'border-red-500 dark:border-red-500 focus:ring-red-500',
        )}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1.5 border-t border-gray-100 dark:border-gray-800">
      <Icon size={14} className="text-brand-500" />
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

type AddCustomerFormProps = {
  onCreated: (contact: ContactDto) => void;
  onBack: () => void;
};

// ── Component ───────────────────────────────────────────────────────────────

export function AddCustomerForm({ onCreated, onBack }: AddCustomerFormProps) {
  const [mode, setMode] = useState<CustomerMode>('individual');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const createContact = useCreateContact();

  // Cascading location data
  const regions = useMemo(() => getRegions(form.countryCode), [form.countryCode]);
  const cities = useMemo(() => getCities(form.countryCode, form.province), [form.countryCode, form.province]);

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset dependent fields on cascade
      if (field === 'countryCode') {
        next.province = '';
        next.city = '';
      } else if (field === 'province') {
        next.city = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.name.trim()) errs.name = 'الاسم مطلوب';

    if (mode === 'company') {
      if (!form.taxNumber.trim()) {
        errs.taxNumber = 'الرقم الضريبي مطلوب';
      } else if (!/^\d{15}$/.test(form.taxNumber.trim())) {
        errs.taxNumber = 'الرقم الضريبي يجب أن يكون 15 رقمًا';
      }
      if (!form.commercialRegister.trim()) {
        errs.commercialRegister = 'السجل التجاري مطلوب';
      }
    }

    if (mode === 'individual' && form.nationalId.trim()) {
      if (!/^\d{10}$/.test(form.nationalId.trim())) {
        errs.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'البريد الإلكتروني غير صالح';
    }

    if (form.postalCode && !/^\d{5}$/.test(form.postalCode.trim())) {
      errs.postalCode = 'الرمز البريدي يجب أن يكون 5 أرقام';
    }

    if (form.buildingNumber && !/^\d{4}$/.test(form.buildingNumber.trim())) {
      errs.buildingNumber = 'رقم المبنى يجب أن يكون 4 أرقام';
    }

    if (form.iban.trim()) {
      const iban = form.iban.trim().toUpperCase();
      if (!iban.startsWith('SA') || iban.length !== 24) {
        errs.iban = 'IBAN يجب أن يبدأ بـ SA ويتكون من 24 حرف';
      }
    }

    if (form.hasProject && !form.projectName.trim()) {
      errs.projectName = 'اسم المشروع مطلوب';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!validate()) return;

    const req: CreateContactRequest = {
      contactType: ContactType.Customer,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      priceType: PriceType.Retail,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      isCompany: mode === 'company',
      taxNumber: form.taxNumber.trim() || undefined,
      commercialRegister: mode === 'company' ? form.commercialRegister.trim() || undefined : undefined,
      nationalId: mode === 'individual' ? form.nationalId.trim() || undefined : undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      // Structured address
      street: form.street.trim() || undefined,
      district: form.district.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      countryCode: form.countryCode || 'SA',
      buildingNumber: form.buildingNumber.trim() || undefined,
      plotIdentification: form.plotIdentification.trim() || undefined,
      // Legacy address (composed from structured fields)
      address: [form.street, form.district, form.city, form.province]
        .map((s) => s.trim())
        .filter(Boolean)
        .join('، ') || undefined,
      // Identification
      idScheme: form.idScheme || undefined,
      otherId: form.otherId.trim() || undefined,
      // Bank & credit
      bankName: form.bankName.trim() || undefined,
      bankAccountNumber: form.bankAccountNumber.trim() || undefined,
      iban: form.iban.trim().toUpperCase() || undefined,
      creditPeriodDays: form.creditPeriodDays ? Number(form.creditPeriodDays) : undefined,
      paymentMethod: form.preferredPayment || undefined,
      projectName: form.hasProject ? form.projectName.trim() || undefined : undefined,
    };

    createContact.mutate(req, {
      onSuccess: (res) => {
        if (res.success) {
          onCreated(res.data);
        } else {
          toast.error(res.message || 'حدث خطأ أثناء إضافة العميل');
        }
      },
      onError: () => {
        toast.error('حدث خطأ أثناء إضافة العميل');
      },
    });
  };

  const fieldProps = (field: keyof FormData) => ({
    field,
    value: form[field] as string,
    error: errors[field],
    onChange: set,
  });

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowRight size={14} />
        <span>رجوع للبحث</span>
      </button>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('individual')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            mode === 'individual'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
          )}
        >
          <User size={18} />
          فرد
        </button>
        <button
          type="button"
          onClick={() => setMode('company')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            mode === 'company'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
          )}
        >
          <Building2 size={18} />
          شركة
        </button>
      </div>

      {/* Scrollable form */}
      <div className="max-h-[400px] overflow-y-auto space-y-2.5 pe-1">
        {/* ── Basic info ─────────────────────────────────────── */}
        <FormField label="الاسم (شركة أو شخص)" required placeholder={mode === 'company' ? 'اسم الشركة' : 'اسم العميل'} {...fieldProps('name')} />
        {mode === 'company' && (
          <FormField label="الشخص المسؤول" placeholder="صاحب العمل في الشركة" {...fieldProps('contactPerson')} />
        )}
        <div className="grid grid-cols-2 gap-2">
          <FormField label="البريد الإلكتروني" type="email" placeholder="example@email.com" dir="ltr" {...fieldProps('email')} />
          <FormField label="الهاتف" type="tel" placeholder="05xxxxxxxx" {...fieldProps('phone')} />
        </div>

        {/* ── Address (ZATCA) ─────────────────────────────────── */}
        <SectionHeader icon={MapPin} label="العنوان" />

        {/* Country */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">الدولة</label>
          <select value={form.countryCode} onChange={(e) => set('countryCode', e.target.value)} className="input w-full text-sm">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.nameAr}</option>
            ))}
          </select>
        </div>

        {/* Province → City */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">المنطقة / المحافظة</label>
            <select value={form.province} onChange={(e) => set('province', e.target.value)} className="input w-full text-sm">
              <option value="">-- اختر المنطقة --</option>
              {regions.map((r) => (
                <option key={r.nameAr} value={r.nameAr}>{r.nameAr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">المدينة</label>
            <select value={form.city} onChange={(e) => set('city', e.target.value)} className="input w-full text-sm" disabled={!form.province}>
              <option value="">-- اختر المدينة --</option>
              {cities.map((c) => (
                <option key={c.nameAr} value={c.nameAr}>{c.nameAr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* District (free text) + Street */}
        <div className="grid grid-cols-2 gap-2">
          <FormField label="الحي" placeholder="اسم الحي" {...fieldProps('district')} />
          <FormField label="الشارع" placeholder="اسم الشارع" {...fieldProps('street')} />
        </div>

        {/* Postal + Building + Plot */}
        <div className="grid grid-cols-3 gap-2">
          <FormField label="الرمز البريدي" placeholder="12345" dir="ltr" {...fieldProps('postalCode')} />
          <FormField label="رقم المبنى" placeholder="1234" dir="ltr" {...fieldProps('buildingNumber')} />
          <FormField label="الرقم الإضافي" placeholder="معرّف قطعة الأرض" dir="ltr" {...fieldProps('plotIdentification')} />
        </div>

        {/* ── Identification (ZATCA) ────────────────────────────── */}
        <SectionHeader icon={ShieldCheck} label="خطة التعريف" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">نوع المعرف</label>
            <select
              value={form.idScheme}
              onChange={(e) => set('idScheme', e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">-- اختر --</option>
              {ID_SCHEMES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <FormField label="معرف آخر" placeholder="معرف إضافي" dir="ltr" {...fieldProps('otherId')} />
        </div>

        {mode === 'individual' && (
          <FormField label="رقم الهوية / الإقامة" placeholder="10 أرقام (اختياري)" dir="ltr" {...fieldProps('nationalId')} />
        )}
        {mode === 'company' && (
          <FormField label="السجل التجاري" required placeholder="رقم السجل" dir="ltr" {...fieldProps('commercialRegister')} />
        )}

        {/* ── VAT ──────────────────────────────────────────────── */}
        <div className="pt-2">
          <FormField
            label="رقم تسجيل ضريبة القيمة المضافة"
            required={mode === 'company'}
            placeholder="3xxxxxxxxxx00003"
            dir="ltr"
            {...fieldProps('taxNumber')}
          />
        </div>

        {/* ── Credit & payment ─────────────────────────────────── */}
        <SectionHeader icon={Building2} label="الائتمان والدفع" />
        <div className="grid grid-cols-2 gap-2">
          <FormField label="الحد الائتماني (ر.س)" type="number" placeholder="0" {...fieldProps('creditLimit')} />
          <FormField label="مدة السداد (بالأيام)" type="number" placeholder="30" {...fieldProps('creditPeriodDays')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">طريقة السداد المفضلة</label>
          <select
            value={form.preferredPayment}
            onChange={(e) => set('preferredPayment', e.target.value)}
            className="input w-full text-sm"
          >
            <option value="">-- اختر --</option>
            <option value="تحويل بنكي">تحويل بنكي</option>
            <option value="شيك">شيك</option>
            <option value="نقد">نقد</option>
          </select>
        </div>

        {/* Bank info */}
        <FormField label="اسم البنك" placeholder="مثال: الراجحي" {...fieldProps('bankName')} />
        <div className="grid grid-cols-2 gap-2">
          <FormField label="رقم الحساب" dir="ltr" {...fieldProps('bankAccountNumber')} />
          <FormField label="IBAN" placeholder="SA..." dir="ltr" {...fieldProps('iban')} />
        </div>

        {/* Project section */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              معلّق على مشروع؟
            </label>
            <button
              type="button"
              onClick={() => set('hasProject', !form.hasProject)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.hasProject ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  form.hasProject ? '-translate-x-6' : '-translate-x-1',
                )}
              />
            </button>
          </div>
          {form.hasProject && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <input
                  value={form.projectName}
                  onChange={(e) => set('projectName', e.target.value)}
                  placeholder="اسم المشروع"
                  className={cn(
                    'input flex-1',
                    errors.projectName && 'border-red-500 dark:border-red-500',
                  )}
                />
                <button
                  type="button"
                  onClick={() => {/* placeholder for future project picker */}}
                  className="shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
                  title="إضافة مشروع جديد"
                >
                  <Plus size={16} />
                </button>
              </div>
              {errors.projectName && (
                <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={createContact.isPending}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {createContact.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          'حفظ العميل'
        )}
      </button>
    </div>
  );
}
