import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { onlineStoreApi } from '@/lib/api/endpoints';

const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fZWpvcHR2eXx+f4GBgYGBgIB/fn17eXd1c3FvbWtpZ2VjYWBfXl1dXV1dXl9gYWNlZ2lrb3Fzdnl7fn+BgYGBgYGAfn58enh2dHJwbmxqaGZkYmBfXl1dXV1dXV5fYGFjZWdpbG5wcnV3ent9f4GBgYGBgYB+fXt5d3VzcXBubGpoZmRiYF9eXV1dXV1eXl9gYmRmaGpsbm9ydXd5fH5/gYGBgYGAf359e3l3dXNxb21raWdlY2FgX15dXV1dXV5fYGFjZWdpa2xucHJ1d3l8fn+BgYGBgYB/fn17eXd1c3FwbmxqaGZkYmFgX15dXV1dXl5fYGJkZmhqa2xucHJ1d3p8fn+BgYGBgYB/fn17eXd1c3FwbmxqaGZkYmFgX15dXV1dXl5fYGJkZmhqbG5wcnV3enx+f4GBgYGBgH9+fXt5d3VzcXBubGpoZmRiYWBfXl1dXV1eXl9gYmRmaGpsbm9ydXd5fH5/gYGBgYGAf359e3l3dXNxcG5samhmZGJhYF9eXV1dXV5eX2BiZGZoamxub3J1d3l8fn+BgYGBgYB/fn17eXd1c3FwbmxqaGZkYmFgX15dXV1dXl5fYGJkZmhqbG5vcnV3eXx+f4GBgYGBgH9+fXt5d3VzcXBubGpoZmRiYWBfXl1dXV1eXl9gYmRmaGpsbm9ydXd5fH5/gYGBgYGAf359e3l3dXNxcG5samhmZGJhYF9eXV1dXV5eX2BiZGZoamxub3J1d3l8fn+BgYGBgYB/fn17eXd1c3FwbmxqaGZkYmFgX15dXV1dXl5fYA==';

export function useOnlineOrderNotification() {
  const lastCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.7;
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore audio errors
    }
  }, []);

  const { data } = useQuery({
    queryKey: ['online-store-pending-orders'],
    queryFn: () => onlineStoreApi.getOrders({ status: 1, page: 1, pageSize: 1 }),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  useEffect(() => {
    if (!data?.data) return;
    const currentCount = data.data.totalCount ?? 0;

    if (lastCountRef.current !== null && currentCount > lastCountRef.current) {
      const newOrders = currentCount - lastCountRef.current;
      playSound();
      toast(`${newOrders === 1 ? 'طلب جديد' : `${newOrders} طلبات جديدة`} من المتجر الإلكتروني`, {
        icon: '🛒',
        duration: 5000,
        style: {
          background: '#059669',
          color: '#fff',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          direction: 'rtl',
        },
      });
    }

    lastCountRef.current = currentCount;
  }, [data, playSound]);

  return {
    pendingCount: data?.data?.totalCount ?? 0,
  };
}
