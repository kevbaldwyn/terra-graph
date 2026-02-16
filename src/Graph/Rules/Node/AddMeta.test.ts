import { mock } from 'jest-mock-extended';
import { AdapterOperations } from '../../Operations/Operations.js';
import { TgNodeAttributes, asNodeId } from '../../TgGraph.js';
import { AddMeta } from './AddMeta.js';

describe('AddMeta.apply', () => {
  it('shoud add meta when the query matches', () => {
    const hook = new AddMeta();
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

  it('shoud keep graph unchanged when apply is called before match', () => {
    const hook = new AddMeta();
    const graph = mock<AdapterOperations>();

    const nodeId = asNodeId('resource.name');
    const node: TgNodeAttributes = { label: 'resource.other' };

    const result = hook.apply(nodeId, node, graph);

    expect(graph.setNodeAttributes).not.toHaveBeenCalled();
    expect(result).toBe(graph);
  });
});
