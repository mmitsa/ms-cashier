import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'mpos-install-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  return (
    <div className="bg-gradient-to-l from-brand-600 to-brand-500 text-white px-4 py-2 flex items-center justify-between gap-3 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Download size={16} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">تثبيت التطبيق</p>
          <p className="text-xs text-white/80">ثبّت MPOS على جهازك للوصول السريع والعمل بدون إنترنت</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="px-4 py-1.5 bg-white text-brand-700 font-bold rounded-lg text-xs hover:bg-brand-50 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download size={13} />
          {installing ? 'جارٍ التثبيت...' : 'تثبيت'}
        </button>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition"
          title="إغلاق"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
