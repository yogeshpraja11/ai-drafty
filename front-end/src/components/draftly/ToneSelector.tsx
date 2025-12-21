import { ToneType } from '@/types/draft';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

interface ToneSelectorProps {
  value: ToneType;
  onChange: (tone: ToneType) => void;
  disabled?: boolean;
}

const toneOptions: { value: ToneType; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Professional and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'professional', label: 'Professional', description: 'Balanced and appropriate' },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-[hsl(var(--draftly-ai))]" />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select tone" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {toneOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};