import { GraphologyAdapter } from './Adapters/GraphologyAdapter.js';
import { NodeQuery } from './Operations/Matchers/NodeQuery/NodeQuery.js';
import { AdapterOperations } from './Operations/Operations.js';
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
