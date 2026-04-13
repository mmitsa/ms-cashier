import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, cn } from '@/lib/utils/cn';
import { productVariantsApi } from '@/lib/api/endpoints';
import type { ProductDto, ProductVariantDto } from '@/types/api.types';

interface VariantSelectorProps {
  open: boolean;
  onClose: () => void;
  product: ProductDto;
  priceType: 'retail' | 'half' | 'wholesale';
  onSelect: (variant: ProductVariantDto, price: number) => void;
}

export function VariantSelector({
  open,
  onClose,
  product,
  priceType,
  onSelect,
}: VariantSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const { data: variantData, isLoading, isError } = useQuery({
    queryKey: ['product-variants', product.id],
    queryFn: () => productVariantsApi.getProductVariants(product.id),
    enabled: open,
    select: (res) => res.data,
  });

  const options = useMemo(() => variantData?.options ?? [], [variantData?.options]);
  const variants = useMemo(() => variantData?.variants ?? [], [variantData?.variants]);

  // Find the variant that matches all selected options
  const matchedVariant = useMemo(() => {
    if (Object.keys(selections).length !== options.length) return null;
    if (options.length === 0) return null;

    return variants.find((v) => {
      // variantCombination is like "صغير / أحمر"
      const parts = v.variantCombination.split('/').map((p) => p.trim());
      return options.every((opt, idx) => {
        const selected = selections[opt.name];
        return selected && parts[idx] === selected;
      });
    }) ?? null;
  }, [selections, options, variants]);

  const getVariantPrice = (variant: ProductVariantDto): number => {
    switch (priceType) {
      case 'half':
        return variant.halfWholesalePrice ?? variant.retailPrice;
      case 'wholesale':
        return variant.wholesalePrice ?? variant.retailPrice;
      default:
        return variant.retailPrice;
    }
  };

  const handleSelect = (optionName: string, value: string) => {
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = () => {
    if (!matchedVariant) return;
    const price = getVariantPrice(matchedVariant);
    onSelect(matchedVariant, price);
    setSelections({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setSelections({});
        onClose();
      }}
      title={`اختر المتغير: ${product.name}`}
      size="md"
    >
      <div dir="rtl" className="space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-10 text-red-400">
            <AlertCircle size={36} />
            <p className="mt-2 text-sm">خطأ في تحميل المتغيرات</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Option selectors */}
            {options.map((option) => (
              <div key={option.id} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {option.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((val) => {
                    const isSelected = selections[option.name] === val.value;
                    return (
                      <button
                        key={val.id}
                        onClick={() => handleSelect(option.name, val.value)}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950',
                        )}
                      >
                        {val.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Matched variant preview */}
            {matchedVariant && (
              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-brand-600 dark:text-brand-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {matchedVariant.displayName || matchedVariant.variantCombination}
                    </span>
                  </div>
                  <Badge variant={matchedVariant.currentStock > 0 ? 'success' : 'danger'}>
                    المخزون: {matchedVariant.currentStock}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-700 dark:text-brand-300">
                    {formatCurrency(getVariantPrice(matchedVariant))}
                  </span>
                  {matchedVariant.barcode && (
                    <span className="text-xs font-mono text-gray-400">
                      {matchedVariant.barcode}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Not all selected hint */}
            {!matchedVariant && Object.keys(selections).length > 0 && Object.keys(selections).length < options.length && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                اختر جميع الخيارات لعرض المتغير
              </p>
            )}

            {/* No match found */}
            {!matchedVariant && Object.keys(selections).length === options.length && options.length > 0 && (
              <p className="text-xs text-red-400 text-center">
                لا يوجد متغير مطابق لهذه الخيارات
              </p>
            )}

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={!matchedVariant || !matchedVariant.isActive || matchedVariant.currentStock <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              <ShoppingCart size={18} />
              إضافة إلى السلة
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
