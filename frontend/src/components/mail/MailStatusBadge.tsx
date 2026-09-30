import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resendVerificationApi } from '@/services/api';
import { cn } from '@/lib/utils';

export interface MailStatusBadgeProps {
  isVerified: boolean;
  email?: string;
  showResendAction?: boolean;
  onResendSuccess?: () => void;
  className?: string;
}

/**
 * @brief Renders a status badge indicating whether the email is verified or pending confirmation.
 */
export function MailStatusBadge({
  isVerified,
  email,
  showResendAction = false,
  onResendSuccess,
  className,
}: MailStatusBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      await resendVerificationApi(email);
      setSent(true);
      onResendSuccess?.();
      setTimeout(() => setSent(false), 5000);
    } catch {
      // Ignore network errors in badge helper
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          className
        )}
      >
        <CheckCircle2 className="size-3 shrink-0" />
        <span>Vérifié</span>
      </Badge>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-400 border-amber-500/30 bg-amber-500/10"
      >
        <Clock className="size-3 shrink-0" />
        <span>En attente de confirmation</span>
      </Badge>

      {showResendAction && email && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading || sent}
          onClick={handleResend}
          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {loading ? (
            <Loader2 className="size-2.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="size-2.5 mr-1" />
          )}
          {sent ? 'Envoyé !' : 'Renvoyer'}
        </Button>
      )}
    </div>
  );
}
