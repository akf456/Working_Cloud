import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';

export default function SheetSelect({ value, onValueChange, options, placeholder, className }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)}
        className={`flex min-h-[44px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ${className || ''}`}>
        <span className={current ? '' : 'text-muted-foreground'}>{current?.label || placeholder || 'Select'}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHeader className="text-center"><DrawerTitle>{placeholder || 'Select'}</DrawerTitle></DrawerHeader>
        <div className="px-3 pb-[env(safe-area-inset-bottom,0px)] overflow-y-auto max-h-[60vh] scrollbar-hide">
          {options.map((o) => (
            <button key={o.value} type="button"
              onClick={() => { onValueChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-sm min-h-[44px] flex items-center transition ${o.value === value ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}