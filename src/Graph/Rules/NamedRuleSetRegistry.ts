import { RuleSet, SerializedRuleSet } from './RuleSet.js';

export type NamedRuleSetDefinition =
  | SerializedRuleSet
  | RuleSet
  | (() => RuleSet);
export type NamedRuleSetDefinitions = Record<string, NamedRuleSetDefinition>;

type NamedRuleSetFactory = () => RuleSet;

export class NamedRuleSetRegistry {
  private readonly definitions: Record<string, NamedRuleSetFactory>;

  constructor(
    definitions: NamedRuleSetDefinitions = {},
    factories?: Record<string, NamedRuleSetFactory>,
  ) {
    this.definitions = Object.freeze(
      factories ?? NamedRuleSetRegistry.toFactories(definitions),
    );
  }

  public static from(registries: NamedRuleSetRegistry[]): NamedRuleSetRegistry {
    return registries.reduce(
      (combined, registry) => combined.use(registry),
      new NamedRuleSetRegistry(),
    );
  }

  public register(
    name: string,
    definition: NamedRuleSetDefinition,
  ): NamedRuleSetRegistry {
    return NamedRuleSetRegistry.fromFactories({
      ...this.definitions,
      [name]: NamedRuleSetRegistry.toFactory(definition),
    });
  }

  public registerMany(
    definitions: NamedRuleSetDefinitions,
  ): NamedRuleSetRegistry {
    const nextFactories = {
      ...this.definitions,
      ...NamedRuleSetRegistry.toFactories(definitions),
    };
    return NamedRuleSetRegistry.fromFactories(nextFactories);
  }

  public use(registry: NamedRuleSetRegistry): NamedRuleSetRegistry {
    return NamedRuleSetRegistry.fromFactories({
      ...this.definitions,
      ...registry.definitions,
    });
  }

  public resolve(name: string): RuleSet {
    const factory = this.definitions[name];
    if (!factory) {
      throw new Error(`Named rule set '${name}' is not registered`);
    }
    return factory();
  }

  public names(): string[] {
    return Object.keys(this.definitions);
  }

  private static fromFactories(
    definitions: Record<string, NamedRuleSetFactory>,
  ): NamedRuleSetRegistry {
    return new NamedRuleSetRegistry({}, { ...definitions });
  }

  private static toFactories(
    definitions: NamedRuleSetDefinitions,
  ): Record<string, NamedRuleSetFactory> {
    return Object.fromEntries(
      Object.entries(definitions).map(([name, definition]) => [
        name,
        NamedRuleSetRegistry.toFactory(definition),
      ]),
    );
  }

  private static toFactory(
    definition: NamedRuleSetDefinition,
  ): NamedRuleSetFactory {
    if (typeof definition === 'function') {
      return definition;
    }

    const serialized = definition instanceof RuleSet
      ? definition.serialize()
      : definition;

    return () => RuleSet.deseriaize(NamedRuleSetRegistry.cloneSerialized(serialized));
  }

  private static cloneSerialized(set: SerializedRuleSet): SerializedRuleSet {
    return JSON.parse(JSON.stringify(set)) as SerializedRuleSet;
  }
}

