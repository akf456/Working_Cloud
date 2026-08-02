import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, Clock, BookOpen, Users } from 'lucide-react';
import ContactModal, { CONTACT_ROLE } from '@/components/ContactModal';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);

  async function load() {
    setLoading(true);
    const [c, cr] = await Promise.all([
      base44.entities.Contact.list('-created_date', 200),
      base44.entities.Course.list()
    ]);
    setContacts(c); setCourses(cr);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  async function save(data) {
    if (data.id) await base44.entities.Contact.update(data.id, data);
    else await base44.entities.Contact.create(data);
    setEdit(null); load();
  }
  async function remove(id) { await base44.entities.Contact.delete(id); load(); }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Professors, TAs, advisors — office hours, class times & details in one place.</p>
        </div>
        <Button onClick={() => { setEdit(null); setModal(true); }} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New contact</Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted/60 animate-pulse" />)}</div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Users className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No contacts yet.</p>
          <p className="text-sm mt-1">Add professors and TAs to keep their office hours handy.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => {
            const course = courseMap[c.course_id];
            const role = CONTACT_ROLE[c.role] || CONTACT_ROLE.other;
            return (
              <Card key={c.id} className="group p-4 hover:shadow-md transition relative">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-semibold shrink-0">
                    {(c.name || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{role.label}{course ? ` · ${course.code || course.name}` : ''}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEdit(c); setModal(true); }} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  {c.office_hours && <Row Icon={Clock} text={c.office_hours} tint="text-emerald-600" />}
                  {c.class_times && <Row Icon={BookOpen} text={c.class_times} tint="text-indigo-600" />}
                  {c.office_location && <Row Icon={MapPin} text={c.office_location} tint="text-rose-600" />}
                  {c.email && <Row Icon={Mail} text={c.email} tint="text-sky-600" link={`mailto:${c.email}`} />}
                  {c.phone && <Row Icon={Phone} text={c.phone} tint="text-amber-600" link={`tel:${c.phone}`} />}
                  {c.notes && <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">{c.notes}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ContactModal open={modal} onClose={() => { setModal(false); setEdit(null); }} onSave={save} contact={edit} courses={courses} />
    </div>
  );
}

function Row({ Icon, text, tint, link }) {
  const inner = (
    <span className="flex items-center gap-2 min-w-0">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${tint}`} />
      <span className="truncate text-xs">{text}</span>
    </span>
  );
  return link ? <a href={link} className="hover:underline block">{inner}</a> : inner;
}