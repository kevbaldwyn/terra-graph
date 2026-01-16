import { EdgeId, asEdgeId, edgeIdFrom, NodeId, asNodeId } from "./TgGraph.js";

describe('Test edgeIdFrom()', () => {
  it('should create expected id without suffix', () => {
    expect(edgeIdFrom(asNodeId('from'), asNodeId('to'))).toStrictEqual('from:to');
  });

  it('should create expected id with suffix', () => {
    expect(edgeIdFrom(asNodeId('from'), asNodeId('to'), 'suffix')).toStrictEqual('from:to:suffix');
  });
});

describe('Test asNodeId()', () => {
  it('should return the same string value, branded as a NodeId', () => {
    const id = asNodeId('node-1');
    expect(id).toBe('node-1');
    const _assert: NodeId = id;
  });
});

describe('Test asEdgeId()', () => {
  it('should return the same string value, branded as an EdgeId', () => {
    const id = asEdgeId('edge-1');
    expect(id).toBe('edge-1');
    const _assert: EdgeId = id;
  });
});
