import { useState } from 'react';
import { ArrowRight, Building2, Loader2, Plus, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateContact } from '@/hooks/useApi';
import { cn } from '@/lib/utils/cn';
import { ContactType, PriceType } from '@/types/api.types';
import type { ContactDto, CreateContactRequest } from '@/types/api.types';

// ── Types ───────────────────────────────────────────────────────────────────

type CustomerMode = 'individual' | 'company';

type FormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: string;
  creditPeriodDays: string;
  preferredPayment: string;
  bankName: string;
  bankAccountNumber: string;
  iban: string;
  taxNumber: string;
  commercialRegister: string;
  nationalId: string;
  hasProject: boolean;
  projectName: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  creditLimit: '',
  creditPeriodDays: '',
  preferredPayment: '',
  bankName: '',
  bankAccountNumber: '',
  iban: '',
  taxNumber: '',
  commercialRegister: '',
  nationalId: '',
  hasProject: false,
  projectName: '',
};

// ── Field component (outside render) ────────────────────────────────────────

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
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className={cn(
          'input w-full',
          error && 'border-red-500 dark:border-red-500 focus:ring-red-500',
        )}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
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

  // ── Helpers ─────────────────────────────────────────────────────────────

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

    if (mode === 'individual') {
      if (!form.nationalId.trim()) {
        errs.nationalId = 'رقم الهوية مطلوب';
      } else if (!/^\d{10}$/.test(form.nationalId.trim())) {
        errs.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'البريد الإلكتروني غير صالح';
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
      address: form.address.trim() || undefined,
      priceType: PriceType.Retail,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      isCompany: mode === 'company',
      commercialRegister: mode === 'company' ? form.commercialRegister.trim() || undefined : undefined,
      nationalId: mode === 'individual' ? form.nationalId.trim() || undefined : undefined,
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

  // ── Render helper ───────────────────────────────────────────────────────

  const fieldProps = (field: keyof FormData) => ({
    field,
    value: form[field] as string,
    error: errors[field],
    onChange: set,
  });

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
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

      {/* Scrollable form area */}
      <div className="max-h-[400px] overflow-y-auto space-y-3 pe-1">
        {/* Common fields */}
        <FormField label="الاسم" required placeholder={mode === 'company' ? 'اسم الشركة' : 'اسم العميل'} {...fieldProps('name')} />
        <FormField label="الهاتف" type="tel" placeholder="05xxxxxxxx" {...fieldProps('phone')} />
        <FormField label="البريد الإلكتروني" type="email" placeholder="example@email.com" dir="ltr" {...fieldProps('email')} />
        <FormField label="العنوان" placeholder="المدينة، الحي" {...fieldProps('address')} />

        {/* Identity fields based on mode */}
        {mode === 'individual' && (
          <FormField label="رقم الهوية" required placeholder="10 أرقام" dir="ltr" {...fieldProps('nationalId')} />
        )}
        {mode === 'company' && (
          <>
            <FormField label="الرقم الضريبي" required placeholder="15 رقمًا" dir="ltr" {...fieldProps('taxNumber')} />
            <FormField label="السجل التجاري" required placeholder="رقم السجل التجاري" dir="ltr" {...fieldProps('commercialRegister')} />
          </>
        )}

        {/* Credit & payment */}
        <div className="grid grid-cols-2 gap-2">
          <FormField label="الحد الائتماني (ر.س)" type="number" placeholder="0" {...fieldProps('creditLimit')} />
          <FormField label="مدة السداد (بالأيام)" type="number" placeholder="30" {...fieldProps('creditPeriodDays')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            طريقة السداد المفضلة
          </label>
          <select
            value={form.preferredPayment}
            onChange={(e) => set('preferredPayment', e.target.value)}
            className="input w-full"
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
