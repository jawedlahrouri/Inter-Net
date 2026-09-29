import { Palette, Moon, Sun, Laptop, Check, Sparkles } from 'lucide-react'

interface AppearanceSettingsTabProps {
  theme: 'dark' | 'light' | 'system'
  onSetTheme: (theme: 'dark' | 'light' | 'system') => void
}

/**
 * @brief Renders the appearance settings tab where the user picks the dark, light or system theme.
 * @param theme Currently active theme (dark, light or system) used to highlight the selected card.
 * @param onSetTheme Callback invoked with the chosen theme when a theme card is clicked.
 * @return A heading, three selectable theme cards with the active one highlighted, and an info note about per-page customization.
 */
export function AppearanceSettingsTab({ theme, onSetTheme }: AppearanceSettingsTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Palette className="size-4 text-sky-500" />
          Apparence & Mode Global
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choisissez le mode d'affichage adapté à votre environnement de travail.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onSetTheme('dark')}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
            theme === 'dark'
              ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <Moon className="size-5 text-purple-400" />
            {theme === 'dark' && <Check className="size-4 text-primary" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Thème Sombre</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Contraste optimisé pour les environnements à faible luminosité.
            </p>
          </div>
        </div>

        <div
          onClick={() => onSetTheme('light')}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
            theme === 'light'
              ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <Sun className="size-5 text-amber-500" />
            {theme === 'light' && <Check className="size-4 text-primary" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Thème Clair</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Luminosité maximale pour les pièces éclairées et travail de jour.
            </p>
          </div>
        </div>

        <div
          onClick={() => onSetTheme('system')}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
            theme === 'system'
              ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <Laptop className="size-5 text-sky-500" />
            {theme === 'system' && <Check className="size-4 text-primary" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Système (Auto)</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              S'adapte automatiquement aux préférences globales de votre OS.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-start gap-3">
        <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">
            Personnalisation des couleurs et arrière-plans par page
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vous pouvez désormais personnaliser chaque page de tableau de bord individuellement (couleur primaire, secondaire, ternaire et image de fond avec repli sur la couleur primaire) directement depuis le Dashboard en activant le mode <strong className="text-foreground">« Éditer les widgets »</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppearanceSettingsTab



