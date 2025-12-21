import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, settings } = useSettings();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-[hsl(var(--status-sent))]' : 'bg-[hsl(var(--status-rejected))]'
            )}
          />
          {isConnected ? (
            <Wifi className="h-4 w-4 text-muted-foreground" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isConnected ? `Connected to ${settings.baseUrl}` : 'Unable to connect to backend'}</p>
      </TooltipContent>
    </Tooltip>
  );
};