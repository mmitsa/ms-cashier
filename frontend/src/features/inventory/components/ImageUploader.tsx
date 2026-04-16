import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type ImageUploaderProps = {
  /** Current saved image URL (from the server) */
  currentImageUrl?: string | null;
  /** Called when user picks a file (for immediate upload in edit mode) */
  onFileSelect?: (file: File) => void;
  /** Called when user clicks delete on an existing server image */
  onDelete?: () => void;
  /** Whether an upload/delete mutation is in progress */
  isPending?: boolean;
  /** Controlled preview from parent (for create mode before save) */
  previewUrl?: string | null;
  /** Called when the local preview is cleared (create mode) */
  onPreviewClear?: () => void;
};

export function ImageUploader({
  currentImageUrl,
  onFileSelect,
  onDelete,
  isPending = false,
  previewUrl: controlledPreview,
  onPreviewClear,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const preview = controlledPreview ?? localPreview;
  const displayUrl = preview || currentImageUrl || null;

  // Clean up local object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_SIZE_BYTES) {
        toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        // Reset the input so user can re-select
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      const url = URL.createObjectURL(file);
      setLocalPreview(url);
      onFileSelect?.(file);

      // Reset the input value so re-selecting the same file works
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFileSelect],
  );

  const handleDelete = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    if (controlledPreview) {
      onPreviewClear?.();
    }
    if (currentImageUrl) {
      onDelete?.();
    }
  }, [localPreview, controlledPreview, currentImageUrl, onDelete, onPreviewClear]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative group w-full h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={displayUrl}
            alt="صورة المنتج"
            className="w-full h-full object-cover"
          />
          {/* Overlay for change/delete */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
              className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
              title="تغيير الصورة"
            >
              <Camera size={18} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
              title="حذف الصورة"
            >
              <X size={18} />
            </button>
          </div>
          {isPending && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer"
        >
          <Camera size={28} />
          <span className="text-sm font-medium">اضغط لإضافة صورة</span>
        </button>
      )}
    </div>
  );
}
