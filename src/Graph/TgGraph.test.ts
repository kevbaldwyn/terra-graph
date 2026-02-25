import {
  EdgeId,
  NodeId,
  TG_EDGE_DIRECTION_SEMANTICS,
  TG_SCHEMA_VERSION,
  asEdgeId,
  asNodeId,
  edgeIdFrom,
  parseTgNodeId,
  tgNodeIdFrom,
} from './TgGraph.js';

describe('TgGraph.edgeIdFrom', () => {
  it('should create expected id without suffix', () => {
    expect(edgeIdFrom(asNodeId('from'), asNodeId('to'))).toStrictEqual(
      `tg:${TG_SCHEMA_VERSION}:edge:from->to`,
    );
  });

  it('should create expected id with suffix', () => {
    expect(
      edgeIdFrom(asNodeId('from'), asNodeId('to'), 'suffix'),
    ).toStrictEqual(`tg:${TG_SCHEMA_VERSION}:edge:from->to:suffix`);
  });
});

describe('TgGraph.tgNodeIdFrom', () => {
  it('should create expected namespaced id', () => {
    expect(tgNodeIdFrom('resource', 'aws_s3_bucket.example')).toStrictEqual(
      `tg:${TG_SCHEMA_VERSION}:resource:aws_s3_bucket.example`,
    );
  });
});

describe('TgGraph.parseTgNodeId', () => {
  it('should parse namespaced ids', () => {
    expect(
      parseTgNodeId(`tg:${TG_SCHEMA_VERSION}:resource:aws_s3_bucket.example`),
    ).toStrictEqual({
      namespace: 'tg',
      version: TG_SCHEMA_VERSION,
      kind: 'resource',
      address: 'aws_s3_bucket.example',
    });
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

describe('TgGraph.TgEdgeDirectionSemantic', () => {
  it('should include expected direction semantic values', () => {
    expect(TG_EDGE_DIRECTION_SEMANTICS).toStrictEqual([
      'invokes',
      'accesses',
      'publishes',
      'triggers',
      'routes',
      'authorizes',
      'observedBy',
    ]);
  });
});
