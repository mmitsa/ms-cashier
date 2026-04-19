import { Loader2 } from 'lucide-react';
import { useCurrentShift } from './api';
import { OpenShiftModal } from './components/OpenShiftModal';

interface ShiftGuardWrapperProps {
  children: React.ReactNode;
  /**
   * If true, children are rendered (blurred) behind the blocking open-shift modal.
   * If false (default), children are hidden until a shift is open.
   */
  showBackground?: boolean;
}

/**
 * Blocks its children until the current user has an open cashier shift.
 * Shows a full-screen OpenShiftModal overlay that cannot be dismissed.
 */
export function ShiftGuardWrapper({ children, showBackground = true }: ShiftGuardWrapperProps) {
  const { data: shift, isLoading } = useCurrentShift();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 size={28} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const hasOpenShift = !!shift && (shift.status === 'Open' || !shift.closedAt);

  if (hasOpenShift) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full w-full">
      {showBackground && (
        <div className="pointer-events-none select-none opacity-30 blur-sm h-full w-full overflow-hidden">
          {children}
        </div>
      )}
      <OpenShiftModal open blocking />
    </div>
  );
}
