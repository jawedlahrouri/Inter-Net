import { ShieldAlert, ArrowLeft, Sliders, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSupervisionBannerProps {
  targetUsername: string;
  targetEmail: string;
  targetDashboardName: string;
  onExitSupervision: () => void;
  onOpenDashboardSettings?: () => void;
}

export function AdminSupervisionBanner({
  targetUsername,
  targetEmail,
  targetDashboardName,
  onExitSupervision,
  onOpenDashboardSettings,
}: AdminSupervisionBannerProps) {
  return (
    <aside aria-label="Bandeau de supervision" className="w-full bg-gradient-to-r from-violet-950/90 via-purple-900/90 to-violet-950/90 border-b border-violet-500/40 text-violet-100 px-6 py-2.5 shadow-lg backdrop-blur-md sticky top-14 z-30 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs">
        <div className="size-6 rounded-md bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
          <ShieldAlert className="size-3.5" />
        </div>
        <div>
          <span className="font-semibold uppercase tracking-wider text-[10px] text-violet-300">
            Supervision Administrateur
          </span>
          <p className="text-violet-100">
            Vous visualisez le tableau de bord de{' '}
            <strong className="text-white font-medium">@{targetUsername}</strong> ({targetEmail}) — Page :{' '}
            <span className="underline decoration-violet-400 underline-offset-2 font-medium">
              {targetDashboardName}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onOpenDashboardSettings && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDashboardSettings}
            className="h-7 text-xs gap-1.5 bg-violet-900/50 border-violet-500/50 text-violet-200 hover:bg-violet-800/60 hover:text-white cursor-pointer"
          >
            <Sliders className="size-3" />
            <span>Gérer les widgets & styles</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={onExitSupervision}
          className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer shadow-md"
        >
          <ArrowLeft className="size-3" />
          <span>Quitter la supervision</span>
        </Button>
      </div>
    </aside>
  );
}
