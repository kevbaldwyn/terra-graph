import { BaseRule } from './Rule.js';
import { RuleConfig, SerializedRule } from './RuleConfig.js';

export type NamedRuleDefinition = SerializedRule | BaseRule | (() => BaseRule);

type NamedRuleFactory = () => BaseRule;

export class NamedRuleRegistry {
  private readonly definitions: Record<string, NamedRuleFactory>;

  constructor(
    definitions: Record<string, NamedRuleDefinition> = {},
    factories?: Record<string, NamedRuleFactory>,
  ) {
    this.definitions = Object.freeze(
      factories ?? NamedRuleRegistry.toFactories(definitions),
    );
  }

  public static from(registries: NamedRuleRegistry[]): NamedRuleRegistry {
    return registries.reduce(
      (combined, registry) => combined.use(registry),
      new NamedRuleRegistry(),
    );
  }

  public register(
    name: string,
    definition: NamedRuleDefinition,
  ): NamedRuleRegistry {
    return NamedRuleRegistry.fromFactories({
      ...this.definitions,
      [name]: NamedRuleRegistry.toFactory(definition),
    });
  }

  public registerMany(
    definitions: Record<string, NamedRuleDefinition>,
  ): NamedRuleRegistry {
    const nextFactories = {
      ...this.definitions,
      ...NamedRuleRegistry.toFactories(definitions),
    };
    return NamedRuleRegistry.fromFactories(nextFactories);
  }

  public use(registry: NamedRuleRegistry): NamedRuleRegistry {
    return NamedRuleRegistry.fromFactories({
      ...this.definitions,
      ...registry.definitions,
    });
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

  private static fromFactories(
    definitions: Record<string, NamedRuleFactory>,
  ): NamedRuleRegistry {
    return new NamedRuleRegistry({}, { ...definitions });
  }

  private static toFactories(
    definitions: Record<string, NamedRuleDefinition>,
  ): Record<string, NamedRuleFactory> {
    return Object.fromEntries(
      Object.entries(definitions).map(([name, definition]) => [
        name,
        NamedRuleRegistry.toFactory(definition),
      ]),
    );
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
