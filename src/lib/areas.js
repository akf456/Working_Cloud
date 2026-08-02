import { GraduationCap, Briefcase, Heart } from 'lucide-react';

export const AREAS = {
  school: {
    key: 'school',
    label: 'School',
    singular: 'Course',
    Icon: GraduationCap,
    groupingLabel: 'Courses',
    accent: '#a78bfa',
    tagline: 'Assignments, exams & syllabi',
    gradient: 'from-[#a78bfa] to-[#818cf8]',
    soft: 'bg-violet-50 text-violet-600',
  },
  work: {
    key: 'work',
    label: 'Work',
    singular: 'Project',
    Icon: Briefcase,
    groupingLabel: 'Projects',
    accent: '#38bdf8',
    tagline: 'Meetings, deadlines & projects',
    gradient: 'from-[#7dd3fc] to-[#86efac]',
    soft: 'bg-sky-50 text-sky-600',
  },
  personal: {
    key: 'personal',
    label: 'Family & Personal',
    singular: 'Category',
    Icon: Heart,
    groupingLabel: 'Categories',
    accent: '#f472b6',
    tagline: 'Events, errands & memories',
    gradient: 'from-[#f9a8d4] to-[#fcd34b]',
    soft: 'bg-pink-50 text-pink-600',
  },
};

export const AREA_LIST = Object.values(AREAS);