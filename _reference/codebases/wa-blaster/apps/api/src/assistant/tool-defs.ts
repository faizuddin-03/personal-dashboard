// apps/api/src/assistant/tool-defs.ts
import type { ToolDef } from './assistant.types';

export const SYSTEM_PROMPT = `You are the campaign assistant for a single-tenant WhatsApp marketing system for a Malaysian car-dealer business. Time zone is Asia/Kuala_Lumpur.

Your job: turn the operator's request into ONE call to propose_plan. You may first call the read tools to gather facts. You MUST NOT invent template names, segment ids, or dates — get them from the tools.

Rules:
- Reuse vs create: if the operator wants an existing template, use search_templates and set template.mode="reuse". If they want a new message, set template.mode="create" and write a concise marketing body using {{1}}, {{2}} placeholders.
- Always resolve relative dates ("Monday morning") with resolve_datetime; never guess an ISO string yourself.
- Always pick the audience via search_audience; use the returned segmentId.
- variableMapping maps each "{{n}}" to a contact field (e.g. {"1":"contact.name"}).
- If you cannot determine the audience or date, ask the operator a short clarifying question instead of calling propose_plan.
- Call propose_plan exactly once when you have everything.`;

export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'search_templates',
    description: 'Find APPROVED WhatsApp templates whose name matches the query. Use for the reuse path.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'keywords, e.g. a car model' } },
      required: ['query'],
    },
  },
  {
    name: 'search_audience',
    description: 'Find contact segments (audiences) by name, with recipient counts.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'e.g. "dealers"' } },
      required: ['query'],
    },
  },
  {
    name: 'resolve_datetime',
    description: 'Convert a natural-language date/time phrase into a concrete Kuala Lumpur ISO timestamp.',
    parameters: {
      type: 'object',
      properties: { phrase: { type: 'string', description: 'e.g. "Monday morning"' } },
      required: ['phrase'],
    },
  },
  {
    name: 'get_template_variables',
    description: 'List the {{n}} variables a named template expects.',
    parameters: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'propose_plan',
    description: 'Submit the final campaign plan for human approval. Call this exactly once when ready.',
    parameters: {
      type: 'object',
      properties: {
        intent: { type: 'string', enum: ['reuse_and_schedule', 'create_and_schedule'] },
        campaignName: { type: 'string' },
        template: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['reuse', 'create'] },
            name: { type: 'string' },
            category: { type: 'string', enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'] },
            languages: { type: 'array', items: { type: 'string' } },
            bodyText: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
          },
          required: ['mode', 'name'],
        },
        audience: { type: 'object', properties: { segmentId: { type: 'string' } }, required: ['segmentId'] },
        defaultLanguage: { type: 'string', enum: ['EN', 'MS', 'ZH', 'TA', 'OTHER'] },
        variableMapping: { type: 'object', additionalProperties: { type: 'string' } },
        schedule: { type: 'object', properties: { sendAt: { type: 'string' } }, required: ['sendAt'] },
      },
      required: ['intent', 'campaignName', 'template', 'audience', 'defaultLanguage', 'schedule'],
    },
  },
];

export const PROPOSE_PLAN = 'propose_plan';
export const MAX_ITERATIONS = 5;
