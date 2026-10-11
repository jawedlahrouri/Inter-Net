import { useState, useEffect } from 'react';
import {
  MailCheck,
  Loader2,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resendVerificationApi } from '@/services/api';
import { cn } from '@/lib/utils';

export interface MailConfirmationCardProps {
  email: string;
  onBackToLogin?: () => void;
  onResend?: (email: string) => Promise<void>;
  title?: string;
  description?: string;
  subNotice?: string;
  backLabel?: string;
  showWebmailLinks?: boolean;
  className?: string;
}

/**
 * @brief Reusable card component prompting the user to check their email for account verification.
 */
export function MailConfirmationCard({
  email,
  onBackToLogin,
  onResend,
  title = 'Vérifiez votre boîte mail',
  description,
  subNotice = "Pour débloquer votre accès à l'application, vous devez cliquer sur le bouton de confirmation présent dans cet e-mail.",
  backLabel = 'Retour à la page de connexion',
  showWebmailLinks = true,
  className,
}: MailConfirmationCardProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Decrement resend cooldown timer every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || resendLoading || cooldown > 0) return;
    setResendLoading(true);
    setFeedback(null);
    try {
      if (onResend) {
        await onResend(email);
      } else {
        const res = await resendVerificationApi(email);
        setFeedback({
          type: 'success',
          message: res.message || 'Un nouvel e-mail de confirmation vous a été envoyé.',
        });
      }
      setCooldown(30);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : "Erreur lors de l'envoi de l'e-mail.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto border border-border/80 bg-card rounded-lg shadow-xs', className)}>
      <CardHeader className="text-center pb-3 pt-6 space-y-2">
        <div className="size-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
          <MailCheck className="size-6 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          {description || (
            <>
              Un e-mail de confirmation a été envoyé à <strong className="text-foreground font-mono">{email}</strong>.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2 space-y-4">
        {subNotice && (
          <div className="p-3 rounded-md bg-muted/60 border border-border/80 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Accès restreint temporairement</p>
            <p>{subNotice}</p>
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              'p-2.5 rounded-md border text-xs flex items-center gap-2',
              feedback.type === 'success'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            )}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {showWebmailLinks && (
          <div className="pt-1">
            <div className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Inbox className="size-3" />
              <span>Accès rapide à votre messagerie :</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-border/60 bg-muted/20 hover:bg-muted/50 text-foreground transition-colors"
              >
                <span>Gmail</span>
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
              <a
                href="https://outlook.live.com"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-border/60 bg-muted/20 hover:bg-muted/50 text-foreground transition-colors"
              >
                <span>Outlook</span>
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={resendLoading || cooldown > 0}
            onClick={handleResend}
            className="w-full h-9 text-xs font-medium cursor-pointer"
          >
            {resendLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="size-3.5 mr-2 opacity-50" />
                Renvoyer disponible dans {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5 mr-2" />
                Renvoyer l'e-mail de confirmation
              </>
            )}
          </Button>

          {onBackToLogin && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="size-3.5 mr-2" />
              {backLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
