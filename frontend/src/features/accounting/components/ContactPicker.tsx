import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '@/lib/api/endpoints';
import { ContactType } from '@/types/api.types';

type Props = {
  value: { contactId: number; contactName: string } | null;
  onChange: (v: { contactId: number; contactName: string } | null) => void;
};

export function ContactPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', 'search', debounced],
    queryFn: () => contactsApi.search({ search: debounced, pageSize: 20 }),
    select: (r) => r.data,
    enabled: open,
  });

  const items = data?.items ?? [];

  const typeLabel = (t: ContactType) =>
    t === ContactType.Customer ? 'عميل' : t === ContactType.Supplier ? 'مورد' : 'عميل/مورد';
  const typeClass = (t: ContactType) =>
    t === ContactType.Customer
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      : t === ContactType.Supplier
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300';

  return (
    <div className="relative min-w-[260px]" ref={containerRef} dir="rtl">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm">
          <span className="font-medium text-gray-900 dark:text-gray-100">{value.contactName}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery('');
            }}
            className="ms-auto text-gray-400 hover:text-red-500"
            aria-label="مسح"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="ابحث باسم العميل أو المورد"
            className="flex-1 bg-transparent outline-none text-sm dark:text-gray-100"
          />
        </div>
      )}

      {open && !value && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500">جارِ البحث...</div>
          ) : !debounced ? (
            <div className="p-3 text-sm text-gray-500">ابحث باسم العميل أو المورد</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">لا توجد نتائج</div>
          ) : (
            items.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onChange({ contactId: c.id, contactName: c.name });
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                <span
                  className={`ms-auto inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium ${typeClass(
                    c.contactType,
                  )}`}
                >
                  {typeLabel(c.contactType)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
