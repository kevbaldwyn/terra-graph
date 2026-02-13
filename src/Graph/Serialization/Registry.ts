import { SerializedRule } from '../Rules/RuleConfig.js';
import { BaseRule } from '../Rules/Rule.js';
import { OperationsType } from '../Operations/Operations.js';

// TODO: refine rule serialization:
// - do nested matchers serialize cleanly (id -> query)?
// - can we avoid hardcoded registry wiring?

// TODO: registry persistence?
export type RuleRegistry = Record<
  string,
  (config: SerializedRule['config']) => BaseRule
>;

export type OperationsTypeRegistry = Record<string, OperationsType>;
