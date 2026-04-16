import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type InlineEditCellProps = {
  value: string;
  displayValue?: string;
  onSave: (value: string) => void;
  isPending?: boolean;
  type?: 'text' | 'number';
  step?: string;
  min?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  scannerMode?: boolean;
  emptyDisplay?: string;
  dangerWhenZero?: boolean;
};

export function InlineEditCell({
  value,
  displayValue,
  onSave,
  isPending,
  type = 'text',
  step,
  min,
  placeholder,
  className,
  inputClassName,
  scannerMode = false,
  emptyDisplay = '\u2014',
  dangerWhenZero = false,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const keystrokeTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSubmit, handleCancel],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setEditValue(newVal);

      if (scannerMode) {
        const now = Date.now();
        keystrokeTimestamps.current.push(now);

        if (keystrokeTimestamps.current.length > 6) {
          const oldest = keystrokeTimestamps.current[keystrokeTimestamps.current.length - 7] ?? now;
          const elapsed = now - oldest;
          if (elapsed < 150) {
            setTimeout(() => {
              const val = inputRef.current?.value ?? newVal;
              if (val.trim() !== value) {
                onSave(val.trim());
              }
              setEditing(false);
            }, 50);
          }
        }

        // Cleanup old timestamps
        if (keystrokeTimestamps.current.length > 20) {
          keystrokeTimestamps.current = keystrokeTimestamps.current.slice(-10);
        }
      }
    },
    [scannerMode, value, onSave],
  );

  if (isPending) {
    return (
      <span className={cn('flex items-center gap-1', className)}>
        <Loader2 size={14} className="animate-spin text-brand-500" />
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        step={step}
        min={min}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={placeholder}
        className={cn(
          'w-full max-w-[120px] px-2 py-1 text-sm rounded-lg border border-brand-300 dark:border-brand-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500',
          inputClassName,
        )}
      />
    );
  }

  const isZero = dangerWhenZero && (Number(value) === 0 || !value);
  const shown = displayValue || value || emptyDisplay;

  return (
    <button
      type="button"
      onClick={() => {
        setEditValue(value);
        keystrokeTimestamps.current = [];
        setEditing(true);
      }}
      className={cn(
        'text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors text-right',
        isZero && 'text-red-600 dark:text-red-400 font-semibold',
        className,
      )}
      title="انقر للتعديل"
    >
      {shown}
    </button>
  );
}
