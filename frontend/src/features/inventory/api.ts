import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export function useBulkUpdateProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productIds: number[]; categoryId?: number; isActive?: boolean; costPrice?: number; retailPrice?: number }) =>
      productsApi.bulkUpdate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث المنتجات بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث المنتجات'),
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productIds: number[]) => productsApi.bulkDelete(productIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتجات بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء حذف المنتجات'),
  });
}

export function useUpdateBarcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, barcode }: { id: number; barcode: string }) =>
      productsApi.updateBarcode(id, barcode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث الباركود');
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث الباركود'),
  });
}

export function useUpdatePrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { costPrice?: number; retailPrice?: number } }) =>
      productsApi.updatePrices(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث الأسعار');
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث الأسعار'),
  });
}
