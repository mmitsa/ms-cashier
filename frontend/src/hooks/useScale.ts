import { useState, useCallback, useRef, useEffect } from 'react';

// Web Serial API — not yet in lib.dom. Declared as any to avoid build errors on
// browsers/TS libs that don't include the types.
type SerialPort = any;

interface UseScaleOptions {
  port?: string;
  baudRate?: number;
  onWeight?: (weight: number) => void;
}

interface ScaleState {
  weight: number;
  unit: string;
  stable: boolean;
  connected: boolean;
}

/**
 * Hook for connecting to a digital scale via Web Serial API.
 * Supports common protocols: CAS, DIGI, Toledo, Mettler.
 * 
 * Scale data format varies by brand. Common formats:
 * - CAS: "ST,GS,+  0.250kg\r\n"
 * - DIGI: "US,GS,    0.250 kg\r\n"
 * - Toledo: "   0.250 kg\r\n"
 */
export function useScale(options?: UseScaleOptions) {
  const [state, setState] = useState<ScaleState>({
    weight: 0,
    unit: 'kg',
    stable: false,
    connected: false,
  });
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const connect = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        console.warn('Web Serial API not supported. Use Chrome or Edge.');
        return false;
      }

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: options?.baudRate || 9600 });
      portRef.current = port;

      setState((s) => ({ ...s, connected: true }));

      // Read loop
      const reader = port.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      const decoder = new TextDecoder();

      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Look for line endings
            const lines = buffer.split(/[\r\n]+/);
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                const parsed = parseScaleData(line);
                if (parsed) {
                  setState((s) => ({
                    ...s,
                    weight: parsed.weight,
                    unit: parsed.unit,
                    stable: parsed.stable,
                  }));
                  options?.onWeight?.(parsed.weight);
                }
              }
            }
          }
        } catch (err) {
          console.error('Scale read error:', err);
        }
      };

      readLoop();
      return true;
    } catch (err) {
      console.error('Scale connection error:', err);
      return false;
    }
  }, [options]);

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      setState({ weight: 0, unit: 'kg', stable: false, connected: false });
    } catch (err) {
      console.error('Scale disconnect error:', err);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}

function parseScaleData(data: string): { weight: number; unit: string; stable: boolean } | null {
  // Try multiple scale formats
  const cleanData = data.trim();

  // CAS / DIGI format: "ST,GS,+  0.250kg" or "US,GS,    0.250 kg"
  const casMatch = cleanData.match(/(ST|US|OL),\w+,\s*([+-]?\s*[\d.]+)\s*(kg|g|lb)/i);
  if (casMatch) {
    return {
      weight: parseFloat(casMatch[2]!.replace(/\s/g, '')),
      unit: casMatch[3]!.toLowerCase(),
      stable: casMatch[1] === 'ST',
    };
  }

  // Simple format: "   0.250 kg" or "0.250"
  const simpleMatch = cleanData.match(/([+-]?\s*[\d.]+)\s*(kg|g|lb)?/i);
  if (simpleMatch) {
    return {
      weight: parseFloat(simpleMatch[1]!.replace(/\s/g, '')),
      unit: simpleMatch[2]?.toLowerCase() || 'kg',
      stable: true,
    };
  }

  return null;
}
