import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Shield, Eye, EyeOff, Loader2, Trash2, X, Save,
  CheckCircle, XCircle, UserCheck, Settings, ToggleRight, ToggleLeft,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PERMISSION_GROUPS, ROLE_DEFAULTS, type PermissionKey } from '@/lib/permissions/permissions';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────

interface UserDetail {
  id: string; username: string; fullName: string; phone?: string; email?: string;
  role: string; isActive: boolean; lastLoginAt?: string;
  permissions: { permission: string; isGranted: boolean }[];
}

const ROLES = [
  { value: 'Admin', label: 'مدير', color: 'indigo' },
  { value: 'Manager', label: 'مشرف', color: 'blue' },
  { value: 'Cashier', label: 'كاشير', color: 'green' },
  { value: 'Accountant', label: 'محاسب', color: 'purple' },
  { value: 'Warehouse', label: 'أمين مستودع', color: 'amber' },
];

// ─── Main Screen ─────────────────────────────────────────

export function UserManagementScreen() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
  const [permUser, setPermUser] = useState<UserDetail | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['store-users'],
    queryFn: async () => { const r = await apiClient.get('/users'); return r.data.data as UserDetail[]; },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/toggle-active`),
    onSuccess: () => { toast.success('تم التحديث'); qc.invalidateQueries({ queryKey: ['store-users'] }); },
    onError: () => toast.error('فشل التحديث'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['store-users'] }); },
    onError: () => toast.error('فشل الحذف'),
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المستخدمين</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إضافة وإدارة مستخدمي المتجر وصلاحياتهم</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition text-sm">
          <Plus size={16} /> إضافة مستخدم
        </button>
      </div>

      {/* Roles Legend */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <span key={r.value} className={`text-xs px-2.5 py-1 rounded-lg bg-${r.color}-50 text-${r.color}-700 border border-${r.color}-200 font-medium`}>
            {r.label}
          </span>
        ))}
      </div>

      {/* Users Grid */}
      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا يوجد مستخدمون</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => {
              const role = ROLES.find(r => r.value === u.role);
              return (
                <div key={u.id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${u.isActive ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900' : 'border-red-100 bg-red-50/30 dark:bg-red-950/30'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${u.isActive ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-gray-400'}`}>
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{u.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-${role?.color || 'gray'}-100 text-${role?.color || 'gray'}-700`}>
                        {role?.label || u.role}
                      </span>
                      {!u.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-red-100 text-red-700">معطّل</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5" dir="ltr">@{u.username} {u.phone && `• ${u.phone}`}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPermUser(u)} className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 transition" title="الصلاحيات">
                      <Shield size={16} />
                    </button>
                    <button onClick={() => setEditUser(u)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title="تعديل">
                      <Settings size={16} />
                    </button>
                    <button onClick={() => toggleMutation.mutate(u.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title={u.isActive ? 'تعطيل' : 'تفعيل'}>
                      {u.isActive ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => { if (confirm(`حذف ${u.fullName}؟`)) deleteMutation.mutate(u.id); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition" title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editUser) && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowAdd(false); setEditUser(null); }}
        />
      )}

      {/* Permissions Modal */}
      {permUser && (
        <PermissionsModal
          user={permUser}
          onClose={() => setPermUser(null)}
        />
      )}
    </div>
  );
}

// ─── User Form Modal ─────────────────────────────────────

function UserFormModal({ user, onClose }: { user: UserDetail | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    role: user?.role || 'Cashier',
  });
  const [showPw, setShowPw] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return apiClient.put(`/users/${user.id}`, {
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          role: form.role,
          password: form.password || undefined,
        });
      }
      return apiClient.post('/users', {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        role: form.role,
      });
    },
    onSuccess: () => {
      toast.success(user ? 'تم التحديث' : 'تم إنشاء المستخدم');
      qc.invalidateQueries({ queryKey: ['store-users'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'فشل العملية'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold dark:text-gray-100">{user ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم الكامل</label>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المستخدم</label>
              <input value={form.username} onChange={e => set('username', e.target.value.replace(/\s/g, ''))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{user ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500 pl-10" dir="ltr" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الهاتف</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الإيميل</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الدور</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => set('role', r.value)}
                  className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition ${form.role === r.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 text-gray-600 dark:text-gray-400'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || (!user && (!form.username || !form.password || !form.fullName))}
              className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {user ? 'تحديث' : 'إنشاء'}
            </button>
            <button onClick={onClose} className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Permissions Modal ───────────────────────────────────

function PermissionsModal({ user, onClose }: { user: UserDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const roleDefaults = ROLE_DEFAULTS[user.role] || [];

  // Merge server permissions with role defaults
  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    // Start with role defaults
    for (const p of roleDefaults) map[p] = true;
    // Override with server values
    for (const p of user.permissions) map[p.permission] = p.isGranted;
    return map;
  });

  const [expandedGroups, setExpandedGroups] = useState<string[]>(PERMISSION_GROUPS[0] ? [PERMISSION_GROUPS[0].id] : []);
  const toggleGroup = (id: string) => setExpandedGroups(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);

  const toggle = (key: string) => setPerms(p => ({ ...p, [key]: !p[key] }));

  const selectAll = (groupPerms: { key: string }[]) => {
    const allOn = groupPerms.every(p => perms[p.key]);
    setPerms(p => {
      const n = { ...p };
      groupPerms.forEach(gp => n[gp.key] = !allOn);
      return n;
    });
  };

  const applyRoleDefaults = (role: string) => {
    const defaults = ROLE_DEFAULTS[role] || [];
    const map: Record<string, boolean> = {};
    for (const group of PERMISSION_GROUPS) {
      for (const p of group.permissions) {
        map[p.key] = defaults.includes(p.key as PermissionKey);
      }
    }
    setPerms(map);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const permList = Object.entries(perms).map(([permission, isGranted]) => ({ permission, isGranted }));
      return apiClient.put(`/users/${user.id}/permissions`, permList);
    },
    onSuccess: () => {
      toast.success('تم حفظ الصلاحيات');
      qc.invalidateQueries({ queryKey: ['store-users'] });
      qc.invalidateQueries({ queryKey: ['user-permissions'] });
      onClose();
    },
    onError: () => toast.error('فشل حفظ الصلاحيات'),
  });

  const grantedCount = Object.values(perms).filter(Boolean).length;
  const totalCount = PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold dark:text-gray-100">صلاحيات: {user.fullName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">الدور: {ROLES.find(r => r.value === user.role)?.label || user.role} • {grantedCount}/{totalCount} صلاحية</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>

        {/* Quick apply */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs shrink-0">
          <span className="text-gray-400">تطبيق سريع:</span>
          {Object.keys(ROLE_DEFAULTS).map(role => (
            <button key={role} onClick={() => applyRoleDefaults(role)} className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-brand-100 hover:text-brand-700 transition font-medium">
              {ROLES.find(r => r.value === role)?.label || role}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {PERMISSION_GROUPS.map(group => {
            const isExpanded = expandedGroups.includes(group.id);
            const groupGranted = group.permissions.filter(p => perms[p.key]).length;
            return (
              <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{group.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${groupGranted === group.permissions.length ? 'bg-green-100 text-green-700' : groupGranted > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {groupGranted}/{group.permissions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); selectAll(group.permissions); }} className="text-[10px] px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-bold hover:bg-brand-200">
                      {groupGranted === group.permissions.length ? 'إلغاء الكل' : 'تحديد الكل'}
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="p-3 space-y-1">
                    {group.permissions.map(p => (
                      <label key={p.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition">
                        <button type="button" onClick={() => toggle(p.key)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${perms[p.key] ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                          {perms[p.key] && <CheckCircle size={12} className="text-white" />}
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{p.label}</span>
                        <span className="text-[10px] text-gray-400 mr-auto font-mono">{p.key}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ الصلاحيات
          </button>
          <button onClick={onClose} className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
