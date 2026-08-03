import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const EXTRACTION_SCHEMA = {
  type: "object",
  description: "Extract structured planning data from a syllabus, schedule, or any planning document. Capture every task, deadline, scheduled class/lecture/lab time, office hours, and every contact mentioned (professors, instructors, TAs, advisors, managers, clients, doctors, etc.).",
  properties: {
    course_name: { type: "string", description: "Name of the course or project, if any." },
    course_code: { type: "string", description: "Course code, e.g. MATH 152. Empty if none." },
    instructor: { type: "string", description: "Primary instructor or owner, if any." },
    semester: { type: "string", description: "Term/semester or date range, e.g. Fall 2026." },
    topics: { type: "array", items: { type: "string" }, description: "Topics or themes covered." },
    tasks: {
      type: "array",
      description: "All tasks, deadlines, and SCHEDULED RECURRING items. Model recurring class times, lectures, labs, and office hours as weekly-repeating tasks (repeat=weekly) so they appear on every occurrence day.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title, e.g. 'Lecture', 'Office Hours', 'Problem set 4'." },
          due_date: { type: "string", description: "ISO datetime. For recurring items, the datetime of the FIRST occurrence (include the time of day, e.g. 2026-08-04T10:00:00). For one-off items, the due datetime. Use empty string if unknown." },
          type: { type: "string", enum: ["assignment", "exam", "quiz", "study", "reading", "project", "lecture", "office_hours", "lab", "misc"], description: "Use 'lecture' for class/lecture times, 'office_hours' for office hours, 'lab' for lab sessions." },
          description: { type: "string", description: "Any extra details." },
          repeat: { type: "string", enum: ["none", "daily", "weekly", "monthly"], description: "Use 'weekly' for scheduled class times, lectures, labs, and office hours that occur on specific weekdays over a date range. Use 'none' for one-off assignments and exams." },
          repeat_days: { type: "array", items: { type: "integer" }, description: "For weekly repeats: weekday numbers 0=Sunday,1=Monday,2=Tuesday,3=Wednesday,4=Thursday,5=Friday,6=Saturday. Example: [1,3,5] = Mon/Wed/Fri. Empty array for non-weekly." },
          repeat_start_date: { type: "string", description: "ISO date for the start of the recurring period (e.g. 2026-08-03). For weekly repeats only; empty otherwise." },
          repeat_end_date: { type: "string", description: "ISO date for the end of the recurring period (e.g. 2026-08-21). For weekly repeats only; empty otherwise." }
        }
      }
    },
    events: {
      type: "array",
      description: "One-off calendar events (a single exam, holiday, meeting). Do NOT include recurring class times here — those go in tasks with repeat=weekly.",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          start_date: { type: "string", description: "ISO datetime if available, otherwise empty string" },
          end_date: { type: "string", description: "ISO datetime if available, otherwise empty string" },
          all_day: { type: "boolean" },
          type: { type: "string", enum: ["exam", "deadline", "class", "study", "event", "holiday"] },
          location: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    contacts: {
      type: "array",
      description: "EVERY person mentioned in the document: professors, instructors, TAs, advisors, managers, clients, doctors, family contacts, etc. Do not skip anyone named.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name." },
          role: { type: "string", description: "Their role/title, e.g. 'Professor', 'TA', 'Advisor', 'Manager', 'Client', 'Doctor'." },
          email: { type: "string", description: "Email address if present, else empty." },
          phone: { type: "string", description: "Phone number if present, else empty." },
          office_location: { type: "string", description: "Office or location if present, else empty." },
          office_hours: { type: "string", description: "Office hours as written, e.g. 'Mon 2-4pm'. Empty if none." },
          class_times: { type: "string", description: "Class/meeting times as written, e.g. 'MWF 10-11am'. Empty if none." }
        }
      }
    }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_url } = body;
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: EXTRACTION_SCHEMA
    });

    if (result.status !== 'success') {
      return Response.json({ error: result.details || 'Extraction failed' }, { status: 422 });
    }

    const output = result.output || {};
    return Response.json({
      course_name: output.course_name || '',
      course_code: output.course_code || '',
      instructor: output.instructor || '',
      semester: output.semester || '',
      topics: Array.isArray(output.topics) ? output.topics : [],
      tasks: Array.isArray(output.tasks) ? output.tasks : [],
      events: Array.isArray(output.events) ? output.events : [],
      contacts: Array.isArray(output.contacts) ? output.contacts : []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}