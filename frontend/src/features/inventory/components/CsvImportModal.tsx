import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { importExportApi, type CsvImportResult } from '@/lib/api/endpoints';
import { warehousesApi } from '@/lib/api/endpoints';

type ImportType = 'Products' | 'Contacts' | 'Categories';

type Props = {
  open: boolean;
  onClose: () => void;
  defaultType?: ImportType;
};

export function CsvImportModal({ open, onClose, defaultType = 'Products' }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<ImportType>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'result'>('upload');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
    enabled: open && importType === 'Products',
  });

  const warehouseList = (warehouses as any)?.data ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith('.csv')) {
        toast.error('يجب أن يكون الملف بصيغة CSV');
        return;
      }
      setFile(f);
    }
  };

  const handleImport = async () => {
    if (!file) { toast.error('يرجى اختيار ملف'); return; }
    if (importType === 'Products' && !warehouseId) { toast.error('يرجى اختيار المستودع'); return; }

    setLoading(true);
    try {
      let res: any;
      if (importType === 'Products') {
        res = await importExportApi.importProducts(file, warehouseId, skipDuplicates);
      } else if (importType === 'Contacts') {
        res = await importExportApi.importContacts(file, skipDuplicates);
      } else {
        res = await importExportApi.importCategories(file, skipDuplicates);
      }

      if (res.success) {
        setResult(res.data);
        setStep('result');
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        toast.success(`تم استيراد ${res.data.successCount} عنصر بنجاح`);
      } else {
        toast.error(res.errors?.[0] || 'فشل الاستيراد');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let blob: Blob;
      let filename: string;

      if (importType === 'Products') {
        blob = await importExportApi.exportProducts();
        filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (importType === 'Contacts') {
        blob = await importExportApi.exportContacts();
        filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        blob = await importExportApi.exportCategories();
        filename = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('تم التصدير بنجاح');
    } catch {
      toast.error('فشل التصدير');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importExportApi.downloadTemplate(importType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${importType.toLowerCase()}-template.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('فشل تحميل القالب');
    }
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    setStep('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!open) return null;

  const typeLabels: Record<ImportType, string> = {
    Products: 'المنتجات',
    Contacts: 'جهات الاتصال',
    Categories: 'الفئات',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">استيراد / تصدير CSV</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">استيراد أو تصدير البيانات بصيغة CSV</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'upload' && (
            <>
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع البيانات</label>
                <div className="flex gap-2">
                  {(['Products', 'Contacts', 'Categories'] as ImportType[]).map(t => (
                    <button key={t} onClick={() => { setImportType(t); resetState(); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        importType === t
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warehouse selector (products only) */}
              {importType === 'Products' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المستودع</label>
                  <select value={warehouseId} onChange={e => setWarehouseId(+e.target.value)} className="input">
                    <option value={0}>اختر المستودع...</option>
                    {warehouseList.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملف CSV</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-brand-400 dark:hover:border-brand-600 transition cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  <Upload size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">اضغط لاختيار ملف CSV</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">أو اسحب الملف هنا</p>
                    </>
                  )}
                </div>
              </div>

              {/* Options */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">تخطي العناصر المكررة</span>
              </label>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleImport} disabled={!file || loading}
                  className="btn-primary flex-1 gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {loading ? 'جارٍ الاستيراد...' : 'استيراد'}
                </button>
                <button onClick={handleExport} className="btn-secondary gap-2">
                  <Download size={16} /> تصدير
                </button>
              </div>

              {/* Template download */}
              <button onClick={handleDownloadTemplate}
                className="w-full text-center text-xs text-brand-600 dark:text-brand-400 hover:underline py-2">
                <Download size={12} className="inline ml-1" />
                تحميل قالب CSV لـ{typeLabels[importType]}
              </button>
            </>
          )}

          {step === 'result' && result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-3 text-center">
                  <CheckCircle size={20} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{result.successCount}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">نجح</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-3 text-center">
                  <AlertTriangle size={20} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{result.skippedCount}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">تم تخطيه</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3 text-center">
                  <XCircle size={20} className="mx-auto text-red-600 dark:text-red-400 mb-1" />
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">{result.errorCount}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">أخطاء</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                الإجمالي: {result.totalRows} صف
              </p>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">تنبيهات:</p>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">• {w}</p>
                  ))}
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">أخطاء:</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-red-600 dark:text-red-400">
                        <th className="text-right py-1">السطر</th>
                        <th className="text-right py-1">الحقل</th>
                        <th className="text-right py-1">الرسالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 50).map((e, i) => (
                        <tr key={i} className="text-red-700 dark:text-red-300 border-t border-red-100 dark:border-red-900">
                          <td className="py-1">{e.row}</td>
                          <td className="py-1">{e.field}</td>
                          <td className="py-1">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.errors.length > 50 && (
                    <p className="text-xs text-red-500 mt-2 text-center">... و {result.errors.length - 50} خطأ آخر</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={resetState} className="btn-secondary flex-1">استيراد آخر</button>
                <button onClick={handleClose} className="btn-primary flex-1">إغلاق</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
