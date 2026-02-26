import { NamedRuleRegistry } from './Rules/NamedRuleRegistry.js';
import {
  NamedRuleSetDefinition,
  NamedRuleSetDefinitions,
  NamedRuleSetRegistry,
} from './Rules/NamedRuleSetRegistry.js';
import { RuleSet, SerializedRuleSet } from './Rules/RuleSet.js';
import {
  isNamedRuleRef,
  isNamedRuleSetRef,
  NamedRuleDefinitions,
  PhasePlan,
  SerializedPhaseRule,
} from './Rules/RulePlan.js';

export type GraphPluginBuildInput<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> = {
  options: TOptions;
  namedRules: NamedRuleRegistry;
  namedRuleSets: NamedRuleSetRegistry;
};

export type GraphPluginBuildResult = {
  namedRules?: NamedRuleDefinitions;
  namedRuleSets?: NamedRuleSetDefinitions;
  phases?: PhasePlan;
};

export abstract class GraphPlugin<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  constructor(
    public readonly name: string,
    public readonly defaults?: TOptions,
  ) {}

  public abstract build(
    input: GraphPluginBuildInput<TOptions>,
  ): GraphPluginBuildResult;
}

type GraphPluginFactory = () => GraphPlugin;
export type GraphPluginDefinition = GraphPlugin | GraphPluginFactory;
export type GraphPluginDefinitions = Record<string, GraphPluginDefinition>;

export class GraphPluginRegistry {
  private readonly definitions: Record<string, GraphPluginFactory>;

  constructor(
    definitions: GraphPluginDefinitions = {},
    factories?: Record<string, GraphPluginFactory>,
  ) {
    this.definitions = Object.freeze(
      factories ?? GraphPluginRegistry.toFactories(definitions),
    );
  }

  public static from(registries: GraphPluginRegistry[]): GraphPluginRegistry {
    return registries.reduce(
      (combined, registry) => combined.use(registry),
      new GraphPluginRegistry(),
    );
  }

  public register(
    name: string,
    definition: GraphPluginDefinition,
  ): GraphPluginRegistry {
    return GraphPluginRegistry.fromFactories({
      ...this.definitions,
      [name]: GraphPluginRegistry.toFactory(definition),
    });
  }

  public registerMany(
    definitions: GraphPluginDefinitions,
  ): GraphPluginRegistry {
    const nextFactories = {
      ...this.definitions,
      ...GraphPluginRegistry.toFactories(definitions),
    };
    return GraphPluginRegistry.fromFactories(nextFactories);
  }

  public use(registry: GraphPluginRegistry): GraphPluginRegistry {
    return GraphPluginRegistry.fromFactories({
      ...this.definitions,
      ...registry.definitions,
    });
  }

  public resolve(name: string): GraphPlugin {
    const factory = this.definitions[name];
    if (!factory) {
      throw new Error(`GraphPlugin '${name}' is not registered`);
    }
    const plugin = factory();
    if (plugin.name !== name) {
      throw new Error(
        `GraphPlugin registry key '${name}' does not match plugin.name '${plugin.name}'`,
      );
    }
    return plugin;
  }

  public names(): string[] {
    return Object.keys(this.definitions);
  }

  private static fromFactories(
    definitions: Record<string, GraphPluginFactory>,
  ): GraphPluginRegistry {
    return new GraphPluginRegistry({}, { ...definitions });
  }

  private static toFactories(
    definitions: GraphPluginDefinitions,
  ): Record<string, GraphPluginFactory> {
    return Object.fromEntries(
      Object.entries(definitions).map(([name, definition]) => [
        name,
        GraphPluginRegistry.toFactory(definition),
      ]),
    );
  }

  private static toFactory(
    definition: GraphPluginDefinition,
  ): GraphPluginFactory {
    if (typeof definition === 'function') {
      return definition;
    }
    return () => definition;
  }
}

export type GraphPluginRef = {
  plugin: string;
  options?: unknown;
};

export type SerializedGraphPluginRef = GraphPluginRef;

export type ResolveGraphPluginsInput = {
  plugins: GraphPluginRef[];
  pluginRegistry: GraphPluginRegistry;
  namedRules?: NamedRuleRegistry;
  namedRuleSets?: NamedRuleSetRegistry;
};

export type ResolveGraphPluginsResult = {
  phases: PhasePlan;
  namedRules: NamedRuleRegistry;
  namedRuleSets: NamedRuleSetRegistry;
};

const isObjectRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
};

const resolveGraphPluginOptions = <
  TOptions extends Record<string, unknown>,
>(
  plugin: GraphPlugin<TOptions>,
  options: unknown,
): TOptions => {
  if (options === undefined) {
    if (isObjectRecord(plugin.defaults)) {
      return { ...plugin.defaults } as TOptions;
    }
    if (plugin.defaults !== undefined) {
      return plugin.defaults as TOptions;
    }
    return {} as TOptions;
  }

  if (isObjectRecord(plugin.defaults) && isObjectRecord(options)) {
    return {
      ...plugin.defaults,
      ...options,
    } as TOptions;
  }

  return options as TOptions;
};

const toPrefixedName = (pluginName: string, localName: string): string => {
  const prefix = `${pluginName}.`;
  if (localName.startsWith(prefix)) {
    return localName;
  }
  return `${prefix}${localName}`;
};

const createPrefixedNameMap = (
  pluginName: string,
  localNames: string[],
  kind: 'named rule' | 'named rule set',
): Map<string, string> => {
  const nameMap = new Map<string, string>();
  const prefixed = new Set<string>();

  for (const localName of localNames) {
    const resolvedName = toPrefixedName(pluginName, localName);
    if (prefixed.has(resolvedName)) {
      throw new Error(
        `GraphPlugin '${pluginName}' has colliding ${kind} names after prefixing ('${localName}' -> '${resolvedName}')`,
      );
    }
    prefixed.add(resolvedName);
    nameMap.set(localName, resolvedName);
  }

  return nameMap;
};

const assertNoCollisions = (
  pluginName: string,
  kind: 'named rule' | 'named rule set',
  localNames: string[],
  existingNames: string[],
) => {
  const existing = new Set(existingNames);
  for (const localName of localNames) {
    if (existing.has(localName)) {
      throw new Error(
        `GraphPlugin '${pluginName}' ${kind} '${localName}' collides with an existing ${kind}`,
      );
    }
  }
};

const prefixDefinitions = <TDefinition>(
  definitions: Record<string, TDefinition>,
  nameMap: Map<string, string>,
): Record<string, TDefinition> => {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => [
      nameMap.get(name) ?? name,
      definition,
    ]),
  );
};

const rewriteSerializedPhaseRule = (
  rule: SerializedPhaseRule,
  namedRuleMap: Map<string, string>,
  namedRuleSetMap: Map<string, string>,
): SerializedPhaseRule => {
  if (isNamedRuleRef(rule)) {
    const mapped = namedRuleMap.get(rule.namedRule);
    if (mapped) {
      return { namedRule: mapped };
    }
    return rule;
  }

  if (isNamedRuleSetRef(rule)) {
    const mapped = namedRuleSetMap.get(rule.namedRuleSet);
    if (mapped) {
      return { namedRuleSet: mapped };
    }
    return rule;
  }

  return rule;
};

const rewriteSerializedRuleSet = (
  ruleSet: SerializedRuleSet,
  namedRuleMap: Map<string, string>,
  namedRuleSetMap: Map<string, string>,
): SerializedRuleSet => {
  return {
    name: ruleSet.name,
    rules: (ruleSet.rules ?? []).map((rule) =>
      rewriteSerializedPhaseRule(rule, namedRuleMap, namedRuleSetMap)
    ),
  };
};

const rewriteNamedRuleSetDefinition = (
  definition: NamedRuleSetDefinition,
  namedRuleMap: Map<string, string>,
  namedRuleSetMap: Map<string, string>,
): NamedRuleSetDefinition => {
  if (typeof definition === 'function') {
    return () =>
      RuleSet.deseriaize(
        rewriteSerializedRuleSet(
          definition().serialize(),
          namedRuleMap,
          namedRuleSetMap,
        ),
      );
  }

  const serialized = definition instanceof RuleSet
    ? definition.serialize()
    : definition;

  return RuleSet.deseriaize(
    rewriteSerializedRuleSet(serialized, namedRuleMap, namedRuleSetMap),
  );
};

const prefixNamedRuleSetDefinitions = (
  definitions: NamedRuleSetDefinitions,
  nameMap: Map<string, string>,
  namedRuleMap: Map<string, string>,
  namedRuleSetMap: Map<string, string>,
): NamedRuleSetDefinitions => {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => [
      nameMap.get(name) ?? name,
      rewriteNamedRuleSetDefinition(definition, namedRuleMap, namedRuleSetMap),
    ]),
  );
};

const prefixPhasePlan = (
  phases: PhasePlan,
  namedRuleMap: Map<string, string>,
  namedRuleSetMap: Map<string, string>,
): PhasePlan => {
  return phases.map((phase) =>
    phase.map((rule) => {
      if (isNamedRuleRef(rule)) {
        const mapped = namedRuleMap.get(rule.namedRule);
        if (mapped) {
          return { namedRule: mapped };
        }
        return rule;
      }

      if (isNamedRuleSetRef(rule)) {
        const mapped = namedRuleSetMap.get(rule.namedRuleSet);
        if (mapped) {
          return { namedRuleSet: mapped };
        }
        return rule;
      }

      return rule;
    }),
  );
};

export const resolveGraphPlugins = (
  input: ResolveGraphPluginsInput,
): ResolveGraphPluginsResult => {
  let namedRules = input.namedRules ?? new NamedRuleRegistry();
  let namedRuleSets = input.namedRuleSets ?? new NamedRuleSetRegistry();
  const phases: PhasePlan = [];

  for (const pluginRef of input.plugins) {
    const plugin = input.pluginRegistry.resolve(pluginRef.plugin);
    const buildResult = plugin.build({
      options: resolveGraphPluginOptions(plugin, pluginRef.options),
      namedRules,
      namedRuleSets,
    });

    const localNamedRules = buildResult.namedRules ?? {};
    const localNamedRuleSets = buildResult.namedRuleSets ?? {};

    const namedRuleMap = createPrefixedNameMap(
      plugin.name,
      Object.keys(localNamedRules),
      'named rule',
    );
    const namedRuleSetMap = createPrefixedNameMap(
      plugin.name,
      Object.keys(localNamedRuleSets),
      'named rule set',
    );

    const prefixedNamedRules = prefixDefinitions(localNamedRules, namedRuleMap);
    const prefixedNamedRuleSets = prefixNamedRuleSetDefinitions(
      localNamedRuleSets,
      namedRuleSetMap,
      namedRuleMap,
      namedRuleSetMap,
    );

    assertNoCollisions(
      plugin.name,
      'named rule',
      Object.keys(prefixedNamedRules),
      namedRules.names(),
    );
    assertNoCollisions(
      plugin.name,
      'named rule set',
      Object.keys(prefixedNamedRuleSets),
      namedRuleSets.names(),
    );

    namedRules = namedRules.registerMany(prefixedNamedRules);
    namedRuleSets = namedRuleSets.registerMany(prefixedNamedRuleSets);

    const pluginPhases = prefixPhasePlan(
      buildResult.phases ?? [],
      namedRuleMap,
      namedRuleSetMap,
    );
    phases.push(...pluginPhases);
  }

  return {
    phases,
    namedRules,
    namedRuleSets,
  };
};
