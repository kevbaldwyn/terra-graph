import { mock } from 'jest-mock-extended';
import { TgNodeAttributes, asNodeId } from '../../TgGraph.js';
import { AdapterOperations } from '../Operations.js';
import { AddModuleParent } from './AddModuleParent.js';

describe('AddModuleParent.apply', () => {
  it('shoud set parent for nodes in the same module', () => {
    const hook = new AddModuleParent();
    const graph = mock<AdapterOperations>();
    graph.setNodeAttributes.mockReturnValue(graph);

    const moduleId = asNodeId('cluster_module.example');
    const moduleNode: TgNodeAttributes = { label: 'module.example' };
    const childOneId = asNodeId('module.example.resource.one');
    const childTwoId = asNodeId('module.example.resource.two');
    const otherId = asNodeId('module.other.resource.one');

    const nodes = new Map<string, TgNodeAttributes>([
      [moduleId, moduleNode],
      [childOneId, { label: 'module.example.resource.one' }],
      [childTwoId, { label: 'module.example.resource.two' }],
      [otherId, { label: 'module.other.resource.one' }],
    ]);

    graph.nodeIds.mockReturnValue([moduleId, childOneId, childTwoId, otherId]);
    graph.getNodeAttributes.mockImplementation((nodeId) =>
      nodes.get(String(nodeId)),
    );

    hook.match(moduleId, moduleNode, graph);
    const result = hook.apply(moduleId, moduleNode, graph);

    expect(graph.setNodeAttributes).toHaveBeenCalledTimes(2);
    expect(graph.setNodeAttributes).toHaveBeenNthCalledWith(1, childOneId, {
      label: 'module.example.resource.one',
      parent: {
        id: moduleId,
        isModule: true,
        nodeName: 'cluster_module.example',
      },
    });
    expect(graph.setNodeAttributes).toHaveBeenNthCalledWith(2, childTwoId, {
      label: 'module.example.resource.two',
      parent: {
        id: moduleId,
        isModule: true,
        nodeName: 'cluster_module.example',
      },
    });
    expect(result).toBe(graph);
  });

  it('shoud keep graph unchanged when the query does not match', () => {
    const hook = new AddModuleParent();
    const graph = mock<AdapterOperations>();
    graph.setNodeAttributes.mockReturnValue(graph);

    const nodeId = asNodeId('module.other');
    const node: TgNodeAttributes = { label: 'module.other' };

    hook.match(nodeId, node, graph);
    const result = hook.apply(nodeId, node, graph);

    expect(graph.setNodeAttributes).not.toHaveBeenCalled();
    expect(result).toBe(graph);
  });
});
