import { GraduationCap, Briefcase, Heart, Users } from 'lucide-react';

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
    theme: {},
    typeSuggestions: ['Assignment', 'Exam', 'Quiz', 'Study', 'Reading', 'Project'],
    groupingSuggestions: ['Calculus II', 'Intro to CS', 'English 101', 'Biology Lab', 'World History']
  },
  work: {
    key: 'work',
    label: 'Work',
    singular: 'Project',
    Icon: Briefcase,
    groupingLabel: 'Projects',
    accent: '#334155',
    tagline: 'Meetings, deadlines & projects',
    gradient: 'from-[#475569] to-[#94a3b8]',
    soft: 'bg-slate-100 text-slate-700',
    theme: {
      '--primary': '220 13% 18%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '220 14% 96%',
      '--accent-foreground': '220 13% 18%',
      '--secondary': '220 14% 93%',
      '--secondary-foreground': '220 13% 18%',
      '--ring': '220 13% 30%',
      '--background': '0 0% 100%',
      '--card': '0 0% 100%',
      '--foreground': '220 13% 18%',
      '--muted': '220 14% 96%',
      '--muted-foreground': '220 9% 46%',
      '--border': '220 13% 91%'
    },
    typeSuggestions: ['Project', 'Meeting', 'Deadline', 'Report', 'Review', 'Follow-up', 'Email', 'Prep'],
    groupingSuggestions: ['Project', 'Q3 Launch', 'Client Onboarding', 'Marketing', 'Research', 'Operations']
  },
  personal: {
    key: 'personal',
    label: 'Personal',
    singular: 'Category',
    Icon: Heart,
    groupingLabel: 'Categories',
    accent: '#0d9488',
    tagline: 'Events, errands & memories',
    gradient: 'from-[#5eead4] to-[#86efac]',
    soft: 'bg-teal-50 text-teal-600',
    theme: {
      '--primary': '168 58% 42%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '162 70% 92%',
      '--accent-foreground': '168 58% 28%',
      '--secondary': '162 60% 95%',
      '--secondary-foreground': '168 40% 25%',
      '--ring': '168 58% 42%'
    },
    customizable: true,
    typeSuggestions: ['Groceries', 'Errands', 'Health', 'Home', 'Family', 'Fitness', 'Finances', 'Hobby'],
    groupingSuggestions: ['Health', 'Home', 'Finances', 'Family', 'Fitness', 'Travel', 'Hobby']
  },
  shareable: {
    key: 'shareable',
    label: 'Shareable',
    singular: 'Group',
    Icon: Users,
    groupingLabel: 'Groups',
    accent: '#f97316',
    tagline: 'Groups, family & shared plans',
    gradient: 'from-[#fb923c] to-[#fcd34b]',
    soft: 'bg-orange-50 text-orange-600',
    theme: {
      '--primary': '14 80% 60%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '36 90% 93%',
      '--accent-foreground': '20 80% 38%',
      '--secondary': '40 80% 95%',
      '--secondary-foreground': '20 60% 30%',
      '--ring': '14 80% 60%',
      '--background': '40 50% 99%',
      '--card': '0 0% 100%',
      '--foreground': '20 30% 25%',
      '--muted': '40 44% 96%',
      '--muted-foreground': '20 12% 48%',
      '--border': '30 30% 90%'
    },
    typeSuggestions: ['Chore', 'Group task', 'Planning', 'Event', 'Supply run', 'Coordination', 'Reminder'],
    groupingSuggestions: ['Family', 'Roommates', 'Group Trip', 'Event Committee', 'Chores', 'Shared Expenses']
  }
};

export const AREA_LIST = Object.values(AREAS);