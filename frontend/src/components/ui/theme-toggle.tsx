import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/context/ThemeContext';

/**
 * @brief Renders a ghost icon button that toggles between light and dark themes with an accessible tooltip.
 * @param className Optional extra CSS classes appended to the toggle button.
 * @return A button showing a Sun icon in dark mode or a Moon icon in light mode, calling toggleTheme on click.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const label = resolvedTheme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={label}
          aria-label={label}
          className={`size-10 min-w-[40px] min-h-[40px] text-muted-foreground hover:text-foreground cursor-pointer ${className || ''}`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-4.5 transition-transform" />
          ) : (
            <Moon className="size-4.5 transition-transform" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default ThemeToggle;
