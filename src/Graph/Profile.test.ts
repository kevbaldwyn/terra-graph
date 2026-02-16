import { GraphologyAdapter } from './Adapters/GraphologyAdapter.js';
import { NodeQuery } from './Operations/Matchers/NodeQuery/NodeQuery.js';
import { AdapterOperations } from './Operations/Operations.js';
import { Profile } from './Profile.js';
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
