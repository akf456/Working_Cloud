import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Users, Trash2, MessageCircle, Settings as SettingsIcon, LayoutGrid, LogOut } from 'lucide-react';

export default function MoreSheet({ open, onClose, area, onNavigate, onAreas, onLogout }) {
  const items = [
    { label: 'Contacts', Icon: Users, onClick: () => { onClose(); onNavigate('/contacts'); } },
    { label: 'Trash', Icon: Trash2, onClick: () => { onClose(); onNavigate('/trash'); } },
  ];
  if (area === 'shareable') {
    items.push({ label: 'Encouragement', Icon: MessageCircle, onClick: () => { onClose(); onNavigate('/encourage'); } });
  }
  items.push({ label: 'Settings', Icon: SettingsIcon, onClick: () => { onClose(); onNavigate('/settings'); } });

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="text-center"><DrawerTitle>More</DrawerTitle></DrawerHeader>
        <div className="px-3 pb-[env(safe-area-inset-bottom,0px)] overflow-y-auto max-h-[65vh] scrollbar-hide">
          {items.map((it) => (
            <button key={it.label} type="button" onClick={it.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm min-h-[44px] hover:bg-accent transition">
              <it.Icon className="w-5 h-5 text-muted-foreground" /> {it.label}
            </button>
          ))}
          <div className="my-2 border-t border-border/60" />
          <button type="button" onClick={() => { onClose(); onAreas(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm min-h-[44px] hover:bg-accent transition">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" /> All areas
          </button>
          <button type="button" onClick={() => { onClose(); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm min-h-[44px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
            <LogOut className="w-5 h-5" /> Log out
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}