import { useMemo, useState } from 'react';
import {
  AlertCircle, ChevronDown, ChevronLeft, Eye, EyeOff, Info, Pencil, Plus, Search, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  useChartOfAccounts,
  useCreateChartOfAccount,
  useUpdateChartOfAccount,
} from '../api';
import { AccountCategory, buildTree, type ChartOfAccountNode } from '../types';

const categoryLabels: Record<AccountCategory, string> = {
  [AccountCategory.Asset]: 'أصول',
  [AccountCategory.Liability]: 'خصوم',
  [AccountCategory.Equity]: 'حقوق ملكية',
  [AccountCategory.Revenue]: 'إيرادات',
  [AccountCategory.Expense]: 'مصروفات',
};

const categoryColors: Record<AccountCategory, string> = {
  [AccountCategory.Asset]: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  [AccountCategory.Liability]: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  [AccountCategory.Equity]: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  [AccountCategory.Revenue]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  [AccountCategory.Expense]: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// Find matching nodes + all their ancestors for search context.
function filterTree(
  nodes: ChartOfAccountNode[],
  term: string,
  showInactive: boolean
): ChartOfAccountNode[] {
  const t = term.trim().toLowerCase();
  const out: ChartOfAccountNode[] = [];
  for (const node of nodes) {
    const children = node.children ? filterTree(node.children, t, showInactive) : [];
    const selfMatches =
      (!t ||
        node.code.toLowerCase().includes(t) ||
        node.nameAr.toLowerCase().includes(t) ||
        (node.nameEn?.toLowerCase().includes(t) ?? false)) &&
      (showInactive || node.isActive);
    if (selfMatches || children.length > 0) {
      out.push({ ...node, children });
    }
  }
  return out;
}

function suggestNextCode(parent: ChartOfAccountNode | null): string {
  if (!parent) return '';
  const childCodes = (parent.children ?? []).map((c) => c.code);
  const prefix = `${parent.code}-`;
  let seq = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = `${prefix}${seq}`;
    if (!childCodes.includes(candidate)) return candidate;
    seq += 1;
  }
}

type AddModalState = { open: boolean; parent: ChartOfAccountNode | null };
type EditModalState = { open: boolean; account: ChartOfAccountNode | null };

export function ChartOfAccountsBrowser() {
  const { data, isLoading, isError, refetch } = useChartOfAccounts();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [addModal, setAddModal] = useState<AddModalState>({ open: false, parent: null });
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, account: null });

  const tree = useMemo(() => {
    if (!data) return [];
    return buildTree(data.accounts);
  }, [data]);

  const filtered = useMemo(() => {
    return filterTree(tree, search, showInactive);
  }, [tree, search, showInactive]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // When searching, auto-expand everything so matches are visible.
  const isSearching = search.trim().length > 0;

  if (isLoading) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400" dir="rtl">
        جاري تحميل شجرة الحسابات...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 flex flex-col items-center gap-3" dir="rtl">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-700 dark:text-gray-300">تعذر تحميل شجرة الحسابات</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (data?.notAvailable) {
    return (
      <div className="card p-8 flex flex-col items-center gap-3 text-center" dir="rtl">
        <Info size={32} className="text-brand-500" />
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          سيتم إضافة هذه الميزة قريباً
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          الواجهة جاهزة، ولكن نقطة الوصول الخلفية غير متاحة بعد.
        </p>
      </div>
    );
  }

  const hasAccounts = (data?.accounts.length ?? 0) > 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالكود أو الاسم..."
            className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4"
          />
          إظهار غير النشطة
        </label>

        <button
          type="button"
          onClick={() => setAddModal({ open: true, parent: null })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm"
        >
          <Plus size={16} />
          إضافة حساب فرعي
        </button>
      </div>

      {/* Tree */}
      {!hasAccounts ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          لم يتم تحميل أي حسابات. جرب تحديث الصفحة.
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          لا توجد نتائج تطابق البحث.
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((node) => (
            <AccountRow
              key={node.id}
              node={node}
              expanded={expanded}
              toggle={toggle}
              forceExpand={isSearching}
              onAddChild={(parent) => setAddModal({ open: true, parent })}
              onEdit={(account) => setEditModal({ open: true, account })}
            />
          ))}
        </div>
      )}

      {addModal.open && (
        <AddAccountModal
          parent={addModal.parent}
          allAccounts={data?.accounts ?? []}
          onClose={() => setAddModal({ open: false, parent: null })}
        />
      )}

      {editModal.open && editModal.account && (
        <EditAccountModal
          account={editModal.account}
          onClose={() => setEditModal({ open: false, account: null })}
        />
      )}
    </div>
  );
}

type AccountRowProps = {
  node: ChartOfAccountNode;
  expanded: Set<number>;
  toggle: (id: number) => void;
  forceExpand: boolean;
  onAddChild: (parent: ChartOfAccountNode) => void;
  onEdit: (account: ChartOfAccountNode) => void;
};

function AccountRow({ node, expanded, toggle, forceExpand, onAddChild, onEdit }: AccountRowProps) {
  const updateMut = useUpdateChartOfAccount(node.id);
  const isOpen = forceExpand || expanded.has(node.id);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const indent = node.level * 20;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/50',
          !node.isActive && 'opacity-50'
        )}
        style={{ paddingInlineStart: 12 + indent }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            aria-label={isOpen ? 'طي' : 'توسيع'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="font-mono text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">
          {node.code}
        </span>

        <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">
          {node.nameAr}
          {node.nameEn && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mx-2">({node.nameEn})</span>
          )}
        </span>

        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium',
            categoryColors[node.category]
          )}
        >
          {categoryLabels[node.category]}
        </span>

        {node.isSystem && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            نظام
          </span>
        )}

        <div className="flex items-center gap-1">
          {node.isGroup && !node.isSystem && (
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600"
              title="إضافة حساب فرعي"
            >
              <Plus size={14} />
            </button>
          )}
          {node.isGroup && node.isSystem && (
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600"
              title="إضافة حساب فرعي"
            >
              <Plus size={14} />
            </button>
          )}
          {!node.isSystem && (
            <>
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600"
                title="تعديل"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                disabled={updateMut.isPending}
                onClick={() => updateMut.mutate({ isActive: !node.isActive })}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600 disabled:opacity-50"
                title={node.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
              >
                {node.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <AccountRow
              key={child.id}
              node={child}
              expanded={expanded}
              toggle={toggle}
              forceExpand={forceExpand}
              onAddChild={onAddChild}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type AddAccountModalProps = {
  parent: ChartOfAccountNode | null;
  allAccounts: ChartOfAccountNode[];
  onClose: () => void;
};

function AddAccountModal({ parent: initialParent, allAccounts, onClose }: AddAccountModalProps) {
  const tree = useMemo(() => buildTree(allAccounts), [allAccounts]);
  const parentById = useMemo(() => {
    const m = new Map<number, ChartOfAccountNode>();
    // Use tree traversal so children[] is populated for suggestNextCode
    const visit = (nodes: ChartOfAccountNode[]) => {
      for (const n of nodes) {
        m.set(n.id, n);
        if (n.children?.length) visit(n.children);
      }
    };
    visit(tree);
    return m;
  }, [tree]);

  const [parentId, setParentId] = useState<number | null>(initialParent?.id ?? null);
  const parent = parentId != null ? parentById.get(parentId) ?? null : null;

  const [code, setCode] = useState(() => suggestNextCode(initialParent));
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');

  const createMut = useCreateChartOfAccount();

  const groupOptions = useMemo(() => {
    const opts: ChartOfAccountNode[] = [];
    const walk = (nodes: ChartOfAccountNode[]) => {
      for (const n of nodes) {
        if (n.isGroup) opts.push(n);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(tree);
    return opts;
  }, [tree]);

  const handleParentChange = (id: number) => {
    setParentId(id);
    const p = parentById.get(id) ?? null;
    setCode(suggestNextCode(p));
  };

  const canSubmit = parent && !parent.isSystem && code.trim() && nameAr.trim() && !createMut.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !parent) return;
    try {
      await createMut.mutateAsync({
        parentId: parent.id,
        code: code.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || null,
        description: description.trim() || null,
      });
      onClose();
    } catch {
      // handled by global toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">إضافة حساب فرعي</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">الحساب الأب</label>
            <select
              value={parentId ?? ''}
              onChange={(e) => handleParentChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              required
            >
              <option value="">-- اختر --</option>
              {groupOptions.map((o) => (
                <option key={o.id} value={o.id} disabled={o.isSystem && false}>
                  {'—'.repeat(o.level)} {o.code} · {o.nameAr}
                </option>
              ))}
            </select>
            {parent?.isSystem && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                لا يمكن إضافة حسابات تحت حساب نظام مباشرة.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">الكود</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">الاسم بالعربية</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              الاسم بالإنجليزية (اختياري)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              الوصف (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {createMut.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EditAccountModalProps = {
  account: ChartOfAccountNode;
  onClose: () => void;
};

function EditAccountModal({ account, onClose }: EditAccountModalProps) {
  const [nameAr, setNameAr] = useState(account.nameAr);
  const [nameEn, setNameEn] = useState(account.nameEn ?? '');
  const [description, setDescription] = useState(account.description ?? '');
  const [isActive, setIsActive] = useState(account.isActive);
  const updateMut = useUpdateChartOfAccount(account.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMut.mutateAsync({
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || null,
        description: description.trim() || null,
        isActive,
      });
      onClose();
    } catch {
      // toast handles it
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            تعديل الحساب {account.code}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">الاسم بالعربية</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              الاسم بالإنجليزية
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            نشط
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {updateMut.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
