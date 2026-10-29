type ContactLike = {
  id: string;
  phoneE164: string;
  name: string | null;
  city?: string | null;
  state?: string | null;
  ethnicity?: string;
  gender?: string;
  attributes?: Record<string, unknown>;
};

export type VariableMapping = Record<string, string>; // { "1": "contact.name", "2": "literal:Premium" }

export function resolveValue(source: string, contact: ContactLike): string {
  if (source.startsWith('literal:')) return source.slice('literal:'.length);

  if (source.startsWith('contact.attributes.')) {
    const key = source.slice('contact.attributes.'.length);
    const raw = contact.attributes?.[key];
    return raw == null ? '' : String(raw);
  }

  if (source.startsWith('contact.')) {
    const key = source.slice('contact.'.length);
    const raw = (contact as Record<string, unknown>)[key];
    return raw == null ? '' : String(raw);
  }

  return '';
}

interface RenderTemplateFn {
  (body: string, mapping: VariableMapping, contact: ContactLike): string;
  toComponents(
    variableNumbers: string[],
    mapping: VariableMapping,
    contact: ContactLike,
  ): Array<{ type: 'body'; parameters: Array<{ type: 'text'; text: string }> }>;
}

export const renderTemplate: RenderTemplateFn = ((body: string, mapping: VariableMapping, contact: ContactLike): string => {
  return body.replace(/\{\{(\d+)\}\}/g, (_, num: string) => {
    const source = mapping[num];
    if (!source) return '';
    return resolveValue(source, contact);
  });
}) as RenderTemplateFn;

renderTemplate.toComponents = function (variableNumbers, mapping, contact) {
  if (variableNumbers.length === 0) return [];
  return [
    {
      type: 'body',
      parameters: variableNumbers.map((num) => ({
        type: 'text' as const,
        text: resolveValue(mapping[num] ?? '', contact),
      })),
    },
  ];
};
