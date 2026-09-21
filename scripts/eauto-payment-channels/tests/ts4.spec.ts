import { defineScenarioTest } from '../utils/defineScenarioTest';

// 12153_TS4 — FPX (B2C), HSBC -> Affin Bank, Failed then redo to Success.
// See data/scenarios.ts for the full config and utils/defineScenarioTest.ts
// for the shared Initial Steps -> Payment -> Continuation -> Payment shape.
defineScenarioTest('ts4');
