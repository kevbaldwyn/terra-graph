import { mock } from 'jest-mock-extended';
import { TgNodeAttributes, asNodeId } from '../../TgGraph.js';
import { AdapterOperations } from '../../Operations/Operations.js';
import { RemoveNode } from './RemoveNode.js';

describe('RemoveNode.apply', () => {
  it('shoud remove node when the query matches', () => {
    const hook = new RemoveNode({
      node: { attr: { key: 'label', eq: 'node-1' } },
    });
    const graph = mock<AdapterOperations>();
    const nextGraph = mock<AdapterOperations>();
    graph.removeNode.mockReturnValue(nextGraph);

    const nodeId = asNodeId('node-1');
    const node: TgNodeAttributes = { label: 'node-1' };

    hook.match(nodeId, node, graph);
    const result = hook.apply(nodeId, node, graph);

    expect(graph.removeNode).toHaveBeenCalledWith(nodeId);
    expect(result).toBe(nextGraph);
  });

  it('shoud keep graph unchanged when the query does not match', () => {
    const hook = new RemoveNode({
      node: { attr: { key: 'label', eq: 'node-1' } },
    });
    const graph = mock<AdapterOperations>();

    const nodeId = asNodeId('node-1');
    const node: TgNodeAttributes = { label: 'other' };

    hook.match(nodeId, node, graph);
    const result = hook.apply(nodeId, node, graph);

    expect(graph.removeNode).not.toHaveBeenCalled();
    expect(result).toBe(graph);
  });
});
