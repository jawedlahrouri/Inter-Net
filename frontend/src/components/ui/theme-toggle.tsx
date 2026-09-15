import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={resolvedTheme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
      aria-label="Basculer le thème"
      className={`size-10 min-w-[40px] min-h-[40px] text-muted-foreground hover:text-foreground cursor-pointer ${className || ''}`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="size-4.5 transition-transform" />
      ) : (
        <Moon className="size-4.5 transition-transform" />
      )}
    </Button>
  );
}

export default ThemeToggle;
