/**
 * Thrown when every adapter in a task's chain has failed (all retries exhausted).
 * The decision engine catches this and translates it into an ESCALATE.
 */
export class LlmExhaustedException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions);
    this.name = 'LlmExhaustedException';
  }
}
