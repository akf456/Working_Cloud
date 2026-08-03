import { base44 } from '@/api/base44Client';

export async function toggleTaskStatus(task) {
  const next = task.status === 'done' ? 'todo' : 'done';
  await base44.entities.Task.update(task.id, { status: next });
  if (next === 'done' && task.repeat && task.repeat !== 'none') {
    const base = task.due_date ? new Date(task.due_date) : new Date();
    const due = new Date(base);
    if (task.repeat === 'daily') due.setDate(due.getDate() + 1);
    else if (task.repeat === 'weekly') due.setDate(due.getDate() + 7);
    else if (task.repeat === 'monthly') due.setMonth(due.getMonth() + 1);
    await base44.entities.Task.create({
      title: task.title,
      description: task.description || '',
      due_date: due.toISOString(),
      priority: task.priority || 'medium',
      status: 'todo',
      type: task.type || 'misc',
      course_id: task.course_id || null,
      source: task.source || 'manual',
      area: task.area,
      repeat: task.repeat
    });
  }
}