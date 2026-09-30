import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resendVerificationApi } from '@/services/api';
import { cn } from '@/lib/utils';

export interface MailVerificationAlertProps {
  email: string;
  message?: string;
  variant?: 'destructive' | 'warning' | 'default';
  showResendButton?: boolean;
  onResendSuccess?: (msg: string) => void;
  className?: string;
}

/**
 * @brief Reusable alert banner informing the user that their account is unverified with an optional resend trigger.
 */
export function MailVerificationAlert({
  email,
  message = "Votre compte n'est pas encore activé. Veuillez confirmer votre adresse e-mail.",
  variant = 'warning',
  showResendButton = true,
  onResendSuccess,
  className,
}: MailVerificationAlertProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async () => {
    if (!email || loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await resendVerificationApi(email);
      const successText = res.message || 'Un nouvel e-mail de confirmation vous a été envoyé.';
      setFeedback({ type: 'success', text: successText });
      onResendSuccess?.(successText);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : "Erreur lors de l'envoi de l'e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  const variantStyles = {
    warning: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    destructive: 'bg-destructive/10 border-destructive/25 text-destructive',
    default: 'bg-primary/10 border-primary/25 text-primary',
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border text-xs space-y-2.5 transition-all',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="size-4 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <p className="font-medium leading-relaxed">{message}</p>
          {email && (
            <p className="text-[11px] opacity-80">
              Adresse associée : <span className="font-mono underline">{email}</span>
            </p>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'p-2 rounded text-[11px] flex items-center gap-1.5',
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-destructive/15 text-destructive border border-destructive/30'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-3.5 shrink-0" />
          ) : (
            <AlertCircle className="size-3.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {showResendButton && email && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleResend}
          className="w-full h-8 text-[11px] font-medium cursor-pointer bg-background/50 hover:bg-background/80"
        >
          {loading ? (
            <>
              <Loader2 className="size-3 animate-spin mr-1.5" />
              Envoi en cours...
            </>
          ) : (
            <>
              <RefreshCw className="size-3 mr-1.5" />
              Renvoyer l'e-mail de confirmation
            </>
          )}
        </Button>
      )}
    </div>
  );
}
