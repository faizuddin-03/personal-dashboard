// The one pre-push transaction whose stored values were recorded BEFORE the
// v2.0 push (used by TS28, TS29, TS30 and TS35). Source:
// `_reference/html/eauto/bo-jomcheck-report-listing.html`, captured on uat1,
// 2026-09-30, state 2 (search HXJ0001, 1 record). At capture time Possible
// Total Loss / Possible BER both read "N/A" — the pre-push behaviour.
//
// It has 2 claims, so it serves TS28 (2+ claims). No 1-claim pre-push
// transaction has been recorded, which is why TS27 is not built.

export const PRE_PUSH = {
  vehicleNo: 'HXJ0001',
  transactionNo: 'J690008380',
  capturedOn: '30-09-2026 14:20',
  claims: {
    'Odometer Reading': ['0', '226825'],
    'Type of Claim': ['Own Damage (OD)', 'Own Damage (OD)'],
    'Total No. of Parts Approved for Change': ['3', '8'],
  },
} as const;

// Report PDFs downloaded from a pre-push transaction and kept in the repo —
// TS05's "copy saved before the push", keyed by vehicle no. Only HXJ0001
// (J690008380) has one: downloaded 2026-10-01 from uat1, its 2 claims match
// PRE_PUSH.claims above, and it prints the PRE-CR claim table (header
// "MILEAGE ** ... SEVERITY"). knowledge/flow-jomcheck.md §7j.
// Path is relative to the repo root.
export const PRE_PUSH_REPORTS: Record<string, { transactionNo: string; pdf: string }> = {
  HXJ0001: {
    transactionNo: 'J690008380',
    pdf: '_reference/tickets/EAINT-12339/EAINT-12339-TS27-report-HXJ0001-uat1-20261001.pdf',
  },
};
