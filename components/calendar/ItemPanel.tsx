"use client";
// Read-mostly detail panel for deployments, Kanban cards, to-dos and holidays.

import Link from "next/link";
import { Rocket, SquareKanban, SquareCheck, Flag, Clock, Pencil, ExternalLink } from "lucide-react";
import Linkified from "@/components/Linkified";
import { Deployment, DeploymentStatus, DEPLOYMENT_STATUS_META, DEPLOYMENT_TYPE_META } from "@/lib/deployments";
import { SESSION_LABEL } from "@/lib/jiraDeployCalendar";
import { CalItem } from "./model";
import { fmtLong } from "./dates";
import { HOLIDAYS_SOURCE_NOTE } from "./holidays";
import { timeLabel } from "./ItemRow";
import { ConfirmDelete, JiraChip, SidePanel, btnOutline, lbl, sel } from "./ui";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 items-start text-sm">
      <span className="text-xs text-slate-500 pt-0.5">{label}</span>
      <div className="text-slate-200 min-w-0">{children}</div>
    </div>
  );
}

export default function ItemPanel({ it, h24, jiraBaseUrl, onClose, onEditDeployment, onSaveDeployment, onDeleteDeployment }: {
  it: CalItem;
  h24: boolean;
  jiraBaseUrl?: string;
  onClose: () => void;
  onEditDeployment: (d: Deployment) => void;
  onSaveDeployment: (d: Deployment) => void;
  onDeleteDeployment: (id: string) => void;
}) {
  const icon =
    it.source === "deployment" ? <Rocket size={16} style={{ color: it.hex }} />
    : it.source === "kanban" ? <SquareKanban size={16} style={{ color: it.hex }} />
    : it.source === "todo" ? <SquareCheck size={16} style={{ color: it.hex }} />
    : <Flag size={16} style={{ color: it.hex }} />;

  const d = it.dep;
  return (
    <SidePanel
      title={it.label}
      icon={icon}
      accent={it.hex}
      onClose={onClose}
      footer={d ? (
        <div className="flex items-center gap-2 flex-wrap">
          <ConfirmDelete onConfirm={() => onDeleteDeployment(d.id)} question="Delete deployment?" />
          <div className="flex-1" />
          <button onClick={() => onEditDeployment(d)} className={btnOutline}><Pencil size={12} /> Edit</button>
        </div>
      ) : undefined}
    >
      <div>
        <h3 className={`text-lg font-semibold text-slate-100 leading-snug ${it.muted ? "line-through opacity-70" : ""}`}>{it.title}</h3>
        <p className="mt-1 text-sm text-slate-400 flex items-center gap-1.5"><Clock size={13} /> {fmtLong(it.date)} · {timeLabel(it, h24)}</p>
      </div>

      {d && (
        <>
          <div className="space-y-3">
            <Row label="Release">{d.fixVersion ? <span className="font-semibold">{d.fixVersion}</span> : <span className="text-slate-500">Not set — add it via Edit</span>}</Row>
            <Row label="Session">{DEPLOYMENT_TYPE_META[d.type]?.label ?? d.type}</Row>
            <Row label="Environment">{d.environment || "—"}</Row>
            {d.deployedBy && <Row label="Deployed by">{d.deployedBy}</Row>}
            <Row label="Status">
              <select
                value={d.status}
                onChange={e => onSaveDeployment({ ...d, status: e.target.value as DeploymentStatus })}
                className={`${sel} py-1.5 max-w-[180px]`}
              >
                {Object.entries(DEPLOYMENT_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Row>
          </div>
          <div>
            <p className={lbl}>Tickets ({it.jiraKeys.length})</p>
            {it.jiraKeys.length
              ? <div className="flex flex-wrap gap-1.5">{it.jiraKeys.map(k => <JiraChip key={k} k={k} />)}</div>
              : <p className="text-xs text-slate-500">No ticket keys found. Add them via Edit.</p>}
          </div>
          {d.notes && (
            <div>
              <p className={lbl}>Notes</p>
              <Linkified text={d.notes} className="text-sm text-slate-300 whitespace-pre-wrap break-words" />
            </div>
          )}
          {d.rollbackPlan && (
            <div>
              <p className={lbl}>Rollback plan</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{d.rollbackPlan}</p>
            </div>
          )}
        </>
      )}

      {it.jira && (
        <div className="space-y-3">
          <Row label="Session">
            {it.jira.session
              ? <span className="font-semibold">{SESSION_LABEL[it.jira.session]}</span>
              : <span className="text-slate-500">Not set in the release name</span>}
          </Row>
          <Row label="Release">
            <span className="font-semibold">{it.jira.version}</span>
            {it.jira.released && <span className="ml-2 text-xs text-green-400">Released</span>}
          </Row>
          <Row label="Ticket"><JiraChip k={it.jira.key} /></Row>
          <Row label="Summary">{it.jira.summary || "—"}</Row>
          <Row label="Jira status">{it.jira.status || "—"}</Row>
          {it.jira.issueType && <Row label="Type">{it.jira.issueType}</Row>}
          <Row label="QA PIC">{it.jira.qa?.length ? it.jira.qa.map(q => q.name).join(", ") : <span className="text-slate-500">Not set</span>}</Row>
          {it.jira.assignee && <Row label="Assignee">{it.jira.assignee}</Row>}
          {jiraBaseUrl && (
            <a href={`${jiraBaseUrl.replace(/\/$/, "")}/browse/${encodeURIComponent(it.jira.key)}`} target="_blank" rel="noreferrer" className={btnOutline}>
              <ExternalLink size={12} /> Open in Jira
            </a>
          )}
          <p className="text-xs text-slate-500">From the Jira release calendar (read only). Change the date or session in Jira, then sync.</p>
        </div>
      )}

      {it.card && (
        <div className="space-y-3">
          <Row label="Column">{it.card.columnId}</Row>
          <Row label="Priority">{it.card.priority}</Row>
          {it.card.dueTime && <Row label="Due time">{it.card.dueTime}</Row>}
          {it.jiraKeys.length > 0 && <Row label="Ticket"><div className="flex gap-1.5 flex-wrap">{it.jiraKeys.map(k => <JiraChip key={k} k={k} />)}</div></Row>}
          {it.card.description && <Row label="Notes"><p className="text-slate-300 whitespace-pre-wrap line-clamp-6">{it.card.description}</p></Row>}
          <Link href="/kanban" className={btnOutline}><ExternalLink size={12} /> Open Kanban board</Link>
        </div>
      )}

      {it.todo && (
        <div className="space-y-3">
          <Row label="Priority">{it.todo.priority}</Row>
          {it.todo.labels?.length > 0 && <Row label="Labels">{it.todo.labels.join(", ")}</Row>}
          {it.jiraKeys.length > 0 && <Row label="Ticket"><div className="flex gap-1.5 flex-wrap">{it.jiraKeys.map(k => <JiraChip key={k} k={k} />)}</div></Row>}
          <Link href="/todo" className={btnOutline}><ExternalLink size={12} /> Open To-do</Link>
          <p className="text-xs text-slate-500">To-dos are shown read-only here. Change the due date on the To-do page.</p>
        </div>
      )}

      {it.holiday && (
        <div className="space-y-2 text-sm text-slate-300">
          <p>Malaysian public holiday{it.holiday.replacement ? " (replacement day)" : ""}.</p>
          {it.holiday.approx && <p className="text-amber-400 text-xs">This date follows a lunar calendar and may shift by a day once it is officially announced.</p>}
          <p className="text-xs text-slate-500">{HOLIDAYS_SOURCE_NOTE}</p>
        </div>
      )}
    </SidePanel>
  );
}
