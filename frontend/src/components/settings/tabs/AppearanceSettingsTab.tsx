import { Palette, Moon, Sun, Laptop, Check } from 'lucide-react'

interface AppearanceSettingsTabProps {
  theme: 'dark' | 'light' | 'system'
  onSetTheme: (theme: 'dark' | 'light' | 'system') => void
}

export function AppearanceSettingsTab({ theme, onSetTheme }: AppearanceSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Palette className="size-4 text-sky-500" />
          Apparence & Thème
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choisissez le mode d'affichage adapté à votre environnement de travail.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mode Sombre */}
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

        {/* Mode Clair */}
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

        {/* Mode Système */}
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
    </div>
  )
}

