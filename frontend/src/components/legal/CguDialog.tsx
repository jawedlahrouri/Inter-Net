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
import { FileText, ShieldCheck, Scale, ExternalLink } from 'lucide-react';

interface CguDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

/**
 * @brief Renders the Terms of Service (CGU) dialog modal accessible across the application.
 */
export function CguDialog({ open, onOpenChange, trigger }: CguDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-card text-card-foreground border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="size-5" />
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              Conditions Générales d'Utilisation (CGU)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Plateforme INTER-NET • Version 1.0 • Dernière mise à jour : Octobre 2026
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-foreground/90 leading-relaxed pr-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">1</span>
              Préambule & Mentions Légales
            </h3>
            <p>
              La plateforme <strong>INTER-NET</strong> est une application web de tableau de bord modulaire personnalisable,
              développée dans le cadre du cursus pour le projet Epitech Tek3 (Module WEB-500).
            </p>
            <p className="text-muted-foreground">
              Le service permet l'agrégation, la configuration et la visualisation en temps réel de flux de données et services tiers
              (Météo, Flux RSS, Steam Web API, GitHub REST API, endpoints JSON personnalisés et raccourcis web).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">2</span>
              Acceptation et Opposabilité des CGU
            </h3>
            <p>
              L'accès et l'utilisation de la plateforme impliquent l'acceptation pleine, entière et sans réserve des présentes Conditions Générales d'Utilisation.
              Toute création de compte ou navigation continue sur le site vaut acceptation expresse des présentes stipulations.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">3</span>
              Accès au Service et Sécurité du Compte
            </h3>
            <p>
              Pour accéder aux fonctionnalités de personnalisation et de gestion des tableaux de bord, l'utilisateur doit créer un compte
              en fournissant une adresse e-mail valide, un identifiant unique et un mot de passe robuste.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>L'utilisateur est seul responsable de la conservation confidentielle de ses identifiants.</li>
              <li>Les mots de passe sont hachés de manière sécurisée (algorithme bcrypt) avant tout enregistrement.</li>
              <li>Une procédure de validation par courriel (via serveur SMTP) est requise pour certifier l'authenticité du compte.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">4</span>
              Utilisation des Services et Intégrations Tierces
            </h3>
            <p>
              La plateforme intègre des services externes via des connecteurs dédiés et des microservices répliqués :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li><strong>Open-Meteo :</strong> Données météorologiques fournies à titre indicatif.</li>
              <li><strong>Flux RSS :</strong> L'utilisateur est seul responsable de la légalité et de la pertinence des flux externes qu'il configure.</li>
              <li><strong>Steam Web API :</strong> Récupération des données publiques de profils de jeu (heures de jeu, succès, bibliothèque). Nécessite un profil public.</li>
              <li><strong>GitHub API :</strong> Consultation d'indicateurs de dépôts et organisations via token personnel ou requêtes authentifiées.</li>
              <li><strong>Custom API (JSON) :</strong> L'utilisateur s'engage à ne pas configurer d'URLs pointant vers des réseaux privés internes illicites ou malveillants (interdiction de SSRF).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">5</span>
              Médias Personnalisés et Fichiers Téléversés
            </h3>
            <p>
              L'application permet d'importer des images de fond personnalisées ainsi que des fichiers audio pour le lecteur d'ambiance.
              L'utilisateur garantit détenir l'intégralité des droits d'auteur et licences nécessaires sur les fichiers importés et s'interdit
              tout envoi de contenu illicite, diffamatoire ou contrefaisant.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">6</span>
              Supervision et Droits des Administrateurs
            </h3>
            <p>
              Les administrateurs désignés disposent d'un droit de supervision technique et de modération sur les tableaux de bord et widgets
              afin de prévenir tout abus, violation des présentes conditions ou risque pour la sécurité de l'infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">7</span>
              Protection des Données Personnelles (RGPD)
            </h3>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li><strong>Finalités :</strong> Authentification, maintien des sessions utilisateur, persistance des configurations de tableaux de bord.</li>
              <li><strong>Données collectées :</strong> Identifiant, adresse email, mot de passe haché, configurations de widgets.</li>
              <li><strong>Aucune revente commerciale :</strong> Aucune donnée personnelle n'est transmise, vendue ou louée à des tiers à des fins publicitaires.</li>
              <li><strong>Vos droits :</strong> Vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles sur simple demande via l'interface ou auprès des administrateurs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">8</span>
              Limitation de Responsabilité
            </h3>
            <p>
              La plateforme est fournie « en l'état » (as is). L'équipe pédagogique et les développeurs ne sauraient être tenus pour responsables
              des interruptions de service causées par des tiers (pannes des API Steam, GitHub, flux RSS distants), ni des pertes éventuelles de configurations.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">9</span>
              Droit Applicable
            </h3>
            <p>
              Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence
              exclusive des juridictions françaises.
            </p>
          </section>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="text-[11px] text-muted-foreground">
            Document juridique consultable à tout moment.
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="text-xs cursor-pointer"
          >
            J'ai compris et j'accepte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CguDialog;
