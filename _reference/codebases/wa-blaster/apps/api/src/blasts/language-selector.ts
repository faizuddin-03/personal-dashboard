type TemplateRow = {
  id: string;
  language: string;
  status: string;
};

/**
 * Pick the best Template row to send to a contact.
 * Priority: contact's preferred language (if APPROVED) -> default language (if APPROVED) -> null.
 */
export function selectTemplateRow<T extends TemplateRow>(
  group: T[],
  contactLanguage: string,
  defaultLanguage: string,
): T | null {
  const approved = group.filter((r) => r.status === 'APPROVED');
  return (
    approved.find((r) => r.language === contactLanguage) ??
    approved.find((r) => r.language === defaultLanguage) ??
    null
  );
}
