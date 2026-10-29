import { FileText, Users, AlertCircle, CalendarDays, Bug, FlaskConical, ListChecks } from "lucide-react";
import type { ElementType } from "react";

export interface NoteTemplate { label: string; icon: ElementType; content: string; group: "General" | "QA" }

const task = (t: string) => `<li data-type="taskItem" data-checked="false"><p>${t}</p></li>`;

export const NOTE_TEMPLATES: NoteTemplate[] = [
  { group: "General", label: "Blank",         icon: FileText,     content: "" },
  { group: "General", label: "Meeting Notes", icon: Users,        content: "<h2>Meeting Notes</h2><h3>Attendees</h3><p></p><h3>Agenda</h3><p></p><h3>Discussion</h3><p></p><h3>Action Items</h3><p></p>" },
  { group: "General", label: "Daily Standup", icon: CalendarDays, content: "<h2>Daily Standup</h2><h3>Yesterday</h3><p></p><h3>Today</h3><p></p><h3>Blockers</h3><p></p>" },
  { group: "QA",      label: "Bug Report",    icon: AlertCircle,  content: "<h2>Bug Report</h2><h3>Description</h3><p></p><h3>Steps to Reproduce</h3><p></p><h3>Expected Result</h3><p></p><h3>Actual Result</h3><p></p>" },
  {
    group: "QA", label: "Bug Note", icon: Bug,
    content:
      "<h2>Bug Note</h2><p><strong>Ticket:</strong> </p><p><strong>Environment:</strong> </p><p><strong>Browser:</strong> </p><p><strong>Module:</strong> </p>" +
      "<h3>Steps</h3><ol><li><p></p></li></ol><h3>Actual</h3><p></p><h3>Expected</h3><p></p><h3>Evidence</h3><p></p>",
  },
  {
    group: "QA", label: "Test Session", icon: FlaskConical,
    content:
      "<h2>Test Session</h2><p><strong>Ticket:</strong> </p><p><strong>Environment:</strong> </p><p><strong>Time box:</strong> </p>" +
      "<h3>Charter</h3><p>Explore … to find …</p><h3>Notes</h3><p></p><h3>Issues found</h3><p></p><h3>Questions</h3><p></p>",
  },
  {
    group: "QA", label: "Retest Checklist", icon: ListChecks,
    content:
      "<h2>Retest Checklist</h2><p><strong>Ticket:</strong> </p><p><strong>Environment:</strong> </p>" +
      `<ul data-type="taskList">${task("Confirm fix is deployed to the environment")}${task("Reproduce the original steps")}${task("Check the expected result now shows")}${task("Check nearby flows still work")}${task("Capture evidence screenshots")}${task("Comment PASS / FAIL on the ticket")}</ul>` +
      "<h3>Result</h3><p></p>",
  },
];
