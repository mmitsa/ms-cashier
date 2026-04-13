import { useState, useMemo } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, Users, Sofa, Wind, Sun, Cigarette,
  Crown, GripVertical, Eye, EyeOff, Table2, ArrowUpDown,
  Palette, Clock, DollarSign, AlertCircle, RefreshCw, ChevronDown,
  ChevronUp, Thermometer, Coffee, Utensils, TreePine, Sparkles,
  LayoutGrid, ListOrdered, Settings2, BarChart3, Move,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import {
  useFloorOverview, useFloorSections, useSaveFloorSection,
  useDeleteFloorSection, useReorderFloorSections,
  useTables, useAssignTableToSection, useRemoveTableFromSection,
} from '@/hooks/useApi';

// ============================================================
// Section Icon Map
// ============================================================

const sectionIcons: Record<string, typeof Sofa> = {
  sofa: Sofa, sun: Sun, treePine: TreePine, coffee: Coffee,
  utensils: Utensils, crown: Crown, sparkles: Sparkles,
  thermometer: Thermometer, mapPin: MapPin,
};

const iconOptions = [
  { id: 'sofa', label: 'صالة', Icon: Sofa },
  { id: 'sun', label: 'خارجي', Icon: Sun },
  { id: 'treePine', label: 'حديقة', Icon: TreePine },
  { id: 'coffee', label: 'كافيه', Icon: Coffee },
  { id: 'utensils', label: 'مطعم', Icon: Utensils },
  { id: 'crown', label: 'VIP', Icon: Crown },
  { id: 'sparkles', label: 'مميز', Icon: Sparkles },
  { id: 'thermometer', label: 'مكيف', Icon: Thermometer },
  { id: 'mapPin', label: 'عام', Icon: MapPin },
];

const colorPresets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c',
];

// ============================================================
// FloorPlanScreen Component
// ============================================================

export default function FloorPlanScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'assign'>('overview');
  const [editingSection, setEditingSection] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [assigningSectionId, setAssigningSectionId] = useState<number | null>(null);

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useFloorOverview();
  const { data: sectionsRes, isLoading: sectionsLoading, refetch: refetchSections } = useFloorSections();
  const { data: tablesRes } = useTables();

  const saveSection = useSaveFloorSection();
  const deleteSection = useDeleteFloorSection();
  const reorderSections = useReorderFloorSections();
  const assignTable = useAssignTableToSection();
  const removeTable = useRemoveTableFromSection();

  const sections = sectionsRes?.data ?? [];
  const tables = tablesRes?.data ?? [];
  const overviewData = overview?.data;

  const unassignedTables = useMemo(() =>
    tables.filter((t: any) => !t.sectionId),
    [tables]
  );

  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة', Icon: BarChart3 },
    { id: 'sections' as const, label: 'مناطق التشغيل', Icon: LayoutGrid },
    { id: 'assign' as const, label: 'توزيع الطاولات', Icon: Move },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
              <MapPin size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            مناطق التشغيل
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة أقسام ومناطق المطعم أو الكافيه</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetchOverview(); refetchSections(); }}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => { setEditingSection(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
          >
            <Plus size={18} /> إضافة منطقة
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border dark:border-gray-700 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <tab.Icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab overviewData={overviewData} sections={sections} loading={overviewLoading} />
      )}
      {activeTab === 'sections' && (
        <SectionsTab
          sections={sections}
          loading={sectionsLoading}
          expandedSection={expandedSection}
          setExpandedSection={setExpandedSection}
          onEdit={(s: any) => { setEditingSection(s); setShowForm(true); }}
          onDelete={(id: number) => {
            if (confirm('هل تريد حذف هذه المنطقة؟ سيتم فك ربط الطاولات منها.')) {
              deleteSection.mutate(id);
            }
          }}
          onReorder={(ids: number[]) => reorderSections.mutate(ids)}
        />
      )}
      {activeTab === 'assign' && (
        <AssignTab
          sections={sections}
          unassignedTables={unassignedTables}
          assigningSectionId={assigningSectionId}
          setAssigningSectionId={setAssigningSectionId}
          onAssign={(sectionId: number, tableId: number) => assignTable.mutate({ sectionId, tableId })}
          onRemove={(sectionId: number, tableId: number) => removeTable.mutate({ sectionId, tableId })}
        />
      )}

      {/* Section Form Modal */}
      {showForm && (
        <SectionFormModal
          section={editingSection}
          onClose={() => { setShowForm(false); setEditingSection(null); }}
          onSave={(data: any) => {
            saveSection.mutate(
              { id: editingSection?.id, data },
              { onSuccess: () => { setShowForm(false); setEditingSection(null); } }
            );
          }}
          saving={saveSection.isPending}
        />
      )}
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab({ overviewData, sections, loading }: { overviewData: any; sections: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = overviewData || {
    totalTables: 0, occupiedTables: 0, availableTables: 0,
    totalCapacity: 0, currentGuests: 0,
  };

  const occupancyRate = stats.totalTables > 0
    ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
    : 0;

  const capacityRate = stats.totalCapacity > 0
    ? Math.round((stats.currentGuests / stats.totalCapacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Table2} label="إجمالي الطاولات" value={stats.totalTables} color="indigo" />
        <StatCard icon={Users} label="مشغولة" value={stats.occupiedTables} color="red" />
        <StatCard icon={Eye} label="متاحة" value={stats.availableTables} color="green" />
        <StatCard icon={Users} label="إجمالي المقاعد" value={stats.totalCapacity} color="blue" />
        <StatCard icon={Users} label="ضيوف حالياً" value={stats.currentGuests} color="amber" />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">نسبة إشغال الطاولات</span>
            <span className={`text-2xl font-bold ${occupancyRate > 80 ? 'text-red-600' : occupancyRate > 50 ? 'text-amber-600' : 'text-green-600'}`}>
              {occupancyRate}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">نسبة إشغال المقاعد</span>
            <span className={`text-2xl font-bold ${capacityRate > 80 ? 'text-red-600' : capacityRate > 50 ? 'text-amber-600' : 'text-green-600'}`}>
              {capacityRate}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${capacityRate > 80 ? 'bg-red-500' : capacityRate > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${capacityRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s: any) => {
          const SectionIcon = sectionIcons[s.icon] || MapPin;
          const sOccRate = s.tableCount > 0 ? Math.round((s.occupiedCount / s.tableCount) * 100) : 0;
          return (
            <div key={s.id} className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border dark:border-gray-700 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${s.color}20`, color: s.color }}
                >
                  <SectionIcon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{s.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                    {s.isOutdoor && <span className="flex items-center gap-1"><Sun size={12} /> خارجي</span>}
                    {s.isVIP && <span className="flex items-center gap-1 text-amber-600"><Crown size={12} /> VIP</span>}
                    {s.hasAC && <span className="flex items-center gap-1"><Wind size={12} /> مكيف</span>}
                    {s.isSmokingAllowed && <span className="flex items-center gap-1 text-red-500"><Cigarette size={12} /> تدخين</span>}
                  </div>
                </div>
                {!s.isActive && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">معطلة</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.tableCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">طاولات</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-2">
                  <div className="text-lg font-bold text-red-600">{s.occupiedCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">مشغولة</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{s.availableCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">متاحة</div>
                </div>
              </div>

              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${sOccRate}%`, backgroundColor: s.color }}
                />
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
                إشغال {sOccRate}% | سعة {s.totalCapacity} مقعد
              </div>

              {s.serviceChargePercent != null && s.serviceChargePercent > 0 && (
                <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1 justify-center">
                  <DollarSign size={12} /> رسوم خدمة {s.serviceChargePercent}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-16">
          <MapPin size={56} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد مناطق تشغيل</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">أضف مناطق مثل: صالة داخلية، تراس، VIP، كافيه خارجي</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sections Tab
// ============================================================

function SectionsTab({ sections, loading, expandedSection, setExpandedSection, onEdit, onDelete, onReorder }: {
  sections: any[];
  loading: boolean;
  expandedSection: number | null;
  setExpandedSection: (id: number | null) => void;
  onEdit: (s: any) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}) {
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const ids = sections.map((s: any) => s.id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    onReorder(ids);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((s: any, index: number) => {
        const SectionIcon = sectionIcons[s.icon] || MapPin;
        const isExpanded = expandedSection === s.id;

        return (
          <div key={s.id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-all ${!s.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <GripVertical size={14} className="text-gray-300" />
                <button
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                <SectionIcon size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{s.name}</h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {s.isVIP && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">VIP</span>}
                    {s.isOutdoor && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">خارجي</span>}
                    {s.isSmokingAllowed && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">تدخين</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {s.tableCount} طاولة • {s.totalCapacity} مقعد •{' '}
                  <span className={s.occupiedCount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {s.occupiedCount} مشغولة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : s.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button onClick={() => onEdit(s)} className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-800 space-y-3">
                {s.description && <p className="text-sm text-gray-600 dark:text-gray-400">{s.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Wind size={12} /> {s.hasAC ? 'مكيف' : 'بدون تكييف'}</span>
                  <span className="flex items-center gap-1"><Cigarette size={12} /> {s.isSmokingAllowed ? 'يسمح بالتدخين' : 'ممنوع التدخين'}</span>
                  <span className="flex items-center gap-1"><Sun size={12} /> {s.isOutdoor ? 'خارجي' : 'داخلي'}</span>
                  {s.maxCapacity && <span className="flex items-center gap-1"><Users size={12} /> سعة قصوى: {s.maxCapacity}</span>}
                  {s.serviceChargePercent != null && s.serviceChargePercent > 0 && (
                    <span className="flex items-center gap-1"><DollarSign size={12} /> رسوم خدمة: {s.serviceChargePercent}%</span>
                  )}
                </div>
                {s.operatingHours && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> ساعات العمل: {s.operatingHours}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700">
          <LayoutGrid size={56} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد مناطق</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">أنشئ مناطق التشغيل لتنظيم المطعم</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Assign Tab
// ============================================================

function AssignTab({ sections, unassignedTables, assigningSectionId, setAssigningSectionId, onAssign, onRemove }: {
  sections: any[];
  unassignedTables: any[];
  assigningSectionId: number | null;
  setAssigningSectionId: (id: number | null) => void;
  onAssign: (sectionId: number, tableId: number) => void;
  onRemove: (sectionId: number, tableId: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Unassigned Tables */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-500" />
          طاولات غير مخصصة ({unassignedTables.length})
        </h3>
        {unassignedTables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unassignedTables.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Table2 size={14} className="text-amber-600" />
                <span className="text-sm font-medium">{t.tableNumber}</span>
                <span className="text-[10px] text-gray-500">({t.capacity} مقاعد)</span>
                {assigningSectionId && (
                  <button
                    onClick={() => onAssign(assigningSectionId, t.id)}
                    className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  >
                    خصص
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">جميع الطاولات مخصصة لمناطق</p>
        )}
      </div>

      {/* Sections with Tables */}
      {sections.map((s: any) => {
        const SectionIcon = sectionIcons[s.icon] || MapPin;
        const isAssigning = assigningSectionId === s.id;

        return (
          <div key={s.id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-700 p-5 transition-all ${isAssigning ? 'ring-2 ring-indigo-400' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                  <SectionIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{s.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{s.tableCount} طاولة</span>
                </div>
              </div>
              <button
                onClick={() => setAssigningSectionId(isAssigning ? null : s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isAssigning
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {isAssigning ? 'إلغاء' : 'تعيين طاولات'}
              </button>
            </div>

            {s.tableCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(sections.find((sec: any) => sec.id === s.id) as any)?.tables?.map?.((t: any) => (
                  <div key={t.id ?? t.tableNumber} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg group">
                    <Table2 size={14} className="text-gray-500" />
                    <span className="text-sm font-medium">{t.tableNumber ?? t}</span>
                    <button
                      onClick={() => onRemove(s.id, t.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )) ?? (
                  <p className="text-xs text-gray-400">الطاولات المخصصة ستظهر هنا بعد إعادة التحميل</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">لا توجد طاولات مخصصة لهذه المنطقة</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Section Form Modal
// ============================================================

function SectionFormModal({ section, onClose, onSave, saving }: {
  section: any;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: section?.name ?? '',
    description: section?.description ?? '',
    color: section?.color ?? '#6366f1',
    icon: section?.icon ?? 'sofa',
    sortOrder: section?.sortOrder ?? 0,
    isActive: section?.isActive ?? true,
    isOutdoor: section?.isOutdoor ?? false,
    hasAC: section?.hasAC ?? true,
    isSmokingAllowed: section?.isSmokingAllowed ?? false,
    isVIP: section?.isVIP ?? false,
    serviceChargePercent: section?.serviceChargePercent ?? null,
    maxCapacity: section?.maxCapacity ?? null,
    operatingHours: section?.operatingHours ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('اسم المنطقة مطلوب'); return; }
    onSave({
      ...form,
      serviceChargePercent: form.serviceChargePercent ? Number(form.serviceChargePercent) : null,
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
    });
  };

  return (
    <Modal open onClose={onClose} title={section ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
        {/* Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنطقة *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="مثال: الصالة الرئيسية"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="وصف اختياري للمنطقة"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">أيقونة المنطقة</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, icon: opt.id }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${
                  form.icon === opt.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <opt.Icon size={16} /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">لون المنطقة</label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-full transition-all ${
                  form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'isActive', label: 'مفعّلة', Icon: Eye },
            { key: 'isOutdoor', label: 'خارجية', Icon: Sun },
            { key: 'hasAC', label: 'مكيّفة', Icon: Wind },
            { key: 'isSmokingAllowed', label: 'تدخين', Icon: Cigarette },
            { key: 'isVIP', label: 'VIP', Icon: Crown },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                (form as any)[key]
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رسوم خدمة (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.serviceChargePercent ?? ''}
              onChange={e => setForm(f => ({ ...f, serviceChargePercent: e.target.value ? Number(e.target.value) : null }))}
              placeholder="0"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للمقاعد</label>
            <input
              type="number"
              min={0}
              value={form.maxCapacity ?? ''}
              onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value ? Number(e.target.value) : null }))}
              placeholder="بدون حد"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب العرض</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ساعات العمل</label>
          <input
            value={form.operatingHours}
            onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))}
            placeholder="مثال: 8:00 ص - 12:00 م"
            className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-3 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'جارٍ الحفظ...' : section ? 'تحديث' : 'إنشاء'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// Stat Card Component
// ============================================================

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: number; color: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}
