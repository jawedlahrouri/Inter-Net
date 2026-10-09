import { MailCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MailNoticeProps {
  message?: string;
  className?: string;
}

/**
 * @brief Reusable subtle information banner informing the user that a confirmation email will be sent.
 * @param message Custom message or default explanation.
 * @param className Optional extra CSS classes.
 */
export function MailNotice({
  message = "Un e-mail de confirmation avec lien d'activation vous sera envoyé.",
  className,
}: MailNoticeProps) {
  return (
    <div
      className={cn(
        'p-2.5 rounded-md bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2',
        className
      )}
    >
      <MailCheck className="size-3.5 text-primary shrink-0" />
      <span>{message}</span>
    </div>
  );
}
