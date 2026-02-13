import { mock } from 'jest-mock-extended';
import { TgNodeAttributes, asNodeId } from '../../TgGraph.js';
import { AdapterOperations } from '../../Operations/Operations.js';
import { AddMeta } from './AddMeta.js';

describe('AddMeta.apply', () => {
  it('shoud add meta when the query matches', () => {
    const hook = new AddMeta({
      node: { attr: { key: 'label', eq: 'resource.name' } },
    });
    const graph = mock<AdapterOperations>();
    const nextGraph = mock<AdapterOperations>();
    graph.setNodeAttributes.mockReturnValue(nextGraph);

    const nodeId = asNodeId('resource.name');
    const node: TgNodeAttributes = { label: 'resource.name' };

    hook.match(nodeId, node, graph);
    const result = hook.apply(nodeId, node, graph);

    expect(graph.setNodeAttributes).toHaveBeenCalledWith(nodeId, {
      ...node,
      meta: {
        resource: 'resource',
        name: 'name',
      },
    });
    expect(result).toBe(nextGraph);
  });

  it('shoud keep graph unchanged when the query does not match', () => {
    const hook = new AddMeta({
      node: { attr: { key: 'label', eq: 'resource.name' } },
    });
    const graph = mock<AdapterOperations>();

    const nodeId = asNodeId('resource.name');
    const node: TgNodeAttributes = { label: 'resource.other' };

    hook.match(nodeId, node, graph);
    const result = hook.apply(nodeId, node, graph);

    expect(graph.setNodeAttributes).not.toHaveBeenCalled();
    expect(result).toBe(graph);
  });
});
