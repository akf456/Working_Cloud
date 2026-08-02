import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    course_name: { type: "string" },
    course_code: { type: "string" },
    instructor: { type: "string" },
    semester: { type: "string" },
    topics: { type: "array", items: { type: "string" } },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          due_date: { type: "string", description: "ISO date if available, otherwise empty string" },
          type: { type: "string", enum: ["assignment", "exam", "quiz", "study", "reading", "project", "misc"] },
          description: { type: "string" }
        }
      }
    },
    events: {
      type: "array",
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
      events: Array.isArray(output.events) ? output.events : []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}