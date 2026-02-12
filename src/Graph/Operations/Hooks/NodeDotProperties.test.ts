import { DirectedGraph } from 'graphology';
import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { TgGraph, asNodeId } from '../../TgGraph.js';
import { NodeDotProperties } from './NodeDotProperties.js';

describe('NodeDotProperties.apply', () => {
  it('shoud store dot adapter options for module nodes', () => {
    const moduleId = asNodeId('cluster_module.example');
    const tg: TgGraph = {
      description: {},
      nodes: {
        [moduleId]: { id: moduleId, label: 'module.example' },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(moduleId);
    if (!node) {
      throw new Error('Missing node attributes for module');
    }

    const hook = new NodeDotProperties({
      node: { nodeId: { eq: moduleId.toString() } },
      options: {
        peripheries: 0,
        label: '',
        height: 0,
        width: 0,
      },
    });

    hook.match(moduleId, node, adapter);
    const result = hook.apply(moduleId, node, adapter);

    expect(result.getNodeAttributes(moduleId)).toEqual({
      ...node,
      adapter: {
        [DotAdapter.name]: {
          peripheries: 0,
          label: '',
          height: 0,
          width: 0,
        },
      },
    });
  });
});
