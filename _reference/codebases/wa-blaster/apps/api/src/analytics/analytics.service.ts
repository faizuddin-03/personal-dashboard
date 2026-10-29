import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Range, rate, rangeDays, klDayKey, lastNDayKeys, pctDelta } from './analytics.util';

const DEFAULT_COST_PER_MESSAGE_RM = 0.08;
const SPARK_DAYS = 12;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private since(range: Range, now = new Date()): Date {
    return new Date(now.getTime() - rangeDays(range) * 86_400_000);
  }

  private prevWindow(range: Range, now = new Date()): { start: Date; end: Date } {
    const days = rangeDays(range);
    const end = new Date(now.getTime() - days * 86_400_000);
    return { start: new Date(end.getTime() - days * 86_400_000), end };
  }

  async delivery(range: Range) {
    const since = this.since(range);
    const [sent, delivered, read, replied] = await Promise.all([
      this.prisma.message.count({ where: { sentAt: { gte: since } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, deliveredAt: { not: null } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, readAt: { not: null } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, repliedAt: { not: null } } }),
    ]);

    const msgs = await this.prisma.message.findMany({ where: { sentAt: { gte: since } }, select: { contactId: true, deliveredAt: true } });
    const contactIds = [...new Set((msgs as any[]).map((m) => m.contactId))];
    const contacts = await this.prisma.contact.findMany({ where: { id: { in: contactIds } }, select: { id: true, state: true, vehicleSpecialization: true } });
    const cmap = new Map(contacts.map((c: any) => [c.id, c]));
    const stateAgg = new Map<string, { sent: number; delivered: number }>();
    const vehAgg = new Map<string, { sent: number; delivered: number }>();
    for (const m of msgs as any[]) {
      const c: any = cmap.get(m.contactId);
      if (!c) continue;
      if (c.state) {
        const a = stateAgg.get(c.state) ?? { sent: 0, delivered: 0 };
        a.sent++; if (m.deliveredAt) a.delivered++; stateAgg.set(c.state, a);
      }
      if (c.vehicleSpecialization) {
        const a = vehAgg.get(c.vehicleSpecialization) ?? { sent: 0, delivered: 0 };
        a.sent++; if (m.deliveredAt) a.delivered++; vehAgg.set(c.vehicleSpecialization, a);
      }
    }
    const byState = [...stateAgg].map(([state, a]) => ({ state, rate: rate(a.delivered, a.sent) })).sort((x, y) => y.rate - x.rate);
    const byVehicle = [...vehAgg].map(([vehicle, a]) => ({ vehicle, rate: rate(a.delivered, a.sent) })).sort((x, y) => y.rate - x.rate);

    const [sentByTpl, repliedByTpl] = await Promise.all([
      this.prisma.message.groupBy({ by: ['templateId'], where: { sentAt: { gte: since }, templateId: { not: null } }, _count: { _all: true } }),
      this.prisma.message.groupBy({ by: ['templateId'], where: { sentAt: { gte: since }, templateId: { not: null }, repliedAt: { not: null } }, _count: { _all: true } }),
    ]);
    const repliedMap = new Map((repliedByTpl as any[]).map((g) => [g.templateId, g._count._all]));
    const tplIds = (sentByTpl as any[]).map((g) => g.templateId).filter(Boolean);
    const tpls = await this.prisma.template.findMany({ where: { id: { in: tplIds } }, select: { id: true, name: true, language: true } });
    const tmap = new Map((tpls as any[]).map((t) => [t.id, t]));
    const topTemplates = (sentByTpl as any[])
      .map((g) => {
        const sentN = g._count._all;
        const repliedN = repliedMap.get(g.templateId) ?? 0;
        const t: any = tmap.get(g.templateId);
        return { templateId: g.templateId, name: t?.name ?? 'unknown', language: t?.language ?? 'EN', sent: sentN, replied: repliedN, replyRate: rate(repliedN, sentN) };
      })
      .sort((a, b) => b.replyRate - a.replyRate)
      .slice(0, 5);

    return { funnel: { sent, delivered, read, replied }, byState, byVehicle, topTemplates };
  }

  async volume(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const rows = await this.prisma.message.findMany({
      where: { sentAt: { gte: since } },
      select: { sentAt: true, deliveredAt: true, repliedAt: true },
    });
    const keys = lastNDayKeys(rangeDays(range), now);
    const map = new Map(keys.map((k) => [k, { date: k, sent: 0, delivered: 0, replied: 0 }]));
    for (const r of rows as any[]) {
      if (!r.sentAt) continue;
      const b = map.get(klDayKey(r.sentAt));
      if (!b) continue;
      b.sent++; if (r.deliveredAt) b.delivered++; if (r.repliedAt) b.replied++;
    }
    return { byDay: keys.map((k) => map.get(k)!) };
  }

  async autopilot(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const events = await this.prisma.autopilotEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { action: true, intent: true, createdAt: true },
    });
    let autoReplied = 0, escalated = 0;
    const intentCounts = new Map<string, number>();
    const keys = lastNDayKeys(rangeDays(range), now);
    const trendMap = new Map(keys.map((k) => [k, { auto: 0, total: 0 }]));
    for (const e of events as any[]) {
      if (e.action === 'AUTO_REPLIED') autoReplied++;
      if (e.action === 'ESCALATED') escalated++;
      if (e.intent) intentCounts.set(e.intent, (intentCounts.get(e.intent) ?? 0) + 1);
      const t = trendMap.get(klDayKey(e.createdAt));
      if (t) { t.total++; if (e.action === 'AUTO_REPLIED') t.auto++; }
    }
    const resolvedByTeam = await this.prisma.ticket.count({
      where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { gte: since } },
    });
    return {
      autoHandleRate: rate(autoReplied, events.length),
      trend: keys.map((k) => { const t = trendMap.get(k)!; return { date: k, rate: rate(t.auto, t.total) }; }),
      handling: { autoReplied, escalated, resolvedByTeam },
      topIntents: [...intentCounts].map(([intent, count]) => ({ intent, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    };
  }

  async escalation(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const prev = this.prevWindow(range, now);
    const tickets = await this.prisma.ticket.findMany({
      where: { openedAt: { gte: since } },
      select: { status: true, reason: true, openedAt: true, assignedAt: true, resolvedAt: true, closedAt: true },
    });
    const isClosed = (s: string) => s === 'RESOLVED' || s === 'CLOSED';
    const opened = tickets.length;
    const closedList = (tickets as any[]).filter((t) => isClosed(t.status));
    const closed = closedList.length;
    const openRemaining = (tickets as any[]).filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const currentRate = rate(closed, opened);

    const prevTickets = await this.prisma.ticket.findMany({
      where: { openedAt: { gte: prev.start, lt: prev.end } },
      select: { status: true },
    });
    const prevClosed = (prevTickets as any[]).filter((t) => isClosed(t.status)).length;
    const deltaPct = Math.round((currentRate - rate(prevClosed, prevTickets.length)) * 10) / 10;

    const durations = closedList
      .map((t) => { const end = t.resolvedAt ?? t.closedAt; return end && t.openedAt ? new Date(end).getTime() - new Date(t.openedAt).getTime() : null; })
      .filter((x): x is number => x != null && x >= 0);
    const avgCloseMs = durations.length ? Math.round(durations.reduce((s, x) => s + x, 0) / durations.length) : null;

    const reasonCounts = new Map<string, number>();
    for (const t of closedList) reasonCounts.set(t.reason, (reasonCounts.get(t.reason) ?? 0) + 1);
    const byReason = [...reasonCounts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

    const keys = lastNDayKeys(rangeDays(range), now);
    const trendMap = new Map(keys.map((k) => [k, { opened: 0, closed: 0 }]));
    const respMap = new Map<string, number[]>(keys.map((k) => [k, []]));
    for (const t of tickets as any[]) {
      const k = klDayKey(t.openedAt);
      const tr = trendMap.get(k);
      if (tr) { tr.opened++; if (isClosed(t.status)) tr.closed++; }
      if (t.assignedAt && t.openedAt) {
        const mins = (new Date(t.assignedAt).getTime() - new Date(t.openedAt).getTime()) / 60000;
        const arr = respMap.get(k);
        if (arr && mins >= 0) arr.push(mins);
      }
    }
    return {
      rate: currentRate, deltaPct, opened, closed, openRemaining, avgCloseMs,
      trend: keys.map((k) => { const tr = trendMap.get(k)!; return { date: k, rate: rate(tr.closed, tr.opened) }; }),
      byReason,
      responseTimeByDay: keys.map((k) => { const arr = respMap.get(k)!; return { date: k, avgMinutes: arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null }; }),
    };
  }

  async kpis(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const prev = this.prevWindow(range, now);
    const cnt = (where: any) => this.prisma.message.count({ where });
    const [sc, dc, rc, pc] = await Promise.all([
      cnt({ sentAt: { gte: since } }),
      cnt({ sentAt: { gte: since }, deliveredAt: { not: null } }),
      cnt({ sentAt: { gte: since }, readAt: { not: null } }),
      cnt({ sentAt: { gte: since }, repliedAt: { not: null } }),
    ]);
    const [sp, dp, rp, pp] = await Promise.all([
      cnt({ sentAt: { gte: prev.start, lt: prev.end } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, deliveredAt: { not: null } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, readAt: { not: null } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, repliedAt: { not: null } }),
    ]);
    const [evCur, evPrev] = await Promise.all([
      this.prisma.autopilotEvent.findMany({ where: { createdAt: { gte: since } }, select: { action: true } }),
      this.prisma.autopilotEvent.findMany({ where: { createdAt: { gte: prev.start, lt: prev.end } }, select: { action: true } }),
    ]);
    const ahCur = rate((evCur as any[]).filter((e) => e.action === 'AUTO_REPLIED').length, evCur.length);
    const ahPrev = rate((evPrev as any[]).filter((e) => e.action === 'AUTO_REPLIED').length, evPrev.length);

    const sparkDays = SPARK_DAYS;
    const since12 = new Date(now.getTime() - sparkDays * 86_400_000);
    const rows = await this.prisma.message.findMany({ where: { sentAt: { gte: since12 } }, select: { sentAt: true, deliveredAt: true, readAt: true } });
    const keys = lastNDayKeys(sparkDays, now);
    const sentS = new Map(keys.map((k) => [k, 0]));
    const delS = new Map(keys.map((k) => [k, 0]));
    const readS = new Map(keys.map((k) => [k, 0]));
    for (const r of rows as any[]) {
      if (!r.sentAt) continue;
      const k = klDayKey(r.sentAt);
      if (sentS.has(k)) sentS.set(k, sentS.get(k)! + 1);
      if (r.deliveredAt && delS.has(k)) delS.set(k, delS.get(k)! + 1);
      if (r.readAt && readS.has(k)) readS.set(k, readS.get(k)! + 1);
    }
    const todayK = klDayKey(now);
    const yK = klDayKey(new Date(now.getTime() - 86_400_000));
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'cost_per_message_rm' } });
    const parsedRate = setting ? Number(setting.value) : NaN;
    const costRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : DEFAULT_COST_PER_MESSAGE_RM;
    const costToday = Math.round((delS.get(todayK) ?? 0) * costRate * 100) / 100;
    const costY = Math.round((delS.get(yK) ?? 0) * costRate * 100) / 100;
    const spark = (m: Map<string, number>) => keys.map((k) => m.get(k) ?? 0);
    const rateDelta = (cn: number, cd: number, pn: number, pd: number) => Math.round((rate(cn, cd) - rate(pn, pd)) * 10) / 10;

    return {
      delivered: { value: dc, deltaPct: pctDelta(dc, dp), spark: spark(delS) },
      deliveryRate: { value: rate(dc, sc), deltaPct: rateDelta(dc, sc, dp, sp), spark: spark(delS) },
      readRate: { value: rate(rc, dc), deltaPct: rateDelta(rc, dc, rp, dp), spark: spark(readS) },
      replyRate: { value: rate(pc, dc), deltaPct: rateDelta(pc, dc, pp, dp) },
      autoHandleRate: { value: ahCur, deltaPct: Math.round((ahCur - ahPrev) * 10) / 10 },
      sentToday: { value: sentS.get(todayK) ?? 0, deltaPct: pctDelta(sentS.get(todayK) ?? 0, sentS.get(yK) ?? 0), spark: spark(sentS) },
      costToday: { value: costToday, deltaPct: pctDelta(costToday, costY), spark: spark(delS), estimated: true },
    };
  }

  async audience() {
    const [byState, byVehicle] = await Promise.all([
      this.prisma.contact.groupBy({
        by: ['state'],
        where: { state: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.contact.groupBy({
        by: ['vehicleSpecialization'],
        where: { vehicleSpecialization: { not: null } },
        _count: { _all: true },
      }),
    ]);
    return {
      byState: byState
        .map((g: any) => ({ state: g.state, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      byVehicle: byVehicle
        .map((g: any) => ({ vehicle: g.vehicleSpecialization, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
    };
  }
}

// Exported for tasks 3-7
export { DEFAULT_COST_PER_MESSAGE_RM };
