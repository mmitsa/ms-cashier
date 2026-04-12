import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeScnnerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxDelay?: number;  // max ms between keystrokes for barcode scanner
}

/**
 * Hook to capture barcode scanner input.
 * Barcode scanners typically type rapidly and end with Enter.
 * This differentiates scanner input from keyboard typing.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 4,
  maxDelay = 50,
}: UseBarcodeScnnerOptions) {
  const bufferRef = useRef('');
  const lastKeystrokeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if focus is on an input/textarea (unless it's our dedicated barcode input)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isBarcodeInput = target.getAttribute('data-barcode-input') === 'true';
      
      if (isInput && !isBarcodeInput) return;

      const now = Date.now();
      const timeSinceLast = now - lastKeystrokeRef.current;
      lastKeystrokeRef.current = now;

      // If too much time passed, start a new buffer
      if (timeSinceLast > maxDelay) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }

      // Only allow printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Auto-clear buffer after timeout
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, maxDelay * 3);
    },
    [onScan, enabled, minLength, maxDelay]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleKeyDown, enabled]);
}
