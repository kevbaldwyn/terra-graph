import { GraphologyAdapter } from './Adapters/GraphologyAdapter.js';
import { Hook } from './Hooks/Hooks.js';
import { Profile } from './Profile.js';
import { NodeHook } from './Operations/Hooks.js';
import { HookRegistry } from './Serialization/Registry.js';
import { TgEdgeAttributes, TgNodeAttributes } from './TgGraph.js';

const createAlwaysMatch = (config?: { remove?: boolean }): NodeHook<
  TgNodeAttributes,
  TgEdgeAttributes
> => ({
  match: () => true,
  apply: (nodeId, _node, graph) => {
    if (config?.remove) {
      return graph.removeNode(nodeId);
    }
    return graph;
  },
  serialize: () => ({ id: 'alwaysMatch', config }),
});

describe('Profile serialization example', () => {
  it('shoud serialize and deserialize hooks', () => {
    const profile = new Profile('my-profile', {
      operationsType: GraphologyAdapter,
      hooks: {
        [Hook.META_BEFORE]: [createAlwaysMatch({ remove: true })],
      },
    });

    const json = profile.toJson();

    const hookRegistry: HookRegistry = {
      alwaysMatch: (config) =>
        createAlwaysMatch(config as { remove?: boolean }),
    };

    const restored = Profile.fromJson(json, hookRegistry, {
      GraphologyAdapter,
    });

    expect(restored.toJson()).toStrictEqual(json);
    expect(restored.resolveHooks()[Hook.META_BEFORE]?.length).toBe(1);
  });
});
