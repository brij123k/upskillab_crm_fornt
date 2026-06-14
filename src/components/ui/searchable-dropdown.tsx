import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export interface Option {
  value: string;
  label: string;
  [key: string]: any;
}

interface SearchableDropdownProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showSearch?: boolean;
  allowClear?: boolean;
  onClear?: () => void;
  showBadge?: boolean;
}

export function SearchableDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  showSearch = true,
  allowClear = false,
  onClear,
  showBadge = true,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();

    return options.filter(option => {
      if (!option) return false;

      if (option.label && typeof option.label === 'string' &&
        option.label.toLowerCase().includes(query)) {
        return true;
      }

      if (option.value && typeof option.value === 'string' &&
        option.value.toLowerCase().includes(query)) {
        return true;
      }

      if (option.role) {
        if (typeof option.role === 'string' &&
          option.role.toLowerCase().includes(query)) {
          return true;
        } else if (typeof option.role === 'object' && option.role !== null) {
          if (option.role.name && typeof option.role.name === 'string' &&
            option.role.name.toLowerCase().includes(query)) {
            return true;
          }
        }
      }

      if (option.empId && typeof option.empId === 'string' &&
        option.empId.toLowerCase().includes(query)) {
        return true;
      }

      if (option.email && typeof option.email === 'string' &&
        option.email.toLowerCase().includes(query)) {
        return true;
      }

      for (const key in option) {
        if (
          key !== 'value' &&
          key !== 'label' &&
          key !== 'role' &&
          key !== 'empId' &&
          key !== 'email' &&
          option[key] &&
          typeof option[key] === 'string' &&
          option[key].toLowerCase().includes(query)
        ) {
          return true;
        }
      }

      return false;
    });
  }, [options, searchQuery]);

  const selectedOption = useMemo(() => {
    if (!value || !options || !Array.isArray(options)) return undefined;
    return options.find(option => option && option.value === value);
  }, [options, value]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClear) {
      onClear();
    } else {
      onValueChange("");
    }
    setSearchQuery("");
  };

  const getRoleName = (option: Option): string => {
    if (!option || !option.role) return '';

    if (typeof option.role === 'string') {
      return option.role.trim();
    }

    if (typeof option.role === 'object' && option.role !== null && option.role.name) {
      return String(option.role.name).trim();
    }

    return '';
  };

  const getRoleColor = (roleName: string): string => {
    const role = roleName.toLowerCase();
    if (role.includes('admin') || role.includes('super')) return 'bg-indigo-50 text-indigo-700';
    if (role.includes('manager')) return 'bg-blue-50 text-blue-700';
    if (role.includes('lead')) return 'bg-emerald-50 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-10 px-3 py-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-colors",
            !selectedOption && "text-slate-400",
            triggerClassName,
            className
          )}
        >
          <div className="flex flex-col items-start w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 w-full">
              {selectedOption ? (
                <>
                  <span className="truncate font-medium text-left text-slate-700">
                    {selectedOption.label || 'Unnamed'}
                  </span>
                  {showBadge && selectedOption.role && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs py-0 px-2 h-5 flex-shrink-0 truncate max-w-[120px] rounded-lg font-medium",
                        getRoleColor(getRoleName(selectedOption))
                      )}
                    >
                      {getRoleName(selectedOption)}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="truncate text-slate-400">{placeholder}</span>
              )}
            </div>
            {selectedOption && (selectedOption.empId || selectedOption.value) && (
              <span className="text-xs text-slate-400 truncate w-full text-left mt-0.5">
                ID: {selectedOption.empId || selectedOption.value}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {allowClear && value && selectedOption && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-lg hover:bg-slate-100"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X className="h-3 w-3 text-slate-400" />
              </Button>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-full p-0 rounded-xl border-slate-200 shadow-lg", contentClassName)}
        align="start"
        sideOffset={4}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <Command shouldFilter={false} className="rounded-xl overflow-hidden">
          {showSearch && (
            <div className="flex items-center border-b border-slate-100 px-3 py-2 bg-slate-50/50 sticky top-0 z-10">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9 border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 text-slate-700"
                autoFocus
              />
            </div>
          )}

          <div
            className="max-h-[280px] overflow-auto"
            style={{
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto',
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <CommandList>
              <CommandGroup>
                {filteredOptions.length === 0 ? (
                  <div className="py-12 text-center">
                    <CommandEmpty className="text-slate-400 px-4 text-sm">
                      {emptyMessage}
                    </CommandEmpty>
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const roleName = getRoleName(option);
                    const isSelected = value === option.value;

                    return (
                      <CommandItem
                        key={option.value || index}
                        value={option.value || ''}
                        onSelect={(currentValue) => {
                          onValueChange(currentValue === value ? "" : currentValue);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "px-4 py-3 rounded-lg cursor-pointer my-1 mx-1 transition-colors",
                          isSelected && "bg-indigo-50 text-indigo-700",
                          !isSelected && "hover:bg-slate-50"
                        )}
                        disabled={!option.value || !option.label}
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 flex-shrink-0 transition-opacity",
                              isSelected ? "opacity-100 text-indigo-600" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col w-full min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "font-medium truncate",
                                isSelected ? "text-indigo-700" : "text-slate-700"
                              )}>
                                {option.label || 'Unnamed'}
                              </span>
                              {showBadge && roleName && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs py-0 px-2 h-5 flex-shrink-0 rounded-lg font-medium",
                                    getRoleColor(roleName)
                                  )}
                                >
                                  {roleName}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {option.empId && (
                                <span className="font-mono truncate">
                                  ID: {option.empId}
                                </span>
                              )}
                              {option.email && (
                                <span className="truncate" title={option.email}>
                                  {option.email}
                                </span>
                              )}
                              {!option.empId && !option.email && option.value && (
                                <span className="font-mono truncate">
                                  ID: {option.value}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SimpleSearchableDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  disabled = false,
}: {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <SearchableDropdown
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
      showBadge={false}
      className="rounded-xl"
    />
  );
}