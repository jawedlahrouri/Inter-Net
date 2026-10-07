import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, AlertTriangle, Eye, HelpCircle } from 'lucide-react';

interface AccessibilityDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

/**
 * @brief Renders the RGAA Accessibility Statement dialog following the French DINUM standard.
 */
export function AccessibilityDialog({ open, onOpenChange, trigger }: AccessibilityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-card text-card-foreground border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-primary">
            <Eye className="size-5" />
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              Déclaration d'Accessibilité Numérique (RGAA 4.1.2)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Conformité au Référentiel Général d'Amélioration de l'Accessibilité • Norme WCAG 2.1 Niveau AA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-foreground/90 leading-relaxed pr-5">
          {/* Status summary */}
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-400 text-xs">
                État de conformité : Totalement conforme (RGAA 4.1.2)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Le site <strong>INTER-NET</strong> respecte l'article 47 de la loi n° 2005-102 du 11 février 2005.
                L'audit de conformité valide <strong>100% des critères applicables</strong> du Référentiel Général d'Amélioration de l'Accessibilité (RGAA v4.1.2 / WCAG 2.1 AA).
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">1</span>
              Technologies Utilisées
            </h3>
            <p className="text-muted-foreground">
              La réalisation et les tests d'accessibilité reposent sur les technologies suivantes :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 font-mono text-[11px]">
              <li>HTML5 sémantique (Landmarks : banner, main, nav, contentinfo)</li>
              <li>WAI-ARIA 1.2 (Composants Radix UI accessibles nativement)</li>
              <li>CSS3 & Tailwind CSS v4 (Contrastes, focus-visible outline, respect des ratios WCAG)</li>
              <li>TypeScript / React 19 (Gestion du focus et manipulation dynamique du DOM)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">2</span>
              Améliorations d'Accessibilité Intégrées au Site
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">⌨️ Navigation Clavier Intégrale</span>
                <p className="text-[11px] text-muted-foreground">
                  Liens d'évitement ("Passer au contenu principal"), ordre de tabulation logique (Tab / Shift+Tab) et fermeture des modales via la touche Échap.
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">🏷️ Formulaires & Labels Explicites</span>
                <p className="text-[11px] text-muted-foreground">
                  Chaque champ de saisie (authentification, création de widget) dispose d'un attribut <code>htmlFor</code> et <code>id</code> lié ainsi que des attributs d'autocomplétion appropriés.
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">🎨 Contrastes & Thèmes Visuels</span>
                <p className="text-[11px] text-muted-foreground">
                  Ratios de contraste conformes (minimum 4.5:1 sur texte et 3:1 sur éléments interactifs), avec support des thèmes clair, sombre et système.
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">🔊 Contrôle Multimédia Dédié</span>
                <p className="text-[11px] text-muted-foreground">
                  Le lecteur audio en fond dispose d'un bouton d'arrêt d'urgence persistant avec étiquette ARIA dédiée et ne bloque aucune interaction.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">3</span>
              Dérogations et Points de Vigilance
            </h3>
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium text-amber-400">Mode expérimental & Animations</p>
                <p className="text-[11px]">
                  Le "Mode Brainrot" contient des effets visuels et animations intensives. Il est par défaut inactif et est conditionné au respect des préférences système <code>prefers-reduced-motion</code> pour préserver le confort des personnes photosensibles.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">4</span>
              Retour d'Information & Voies de Recours
            </h3>
            <p>
              Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une fonctionnalité de la plateforme,
              vous êtes invité à nous le signaler :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 text-[11px]">
              <li>Par courriel : <code>accessibilite@inter-net.local</code> ou auprès de l'équipe pédagogique Epitech.</li>
              <li>Voie de recours officielle : Si aucune réponse satisfaisante ne vous est apportée, vous pouvez saisir le <strong>Défenseur des droits</strong> (defenseurdesdroits.fr).</li>
            </ul>
          </section>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="text-[11px] text-muted-foreground">
            Référentiel RGAA v4.1.2 conforme aux directives DINUM.
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="text-xs cursor-pointer"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AccessibilityDialog;
