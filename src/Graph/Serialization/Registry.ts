import { AdapterOperationsConstructor } from '../Operations/Operations.js';
import { BaseRule } from '../Rules/Rule.js';
import { SerializedRule } from '../Rules/RuleConfig.js';

// TODO: refine rule serialization:
// - do nested matchers serialize cleanly (id -> query)?
// - can we avoid hardcoded registry wiring?

// TODO: registry persistence?
export type RuleRegistry = Record<
  string,
  (config: SerializedRule['config']) => BaseRule
>;

export type SupportedAdapterOperationsRegistry = Record<
  string,
  AdapterOperationsConstructor
>;
