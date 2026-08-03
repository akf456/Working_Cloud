import React from 'react';
import { Pencil, Cloud, Sun } from 'lucide-react';

export default function WorkingCloudLogo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 font-heading font-bold leading-none ${className}`}>
      <Sun className="w-[1em] h-[1em] text-amber-400 shrink-0" />
      Work
      <Pencil className="w-[1.1em] h-[1.1em] text-foreground -rotate-12" />
      ng
      <span className="ml-1.5">Cloud</span>
      <Cloud className="w-[1em] h-[1em] text-sky-400 shrink-0" />
    </span>
  );
}