import * as React from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  loading = false,
  disabled = false,
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const displayValue = selected.length > 0
    ? `${selected.length} selected`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled || loading}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length > 0 ? (
              <>
                {selected.slice(0, maxDisplay).map((value) => {
                  const option = options.find((opt) => opt.value === value);
                  return option ? (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="mr-1 mb-1"
                    >
                      {option.label}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={(e) => handleRemove(value, e)}
                      />
                    </Badge>
                  ) : null;
                })}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="mb-1">
                    +{selected.length - maxDisplay} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}