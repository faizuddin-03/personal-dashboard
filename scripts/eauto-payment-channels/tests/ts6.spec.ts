import { defineScenarioTest } from '../utils/defineScenarioTest';

// 12153_TS6 — Card (Debit), Mastercard, Failed then redo to Success.
// Sheet remark: "To confirm the exact error message" — see
// PaymentOutcomePage.expectUnsuccessfulPaymentRedirect for where that lands.
// See data/scenarios.ts for the full config and utils/defineScenarioTest.ts
// for the shared Initial Steps -> Payment -> Continuation -> Payment shape.
defineScenarioTest('ts6');
