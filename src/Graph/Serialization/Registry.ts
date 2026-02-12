import { SerializedHook } from '../Operations/Hooks.js';
import { BaseHook } from '../Operations/NodeHook.js';
import { OperationsType } from '../Operations/Operations.js';

// TODO: refine hook serialization:
// - do nested matchers serialize cleanly (id -> query)?
// - can we avoid hardcoded registry wiring?

// TODO: registry persistence?
export type HookRegistry = Record<
  string,
  (config: SerializedHook['config']) => BaseHook
>;

export type OperationsTypeRegistry = Record<string, OperationsType>;
