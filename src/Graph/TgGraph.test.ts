import { EdgeId, NodeId, asEdgeId, asNodeId, edgeIdFrom } from './TgGraph.js';

describe('TgGraph.edgeIdFrom', () => {
  it('should create expected id without suffix', () => {
    expect(edgeIdFrom(asNodeId('from'), asNodeId('to'))).toStrictEqual(
      'from:to',
    );
  });

  it('should create expected id with suffix', () => {
    expect(
      edgeIdFrom(asNodeId('from'), asNodeId('to'), 'suffix'),
    ).toStrictEqual('from:to:suffix');
  });
});

describe('TgGraph.asNodeId', () => {
  it('should return the same string value, branded as a NodeId', () => {
    const id = asNodeId('node-1');
    expect(id).toBe('node-1');
    const _assert: NodeId = id;
  });
});

describe('TgGraph.asEdgeId', () => {
  it('should return the same string value, branded as an EdgeId', () => {
    const id = asEdgeId('edge-1');
    expect(id).toBe('edge-1');
    const _assert: EdgeId = id;
  });
});
