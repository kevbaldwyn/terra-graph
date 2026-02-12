import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { Operations } from '../Operations.js';

export type NodeMatchFn = (
  nodeId: NodeId,
  node: TgNodeAttributes,
  graph: Operations,
) => boolean;
