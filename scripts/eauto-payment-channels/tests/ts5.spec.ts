import { defineScenarioTest } from '../utils/defineScenarioTest';

// 12153_TS5 — Card (Credit), VISA, Success.
// See data/scenarios.ts for the full config and utils/defineScenarioTest.ts
// for the shared Initial Steps -> Payment -> Continuation -> Payment shape.
defineScenarioTest('ts5');
