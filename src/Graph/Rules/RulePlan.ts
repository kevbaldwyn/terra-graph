import { BaseRule } from './Rule.js';
import { SerializedRule } from './RuleConfig.js';

export type NamedRuleRef = {
  namedRule: string;
};

export type NamedRuleSetRef = {
  namedRuleSet: string;
};

export type PhaseRule =
  | BaseRule
  | SerializedRule
  | NamedRuleRef
  | NamedRuleSetRef;
export type SerializedPhaseRule = SerializedRule | NamedRuleRef | NamedRuleSetRef;
export type PhasePlan = PhaseRule[][];
export type SerializedPhasePlan = SerializedPhaseRule[][];

export type NamedRuleDefinition = SerializedRule | BaseRule | (() => BaseRule);
export type NamedRuleDefinitions = Record<string, NamedRuleDefinition>;

export const isNamedRuleRef = (rule: PhaseRule): rule is NamedRuleRef => {
  return (
    typeof rule === 'object' &&
    rule !== null &&
    'namedRule' in rule &&
    typeof rule.namedRule === 'string'
  );
};

export const isNamedRuleSetRef = (
  rule: PhaseRule,
): rule is NamedRuleSetRef => {
  return (
    typeof rule === 'object' &&
    rule !== null &&
    'namedRuleSet' in rule &&
    typeof rule.namedRuleSet === 'string'
  );
};
