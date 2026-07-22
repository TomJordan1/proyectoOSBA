import type { Action, DecisionArguments, ReasonCode } from "../domain/types.js";
export type { DecisionRequest } from "../domain/types.js";
export interface LocalDecisionLike {
  action: Action;
  arguments: DecisionArguments;
  reason_code: ReasonCode;
}
