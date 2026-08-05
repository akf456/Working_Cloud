import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const EXTRACTION_SCHEMA = {
  type: "object",
  description: "Extract structured planning data from a syllabus, schedule, district calendar, or any planning document. Capture every task, deadline, holiday, school break, important date, scheduled class/lecture/lab/meeting time, and every contact mentioned.",
  properties: {
    course_name: { type: "string", description: "Name of the course or project, if any. Empty for district/org-wide calendars." },
    course_code: { type: "string", description: "Course code, e.g. MATH 152. Empty if none." },
    instructor: { type: "string", description: "Primary instructor or owner, if any." },
    semester: { type: "string", description: "Term/semester or academic year, e.g. '2026-2027'." },
    topics: { type: "array", items: { type: "string" }, description: "Topics or themes covered." },
    tasks: {
      type: "array",
      description: "One-off tasks, assignments, deadlines, and important milestones. Include trimester/semester end dates, report card dates, preparation days, and promotional activities as tasks with appropriate due_dates. Do NOT put recurring scheduled meetings here.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short descriptive title, e.g. '1st Trimester Ends', 'Report Cards Mailed', 'Spring Promotion'." },
          due_date: { type: "string", description: "ISO datetime. For a specific date, use that date at 08:00:00. Use empty string if unknown." },
          type: { type: "string", enum: ["assignment", "exam", "quiz", "study", "reading", "project", "lecture", "office_hours", "lab", "misc"], description: "Use 'misc' for school milestones, 'exam' for exam dates." },
          description: { type: "string", description: "Any extra details or notes from the document relevant to this task." },
          repeat: { type: "string", enum: ["none", "daily", "weekly", "monthly"] },
          repeat_days: { type: "array", items: { type: "integer" } },
          repeat_start_date: { type: "string" },
          repeat_end_date: { type: "string" }
        }
      }
    },
    events: {
      type: "array",
      description: "Calendar events. Include ALL of the following as events: (1) Legal and local holidays — each as a separate all_day=true holiday event. (2) School/district closures and breaks (Thanksgiving Break, Winter Recess, Spring Recess) — as all_day=true events, use repeat=daily with repeat_start_date and repeat_end_date to span multi-day breaks. (3) One-off events: Back to School Night, Open House, Parent-Teacher Conferences, Professional Development days, First/Last Day of Instruction. (4) Recurring scheduled class/meeting times as weekly-repeating events. Include the notes from the document in the description field.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title, e.g. 'Independence Day', 'Thanksgiving Break', 'Back to School Night', 'Parent-Teacher Conference'." },
          start_date: { type: "string", description: "ISO datetime of the first occurrence or the event date (e.g. 2026-07-04T00:00:00 for holidays, 2026-09-09T17:00:00 for an evening event with a known time). For daily-repeat school breaks, the start date of the break." },
          end_date: { type: "string", description: "ISO datetime of the end. For all_day events spanning multiple days, set this to the LAST day of the range. For single-day events, same as start_date." },
          all_day: { type: "boolean", description: "true for holidays, breaks, closures, and full-day events. false for timed events like Back to School Night or meetings with a specific time." },
          type: { type: "string", enum: ["exam", "deadline", "class", "study", "event", "holiday"], description: "Use 'holiday' for legal/local holidays and school closures. Use 'event' for Back to School Night, Open House, Parent-Teacher Conference, Professional Development. Use 'class' for lectures/class times." },
          location: { type: "string", description: "Room, building, or link if present, else empty." },
          description: { type: "string", description: "Include any relevant notes from the document, e.g. release times, minimum day info, trimester dates, etc." },
          repeat: { type: "string", enum: ["none", "daily", "weekly", "monthly"], description: "Use 'daily' for multi-day breaks/closures (Thanksgiving Break, Winter Recess) so they span every day of the break. Use 'weekly' for recurring class/meeting times. Use 'none' for one-off events and single-day holidays." },
          repeat_days: { type: "array", items: { type: "integer" }, description: "For weekly repeats only. 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat. Empty for daily/none." },
          repeat_start_date: { type: "string", description: "ISO date start of repeat range. Required for daily/weekly repeats." },
          repeat_end_date: { type: "string", description: "ISO date end of repeat range. Required for daily/weekly repeats." }
        }
      }
    },
    contacts: {
      type: "array",
      description: "Every person or office mentioned in the document.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          office_location: { type: "string" },
          office_hours: { type: "string" },
          class_times: { type: "string" }
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