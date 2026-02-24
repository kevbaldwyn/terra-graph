import { NamedRuleRegistry } from './NamedRuleRegistry.js';
import type { NamedRuleSetRegistry } from './NamedRuleSetRegistry.js';
import { BaseRule } from './Rule.js';
import {
  isNamedRuleSetRef,
  isNamedRuleRef,
  PhasePlan,
  PhaseRule,
  SerializedPhaseRule,
} from './RulePlan.js';
import { SerializedRule } from './RuleConfig.js';

export type RuleSetOptions = {
  rules?: PhaseRule[];
};

export type SerializedRuleSet = {
  name?: string;
  rules?: SerializedPhaseRule[];
};

export class RuleSet {
  private readonly rules: PhaseRule[];

  constructor(options: RuleSetOptions = {}) {
    this.rules = options.rules ?? [];
  }

  public addRules(rules: PhaseRule[]): RuleSet {
    return new RuleSet({
      rules: [...this.rules, ...rules],
    });
  }

  public toPhases(): PhasePlan {
    return [[...this.rules]];
  }

  public resolvePhases(
    namedRules?: NamedRuleRegistry,
    namedRuleSets?: NamedRuleSetRegistry,
  ): BaseRule[][] {
    return [
      this.rules.flatMap((rule) =>
        this.resolveRule(rule, namedRules, namedRuleSets),
      ),
    ];
  }

  public serialize(): SerializedRuleSet {
    return {
      rules: this.serializeRules(this.rules),
    };
  }

  public static deseriaize(json: SerializedRuleSet): RuleSet {
    return new RuleSet({
      rules: RuleSet.deserializeRules(json.rules ?? []),
    });
  }

  private resolveRule(
    rule: PhaseRule,
    namedRules?: NamedRuleRegistry,
    namedRuleSets?: NamedRuleSetRegistry,
  ): BaseRule[] {
    if (rule instanceof BaseRule) {
      return [RuleSet.deserializeRule(rule.serialize())];
    }

    if (isNamedRuleRef(rule)) {
      if (!namedRules) {
        throw new Error(
          'RuleSet contains named rules but no NamedRuleRegistry was provided',
        );
      }
      return [namedRules.resolve(rule.namedRule)];
    }

    if (isNamedRuleSetRef(rule)) {
      if (!namedRuleSets) {
        throw new Error(
          'RuleSet contains named rule sets but no NamedRuleSetRegistry was provided',
        );
      }
      const resolved = namedRuleSets.resolve(rule.namedRuleSet).resolvePhases(
        namedRules,
        namedRuleSets,
      );
      return resolved[0] ?? [];
    }

    return [RuleSet.deserializeRule(rule)];
  }

  private serializeRules(rules: PhaseRule[]): SerializedPhaseRule[] {
    return rules.map((rule) => {
      if (rule instanceof BaseRule) {
        return rule.serialize();
      }
      return rule;
    });
  }

  private static deserializeRules(
    rules: SerializedPhaseRule[],
  ): PhaseRule[] {
    return rules.map((rule) => rule);
  }

  private static deserializeRule<ReturnedRuleType = BaseRule>(
    rule: SerializedRule,
  ): ReturnedRuleType {
    return BaseRule.fromSerialized(rule) as ReturnedRuleType;
  }
}
