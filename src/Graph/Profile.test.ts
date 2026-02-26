import { GraphologyAdapter } from './Adapters/GraphologyAdapter.js';
import { NodeQuery } from './Operations/Matchers/NodeQuery/NodeQuery.js';
import { AdapterOperations } from './Operations/Operations.js';
import { GraphPlugin, GraphPluginRegistry } from './GraphPlugin.js';
import type { GraphPluginBuildInput } from './GraphPlugin.js';
import { Profile } from './Profile.js';
import { NamedRuleSetRegistry } from './Rules/NamedRuleSetRegistry.js';
import { RuleSet } from './Rules/RuleSet.js';
import { NamedRuleRegistry } from './Rules/NamedRuleRegistry.js';
import { NodeRule } from './Rules/Rule.js';
import { NodeId, TgNodeAttributes } from './TgGraph.js';

class AlwaysMatchRule extends NodeRule {
  public override apply(
    nodeId: NodeId,
    _node: TgNodeAttributes,
    graph: AdapterOperations,
  ) {
    return graph.removeNode(nodeId);
  }
}

NodeRule.register(AlwaysMatchRule);

const createAlwaysMatch = (query?: NodeQuery): NodeRule =>
  new AlwaysMatchRule({
    node: (
      query ?? NodeQuery.from({ attr: { key: 'label', exists: true } })
    ).getDsl(),
  });

class RemoveLabelPlugin extends GraphPlugin<{ label: string }> {
  constructor() {
    super('test.remove_label', { label: 'default' });
  }

  public override build({
    options,
  }: GraphPluginBuildInput<{ label: string }>) {
    return {
      namedRules: {
        remove_label: createAlwaysMatch(
          NodeQuery.from({ attr: { key: 'label', eq: options.label } }),
        ),
      },
      namedRuleSets: {
        remove_label_set: new RuleSet({
          rules: [{ namedRule: 'remove_label' }],
        }),
      },
      phases: [[{ namedRuleSet: 'remove_label_set' }]],
    };
  }
}

const pluginRegistry = new GraphPluginRegistry({
  'test.remove_label': new RemoveLabelPlugin(),
});

describe('Profile.serialize', () => {
  it('shoud serialize rules and operations type', () => {
    const profile = new Profile('my-profile', {
      supports: GraphologyAdapter,
      phases: [
        [
          createAlwaysMatch(
            NodeQuery.from({ attr: { key: 'label', exists: true } }),
          ),
        ],
      ],
    });

    const json = profile.serialize();

    expect(json).toEqual(
      expect.objectContaining({
        name: 'my-profile',
        supports: 'GraphologyAdapter',
        phases: [
          [
            {
              id: 'AlwaysMatchRule',
              config: {
                node: { attr: { key: 'label', exists: true } },
              },
            },
          ],
        ],
        usesProfiles: [],
      }),
    );
  });

  it('shoud serialize render options', () => {
    const profile = new Profile('my-profile', {
      supports: GraphologyAdapter,
      render: {
        options: {
          graph: {
            rankdir: 'TB',
          },
        },
      },
      phases: [],
    });

    const json = profile.serialize();

    expect(json).toEqual(
      expect.objectContaining({
        name: 'my-profile',
        render: {
          options: {
            graph: {
              rankdir: 'TB',
            },
          },
        },
      }),
    );
  });

  it('shoud serialize plugin references but not plugin-resolved phases', () => {
    const profile = new Profile('my-profile', {
      plugins: [
        {
          plugin: 'test.remove_label',
          options: { label: 'plugin' },
        },
      ],
      phases: [],
    });

    const json = profile.serialize();

    expect(json.plugins).toStrictEqual([
      {
        plugin: 'test.remove_label',
        options: { label: 'plugin' },
      },
    ]);
    expect(json.phases).toStrictEqual([]);
  });
});

describe('Profile.deserialize', () => {
  it('shoud deserialize rules', () => {
    const profile = new Profile('my-profile', {
      supports: GraphologyAdapter,
      phases: [
        [
          createAlwaysMatch(
            NodeQuery.from({ attr: { key: 'label', exists: true } }),
          ),
        ],
      ],
    });

    const json = profile.serialize();

    const restored = Profile.deseriaize(json, {
      GraphologyAdapter,
    });

    expect(restored.serialize()).toStrictEqual(json);
    expect(restored.resolvePhases()).toHaveLength(1);
    expect(restored.resolvePhases()[0]).toHaveLength(1);
  });

  it('shoud deserialize plugin references', () => {
    const profile = new Profile('my-profile', {
      plugins: [
        {
          plugin: 'test.remove_label',
          options: { label: 'plugin' },
        },
      ],
    });
    const json = profile.serialize();
    const restored = Profile.deseriaize(json);

    expect(restored.serialize().plugins).toStrictEqual([
      {
        plugin: 'test.remove_label',
        options: { label: 'plugin' },
      },
    ]);
  });
});

describe('Profile.resolveRendererOptions', () => {
  it('shoud return own renderer options when set', () => {
    const profile = new Profile('my-profile', {
      render: {
        options: {
          graph: {
            rankdir: 'LR',
          },
        },
      },
    });

    expect(profile.resolveRendererOptions()).toEqual({
      graph: {
        rankdir: 'LR',
      },
    });
  });

  it('shoud resolve renderer options from used profiles', () => {
    const child = new Profile('child', {
      render: {
        options: {
          graph: {
            rankdir: 'TB',
          },
        },
      },
    });
    const parent = new Profile('parent', {}).use(child);

    expect(parent.resolveRendererOptions()).toEqual({
      graph: {
        rankdir: 'TB',
      },
    });
  });
});

describe('Profile.resolvePhases', () => {
  it('shoud resolve plugin phases at runtime', () => {
    const profile = new Profile('plugin-profile', {
      plugins: [
        {
          plugin: 'test.remove_label',
          options: { label: 'plugin' },
        },
      ],
    });

    const phases = profile.resolvePhases(undefined, undefined, pluginRegistry);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(1);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'plugin' } } },
    });
  });

  it('shoud auto-prefix plugin named rules and named rule sets', () => {
    class PrefixRulePlugin extends GraphPlugin {
      constructor() {
        super('plugin.prefix');
      }

      public build() {
        return {
          namedRules: {
            remove: {
              id: 'AlwaysMatchRule',
              config: {
                node: { attr: { key: 'label', eq: 'prefixed' } },
              },
            },
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

    const registry = new GraphPluginRegistry({
      'plugin.prefix': new PrefixRulePlugin(),
    });
    const profile = new Profile('plugin-profile', {
      plugins: [{ plugin: 'plugin.prefix' }],
    });

    const phases = profile.resolvePhases(undefined, undefined, registry);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(1);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'prefixed' } } },
    });
  });

  it('shoud throw when plugins are used without a plugin registry', () => {
    const profile = new Profile('plugin-profile', {
      plugins: [{ plugin: 'test.remove_label' }],
    });

    expect(() => profile.resolvePhases()).toThrow(
      "Profile 'plugin-profile' contains plugins but no GraphPluginRegistry was provided",
    );
  });

  it('shoud throw when plugin prefixed names collide', () => {
    const profile = new Profile('plugin-profile', {
      plugins: [{ plugin: 'test.remove_label' }],
    });
    const namedRules = new NamedRuleRegistry({
      'test.remove_label.remove_label': {
        id: 'AlwaysMatchRule',
        config: { node: { any: true } },
      },
    });

    expect(() =>
      profile.resolvePhases(namedRules, undefined, pluginRegistry),
    ).toThrow(
      "GraphPlugin 'test.remove_label' named rule 'test.remove_label.remove_label' collides with an existing named rule",
    );
  });

  it('shoud resolve named rules when a registry is provided', () => {
    const registry = new NamedRuleRegistry({
      removeAlways: {
        id: 'AlwaysMatchRule',
        config: { node: { any: true } },
      },
    });
    const profile = new Profile('named-profile', {
      phases: [[{ namedRule: 'removeAlways' }]],
    });

    const phases = profile.resolvePhases(registry);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(1);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { any: true } },
    });
  });

  it('shoud throw when named rules are used without a registry', () => {
    const profile = new Profile('named-profile', {
      phases: [[{ namedRule: 'removeAlways' }]],
    });

    expect(() => profile.resolvePhases()).toThrow(
      "Profile 'named-profile' contains named rules but no NamedRuleRegistry was provided",
    );
  });

  it('shoud use current named rule definitions after deserialize', () => {
    const profile = new Profile('named-profile', {
      phases: [[{ namedRule: 'removeAlways' }]],
    });

    const serialized = profile.serialize();
    const restored = Profile.deseriaize(serialized);
    const updatedRegistry = new NamedRuleRegistry({
      removeAlways: {
        id: 'AlwaysMatchRule',
        config: {
          node: { attr: { key: 'label', startsWith: 'data.' } },
        },
      },
    });

    const phases = restored.resolvePhases(updatedRegistry);

    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', startsWith: 'data.' } } },
    });
  });

  it('shoud append own phases after used profile phases', () => {
    const used = new Profile('used', {
      phases: [
        [
          createAlwaysMatch(
            NodeQuery.from({ attr: { key: 'label', eq: 'used' } }),
          ),
        ],
      ],
    });
    const current = new Profile('current', {
      usesProfiles: [used],
      phases: [
        [
          createAlwaysMatch(
            NodeQuery.from({ attr: { key: 'label', eq: 'current' } }),
          ),
        ],
      ],
    });

    const phases = current.resolvePhases();

    expect(phases).toHaveLength(2);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'used' } } },
    });
    expect(phases[1][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'current' } } },
    });
  });

  it('shoud resolve named rule sets when a rule set registry is provided', () => {
    const namedRules = new NamedRuleRegistry({
      removeUsed: {
        id: 'AlwaysMatchRule',
        config: { node: { attr: { key: 'label', eq: 'used' } } },
      },
      removeCurrent: {
        id: 'AlwaysMatchRule',
        config: { node: { attr: { key: 'label', eq: 'current' } } },
      },
    });
    const namedRuleSets = new NamedRuleSetRegistry({
      baseSet: new RuleSet({
        rules: [{ namedRule: 'removeUsed' }],
      }),
    });
    const profile = new Profile('named-set-profile', {
      phases: [[{ namedRuleSet: 'baseSet' }, { namedRule: 'removeCurrent' }]],
    });

    const phases = profile.resolvePhases(namedRules, namedRuleSets);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(2);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'used' } } },
    });
    expect(phases[0][1].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'current' } } },
    });
  });

  it('shoud throw when named rule sets are used without a rule set registry', () => {
    const profile = new Profile('named-set-profile', {
      phases: [[{ namedRuleSet: 'baseSet' }]],
    });

    expect(() => profile.resolvePhases()).toThrow(
      "Profile 'named-set-profile' contains named rule sets but no NamedRuleSetRegistry was provided",
    );
  });

  it('shoud resolve nested named rule sets', () => {
    const namedRules = new NamedRuleRegistry({
      removeUsed: {
        id: 'AlwaysMatchRule',
        config: { node: { attr: { key: 'label', eq: 'used' } } },
      },
      removeCurrent: {
        id: 'AlwaysMatchRule',
        config: { node: { attr: { key: 'label', eq: 'current' } } },
      },
    });
    const namedRuleSets = new NamedRuleSetRegistry({
      baseSet: new RuleSet({
        rules: [{ namedRule: 'removeUsed' }],
      }),
      wrapperSet: new RuleSet({
        rules: [{ namedRuleSet: 'baseSet' }, { namedRule: 'removeCurrent' }],
      }),
    });
    const profile = new Profile('named-set-profile', {
      phases: [[{ namedRuleSet: 'wrapperSet' }]],
    });

    const phases = profile.resolvePhases(namedRules, namedRuleSets);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(2);
    expect(phases[0][0].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'used' } } },
    });
    expect(phases[0][1].serialize()).toEqual({
      id: 'AlwaysMatchRule',
      config: { node: { attr: { key: 'label', eq: 'current' } } },
    });
  });
});

describe('Profile.usePlugin', () => {
  it('shoud append plugin references immutably', () => {
    const base = new Profile('plugin-profile', {});
    const updated = base.usePlugin('test.remove_label', { label: 'plugin' });

    expect(base.serialize().plugins ?? []).toHaveLength(0);
    expect(updated.serialize().plugins).toStrictEqual([
      { plugin: 'test.remove_label', options: { label: 'plugin' } },
    ]);
  });
});
