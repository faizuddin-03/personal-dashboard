import { NextRequest, NextResponse } from "next/server";

interface AdfNode {
  type: string;
  attrs?: Record<string, string>;
  content?: AdfNode[];
  text?: string;
}

function hasMention(node: AdfNode, accountId: string): boolean {
  if (node.type === "mention" && node.attrs?.id === accountId) return true;
  return (node.content ?? []).some(n => hasMention(n, accountId));
}

function extractText(node: AdfNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "mention") return node.attrs?.text ?? "";
  return (node.content ?? []).map(extractText).join("");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseUrl  = searchParams.get("baseUrl");
  const email    = searchParams.get("email");
  const apiToken = searchParams.get("apiToken");

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const token   = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const base    = baseUrl.replace(/\/$/, "");
  const headers = { Authorization: `Basic ${token}`, Accept: "application/json" };

  // 1. Get current user's accountId
  const meRes  = await fetch(`${base}/rest/api/3/myself`, { headers });
  const meData = await meRes.json();
  const accountId: string = meData.accountId;
  if (!accountId) {
    return NextResponse.json({ error: "Could not resolve current user" }, { status: 401 });
  }

  // 2. JQL: issues where the current user is mentioned
  const searchRes = await fetch(`${base}/rest/api/3/search/jql`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      jql: "mention = currentUser() ORDER BY updated DESC",
      maxResults: 20,
      fields: ["summary", "updated"],
    }),
  });
  const searchData = await searchRes.json();
  if (!searchRes.ok) {
    return NextResponse.json({ error: searchData.errorMessages?.[0] ?? "JQL failed" }, { status: searchRes.status });
  }

  type RawIssue = { key: string; fields: { summary: string } };
  const issues: RawIssue[] = searchData.issues ?? [];
  if (issues.length === 0) return NextResponse.json({ mentions: [], accountId });

  // 3. Fetch comments for each issue in parallel, filter for user mentions
  const mentionsByIssue = await Promise.all(
    issues.map(async (issue) => {
      try {
        const cr = await fetch(
          `${base}/rest/api/3/issue/${issue.key}/comment?orderBy=created&maxResults=50`,
          { headers }
        );
        const cd = await cr.json();
        type RawComment = {
          id: string;
          body: AdfNode;
          author: { accountId: string; displayName: string; avatarUrls: { "24x24": string } };
          created: string;
        };
        const comments: RawComment[] = cd.comments ?? [];
        return comments
          .filter(c => c.author.accountId !== accountId && hasMention(c.body, accountId))
          .map(c => ({
            issueKey:      issue.key,
            issueSummary:  issue.fields.summary,
            commentId:     c.id,
            commenterName: c.author.displayName,
            commenterAvatar: c.author.avatarUrls["24x24"] ?? "",
            snippet:       extractText(c.body).slice(0, 300),
            created:       c.created,
            issueUrl:      `${base}/browse/${issue.key}`,
          }));
      } catch {
        return [];
      }
    })
  );

  const mentions = mentionsByIssue
    .flat()
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  return NextResponse.json({ mentions, accountId });
}
