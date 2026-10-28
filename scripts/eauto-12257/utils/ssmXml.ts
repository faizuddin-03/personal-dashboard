// SSM submission XML helpers — ported from Azila's EAINT-12341 robot
// (src/data/ssm.ts clonePeople, src/data/ssm-seed.ts rebrand / forceTags).
// The person block is never invented: the donor's FIRST person block is
// repeated once per person and only the IC and name are changed.

export type SsmType = 'ROC' | 'ROB' | 'LLP';

/** Column (form field name) that carries the people, per type. */
export const PEOPLE_FIELD: Record<SsmType, string> = { ROC: 'page3', ROB: 'currentOwnerInfo', LLP: 'involvements' };

/** Column carrying the company identity tags, per type (LLP: none forced). */
export const PROFILE_FIELD: Partial<Record<SsmType, string>> = { ROC: 'page1', ROB: 'businessInfo' };

/** eSIM guide: ROC Page 3 `<IC>` dashed; ROB `<IC_NEW>` plain. LLP uses cloneLlpPeople() (`<involveId>`). */
const IC_TAGS: Record<SsmType, string[]> = {
  ROC: ['IC'],
  ROB: ['IC_NEW'],
  LLP: ['involveId'],
};
const NAME_TAG = /^(NAME|[A-Z_]*_NAME)$/;

export interface Person { name: string; ic: string }

/** 030217141005 → 030217-14-1005 for ROC; plain 12 digits otherwise. */
export function icFor(type: SsmType, ic: string): string {
  const d = ic.replace(/\D/g, '');
  return type === 'ROC' && d.length === 12 ? `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8)}` : d;
}

function blockAround(xml: string, at: number): { tag: string; start: number; end: number } | null {
  const opens = [...xml.slice(0, at).matchAll(/<([A-Za-z_][\w.-]*)(\s[^>]*)?>/g)];
  for (let i = opens.length - 1; i >= 0; i--) {
    const m = opens[i];
    const tag = m[1];
    const closedEarly = xml.indexOf(`</${tag}>`, m.index!);
    if (closedEarly !== -1 && closedEarly < at) continue;
    const close = xml.indexOf(`</${tag}>`, at);
    if (close === -1) continue;
    return { tag, start: m.index!, end: close + tag.length + 3 };
  }
  return null;
}

/**
 * LLP `involvements` (eSIM row #2, 12153_TS04 trace 2026-10-23): one
 * `<involvement id='N'>` per person, role in `<involveType>` (`CO` Compliance
 * Officer / `PT` Partner), name `<involveName>`, IC `<involveId>` (12 digits,
 * `<involveIdType>01</involveIdType>` = NRIC). Only PT counts. The donor's
 * first PT block is repeated once per person; every CO block is kept and
 * given the first person (row #2 has one person in both roles).
 */
function cloneLlpPeople(donorXml: string, people: Person[], where: string): string {
  const blocks = [...donorXml.matchAll(/<involvement(\s[^>]*)?>[\s\S]*?<\/involvement>/g)];
  if (!blocks.length) throw new Error(`${where}: no <involvement> block in the donor record.`);
  const role = (b: string) => /<involveType>\s*([A-Z]+)\s*<\/involveType>/.exec(b)?.[1] ?? '';
  const template = blocks.map(m => m[0]).find(b => role(b) === 'PT');
  if (!template) throw new Error(`${where}: the donor has no <involveType>PT</involveType> (Partner) block to copy.`);
  const set = (xml: string, tag: string, value: string) => xml.replace(new RegExp(`(<${tag}>)[^<]*(</${tag}>)`), `$1${value}$2`);
  const asPerson = (b: string, p: Person) => set(set(b, 'involveName', p.name), 'involveId', icFor('LLP', p.ic));
  const out = [
    ...blocks.map(m => m[0]).filter(b => role(b) === 'CO').map(b => asPerson(b, people[0])),
    ...people.map(p => asPerson(template, p)),
  ].map((b, i) => b.replace(/^<involvement(\s[^>]*)?>/, `<involvement id='${i}'>`));
  const first = blocks[0].index!;
  const last = blocks[blocks.length - 1];
  const sep = blocks.length > 1 ? donorXml.slice(blocks[0].index! + blocks[0][0].length, blocks[1].index!) : '\n';
  return donorXml.slice(0, first) + out.join(sep) + donorXml.slice(last.index! + last[0].length);
}

/** Rewrite the people in a donor column. Throws when the donor has no person block. */
export function clonePeople(donorXml: string, people: Person[], type: SsmType, where: string): string {
  if (!donorXml.trim()) throw new Error(`${where}: the donor record is empty — nothing to copy the people from.`);
  if (type === 'LLP') return cloneLlpPeople(donorXml, people, where);
  const icTag = IC_TAGS[type].find(t => donorXml.includes(`<${t}>`));
  if (!icTag) throw new Error(`${where}: no ${IC_TAGS[type].map(t => `<${t}>`).join(' / ')} in the donor record.`);
  let person = blockAround(donorXml, donorXml.indexOf(`<${icTag}>`));
  while (person && person.tag === icTag) person = blockAround(donorXml, person.start);
  if (!person) throw new Error(`${where}: could not find the element around <${icTag}>.`);

  const template = donorXml.slice(person.start, person.end);
  const siblings = [...donorXml.matchAll(new RegExp(`<${person.tag}(\\s[^>]*)?>[\\s\\S]*?</${person.tag}>`, 'g'))];
  const first = siblings[0].index!;
  const last = siblings[siblings.length - 1];
  const lastEnd = last.index! + last[0].length;
  const nameTag = [...template.matchAll(/<([A-Z_]+)>[^<]*<\/\1>/g)].map(m => m[1]).find(t => NAME_TAG.test(t)) ?? null;
  const set = (xml: string, tag: string, value: string) => xml.replace(new RegExp(`(<${tag}>)[^<]*(</${tag}>)`), `$1${value}$2`);
  const blocks = people.map(p => {
    let b = set(template, icTag, icFor(type, p.ic));
    if (nameTag) b = set(b, nameTag, p.name);
    return b;
  });
  const sep = siblings.length > 1 ? donorXml.slice(siblings[0].index! + siblings[0][0].length, siblings[1].index!) : '\n';
  return donorXml.slice(0, first) + blocks.join(sep) + donorXml.slice(lastEnd);
}

/** Swap the donor's own ROC / new ROC / name out of a cloned column. */
export function rebrand(value: string, donor: { roc: string; newRoc: string; companyName: string }, to: { roc: string; newRoc: string; companyName: string }): string {
  let out = value;
  for (const [from, rep] of [[donor.newRoc, to.newRoc], [donor.roc, to.roc], [donor.companyName, to.companyName]]) {
    const f = String(from ?? '').trim();
    if (f.length >= 4) out = out.split(f).join(rep);
  }
  return out;
}

/** Force the tags the eSIM guide requires (REF_NO with the check letter, status EXISTING / ACTIVE). */
export function forceTags(xml: string, tags: Record<string, string>, where: string, warnings: string[]): string {
  let out = xml;
  for (const [tag, value] of Object.entries(tags)) {
    const re = new RegExp(`(<${tag}>)[\\s\\S]*?(</${tag}>)`, 'g');
    if (!re.test(out)) { warnings.push(`${where} has no <${tag}> — left as cloned.`); continue; }
    out = out.replace(re, `$1${value}$2`);
  }
  return out;
}
