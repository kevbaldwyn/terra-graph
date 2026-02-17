import { BaseRule } from './Rule.js';
import { RuleConfig, SerializedRule } from './RuleConfig.js';

export type NamedRuleDefinition = SerializedRule | BaseRule | (() => BaseRule);

type NamedRuleFactory = () => BaseRule;

export class NamedRuleRegistry {
  private readonly definitions: Record<string, NamedRuleFactory> = {};

  constructor(definitions: Record<string, NamedRuleDefinition> = {}) {
    this.registerMany(definitions);
  }

  public register(name: string, definition: NamedRuleDefinition): this {
    this.definitions[name] = NamedRuleRegistry.toFactory(definition);
    return this;
  }

  public registerMany(definitions: Record<string, NamedRuleDefinition>): this {
    for (const [name, definition] of Object.entries(definitions)) {
      this.register(name, definition);
    }
    return this;
  }

  public resolve(name: string): BaseRule {
    const factory = this.definitions[name];
    if (!factory) {
      throw new Error(`Named rule '${name}' is not registered`);
    }
    return factory();
  }

  public resolveMany(names: string[]): BaseRule[] {
    return names.map((name) => this.resolve(name));
  }

  public resolvePhases(phases: string[][]): BaseRule[][] {
    return phases.map((phase) => this.resolveMany(phase));
  }

  public names(): string[] {
    return Object.keys(this.definitions);
  }

  private static toFactory(definition: NamedRuleDefinition): NamedRuleFactory {
    if (typeof definition === 'function') {
      return definition;
    }

    const serialized = definition instanceof BaseRule
      ? definition.serialize()
      : definition;

    return () =>
      BaseRule.fromSerialized({
        id: serialized.id,
        config: NamedRuleRegistry.cloneConfig(serialized.config),
      });
  }

  private static cloneConfig(config: RuleConfig): RuleConfig {
    return JSON.parse(JSON.stringify(config)) as RuleConfig;
  }
}
