import { NodeHook, SerializedHook } from '../Operations/Hooks.js';
import { OperationsType } from '../Operations/Operations.js';

// TODO: refine hook serialization:
// - do nested matchers serialize cleanly (id -> config)?
// - can we avoid hardcoded registry wiring?

// TODO: registry persistence?
export type HookRegistry = Record<
  string,
  (config: SerializedHook['config']) => NodeHook
>;

export type OperationsTypeRegistry = Record<string, OperationsType>;
