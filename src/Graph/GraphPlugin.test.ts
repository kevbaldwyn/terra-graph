import {
  GraphPluginBuildInput,
  GraphPlugin,
  GraphPluginRegistry,
  resolveGraphPlugins,
} from './GraphPlugin.js';
import { NamedRuleRegistry } from './Rules/NamedRuleRegistry.js';
import { RuleSet } from './Rules/RuleSet.js';
import { RemoveNode } from './Rules/Node/RemoveNode.js';

describe('GraphPluginRegistry.resolve', () => {
  it('shoud resolve a named plugin instance', () => {
    class ExamplePlugin extends GraphPlugin {
      constructor() {
        super('example.plugin');
      }

      public build() {
        return {};
      }
    }

    const plugin = new ExamplePlugin();
    const registry = new GraphPluginRegistry({
      'example.plugin': plugin,
    });

    expect(registry.resolve('example.plugin')).toBe(plugin);
  });

  it('shoud resolve a fresh instance each time for a named plugin factory', () => {
    class FactoryPlugin extends GraphPlugin {
      constructor() {
        super('factory.plugin');
      }

      public build() {
        return {};
      }
    }

    const registry = new GraphPluginRegistry({
      'factory.plugin': () => new FactoryPlugin(),
    });

    const first = registry.resolve('factory.plugin');
    const second = registry.resolve('factory.plugin');

    expect(first).not.toBe(second);
    expect(first.name).toBe(second.name);
  });

  it('shoud throw when a named plugin is not registered', () => {
    const registry = new GraphPluginRegistry();

    expect(() => registry.resolve('doesNotExist')).toThrow(
      "GraphPlugin 'doesNotExist' is not registered",
    );
  });

  it('shoud throw when registry key and plugin name do not match', () => {
    class WrongNamePlugin extends GraphPlugin {
      constructor() {
        super('wrong.name');
      }

      public build() {
        return {};
      }
    }

    const registry = new GraphPluginRegistry({
      'expected.name': new WrongNamePlugin(),
    });

    expect(() => registry.resolve('expected.name')).toThrow(
      "GraphPlugin registry key 'expected.name' does not match plugin.name 'wrong.name'",
    );
  });
});

describe('GraphPluginRegistry.register', () => {
  it('shoud return a new registry without mutating the original', () => {
    class OnePlugin extends GraphPlugin {
      constructor() {
        super('one.plugin');
      }

      public build() {
        return {};
      }
    }
    class TwoPlugin extends GraphPlugin {
      constructor() {
        super('two.plugin');
      }

      public build() {
        return {};
      }
    }

    const base = new GraphPluginRegistry({
      'one.plugin': new OnePlugin(),
    });

    const next = base.register('two.plugin', new TwoPlugin());

    expect(base.names()).toEqual(['one.plugin']);
    expect(next.names()).toEqual(['one.plugin', 'two.plugin']);
  });
});

describe('GraphPluginRegistry.use', () => {
  it('shoud combine registries immutably', () => {
    class OnePlugin extends GraphPlugin {
      constructor() {
        super('one.plugin');
      }

      public build() {
        return {};
      }
    }
    class TwoPlugin extends GraphPlugin {
      constructor() {
        super('two.plugin');
      }

      public build() {
        return {};
      }
    }

    const one = new GraphPluginRegistry({
      'one.plugin': new OnePlugin(),
    });
    const two = new GraphPluginRegistry({
      'two.plugin': new TwoPlugin(),
    });

    const combined = one.use(two);

    expect(one.names()).toEqual(['one.plugin']);
    expect(two.names()).toEqual(['two.plugin']);
    expect(combined.names()).toEqual(['one.plugin', 'two.plugin']);
  });
});

describe('GraphPluginRegistry.from', () => {
  it('shoud combine an array of registries', () => {
    class OnePlugin extends GraphPlugin {
      constructor() {
        super('one.plugin');
      }

      public build() {
        return {};
      }
    }
    class TwoPlugin extends GraphPlugin {
      constructor() {
        super('two.plugin');
      }

      public build() {
        return {};
      }
    }

    const one = new GraphPluginRegistry({
      'one.plugin': new OnePlugin(),
    });
    const two = new GraphPluginRegistry({
      'two.plugin': new TwoPlugin(),
    });

    const combined = GraphPluginRegistry.from([one, two]);

    expect(combined.names()).toEqual(['one.plugin', 'two.plugin']);
  });
});

describe('resolveGraphPlugins', () => {
  it('shoud resolve plugin named rules, named rule sets and prefixed phases', () => {
    class PluginOne extends GraphPlugin<{ marker?: string }> {
      constructor() {
        super('test.plugin', { marker: 'default' });
      }

      public override build({
        options,
      }: GraphPluginBuildInput<{ marker?: string }>) {
        return {
          namedRules: {
            remove: new RemoveNode({
              node: {
                attr: {
                  key: 'label',
                  eq: options.marker ?? 'default',
                },
              },
            }),
          },
          namedRuleSets: {
            wrapper: new RuleSet({
              rules: [{ namedRule: 'remove' }],
            }),
          },
          phases: [[{ namedRuleSet: 'wrapper' }]],
        };
      }
    }

    const pluginRegistry = new GraphPluginRegistry({
      'test.plugin': new PluginOne(),
    });

    const result = resolveGraphPlugins({
      plugins: [{ plugin: 'test.plugin', options: { marker: 'plugin' } }],
      pluginRegistry,
    });

    expect(result.namedRules.names()).toEqual(['test.plugin.remove']);
    expect(result.namedRuleSets.names()).toEqual(['test.plugin.wrapper']);
    expect(result.phases).toEqual([[{ namedRuleSet: 'test.plugin.wrapper' }]]);

    const resolved = result.namedRuleSets.resolve('test.plugin.wrapper')
      .resolvePhases(result.namedRules, result.namedRuleSets);
    expect(resolved[0][0].serialize()).toEqual({
      id: 'RemoveNode',
      config: {
        node: { attr: { key: 'label', eq: 'plugin' } },
      },
    });
  });

  it('shoud merge plugin defaults with provided options', () => {
    class CapturePlugin extends GraphPlugin<{ one?: string; two?: string }> {
      public captured?: { one?: string; two?: string };

      constructor() {
        super('test.capture', { one: 'default-one', two: 'default-two' });
      }

      public override build({
        options,
      }: GraphPluginBuildInput<{ one?: string; two?: string }>) {
        this.captured = options;
        return {};
      }
    }

    const plugin = new CapturePlugin();
    const pluginRegistry = new GraphPluginRegistry({
      'test.capture': plugin,
    });

    resolveGraphPlugins({
      plugins: [{ plugin: 'test.capture', options: { one: 'override' } }],
      pluginRegistry,
    });

    expect(plugin.captured).toEqual({
      one: 'override',
      two: 'default-two',
    });
  });

  it('shoud pass an empty object when no defaults and no options are provided', () => {
    class EmptyOptionsPlugin extends GraphPlugin {
      public captured?: Record<string, unknown>;

      constructor() {
        super('test.empty');
      }

      public override build({
        options,
      }: GraphPluginBuildInput<Record<string, unknown>>) {
        this.captured = options;
        return {};
      }
    }

    const plugin = new EmptyOptionsPlugin();
    const pluginRegistry = new GraphPluginRegistry({
      'test.empty': plugin,
    });

    resolveGraphPlugins({
      plugins: [{ plugin: 'test.empty' }],
      pluginRegistry,
    });

    expect(plugin.captured).toEqual({});
  });

  it('shoud throw when plugin local names collide after prefixing', () => {
    class CollisionPlugin extends GraphPlugin {
      constructor() {
        super('test.collision');
      }

      public build() {
        return {
          namedRules: {
            one: new RemoveNode({ node: { any: true } }),
            'test.collision.one': new RemoveNode({ node: { any: true } }),
          },
        };
      }
    }

    const pluginRegistry = new GraphPluginRegistry({
      'test.collision': new CollisionPlugin(),
    });

    expect(() =>
      resolveGraphPlugins({
        plugins: [{ plugin: 'test.collision' }],
        pluginRegistry,
      }),
    ).toThrow(
      "GraphPlugin 'test.collision' has colliding named rule names after prefixing ('test.collision.one' -> 'test.collision.one')",
    );
  });

  it('shoud throw when plugin prefixed names collide with existing registries', () => {
    class CollisionPlugin extends GraphPlugin {
      constructor() {
        super('test.collision');
      }

      public build() {
        return {
          namedRules: {
            one: new RemoveNode({ node: { any: true } }),
          },
        };
      }
    }

    const pluginRegistry = new GraphPluginRegistry({
      'test.collision': new CollisionPlugin(),
    });
    const namedRules = new NamedRuleRegistry({
      'test.collision.one': new RemoveNode({ node: { any: true } }),
    });

    expect(() =>
      resolveGraphPlugins({
        plugins: [{ plugin: 'test.collision' }],
        pluginRegistry,
        namedRules,
      }),
    ).toThrow(
      "GraphPlugin 'test.collision' named rule 'test.collision.one' collides with an existing named rule",
    );
  });

  it('shoud not double prefix already prefixed names', () => {
    class PrefixedPlugin extends GraphPlugin {
      constructor() {
        super('test.prefixed');
      }

      public build() {
        return {
          namedRules: {
            'test.prefixed.rule': new RemoveNode({ node: { any: true } }),
          },
          phases: [[{ namedRule: 'test.prefixed.rule' }]],
        };
      }
    }

    const pluginRegistry = new GraphPluginRegistry({
      'test.prefixed': new PrefixedPlugin(),
    });

    const result = resolveGraphPlugins({
      plugins: [{ plugin: 'test.prefixed' }],
      pluginRegistry,
    });

    expect(result.namedRules.names()).toEqual(['test.prefixed.rule']);
    expect(result.phases).toEqual([[{ namedRule: 'test.prefixed.rule' }]]);
  });

  it('shoud throw when plugin reference is not registered', () => {
    const pluginRegistry = new GraphPluginRegistry();

    expect(() =>
      resolveGraphPlugins({
        plugins: [{ plugin: 'unknown.plugin' }],
        pluginRegistry,
      }),
    ).toThrow("GraphPlugin 'unknown.plugin' is not registered");
  });
});
