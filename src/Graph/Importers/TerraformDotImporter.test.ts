import { DotAdapter } from '../Adapters/DotAdapter.js';
import { TG_SCHEMA_VERSION, edgeIdFrom, tgNodeIdFrom } from '../TgGraph.js';
import { TerraformDotImporter } from './TerraformDotImporter.js';

const DOT_INPUT = `
digraph {
  "node-a" [label="A" color="red" shape="box"];
  "node-b" [label="B"];
  "node-c";
  "node-a" -> "node-b" [weight=2, style="dashed"];
  "node-b" -> "node-c";
}
`;

const TERRAFORM_ADDRESS_INPUT = `
digraph {
  "cluster_module.module_name" [label="module.module_name"];
  "module.module_name.aws_s3_bucket.bucket" [label="aws_s3_bucket.bucket"];
  "module.module_name.data.aws_iam_policy_document.policy" [label="data.aws_iam_policy_document.policy"];
  "module.module_name.aws_s3_bucket.bucket" -> "module.module_name.data.aws_iam_policy_document.policy";
}
`;

describe('TerraformDotImporter.fromString', () => {
  it('parses nodes and edges with dot adapter attributes', () => {
    const importer = new TerraformDotImporter();
    const result = importer.fromString(DOT_INPUT);

    const nodeA = tgNodeIdFrom('terraform', 'node-a');
    const nodeB = tgNodeIdFrom('terraform', 'node-b');
    const nodeC = tgNodeIdFrom('terraform', 'node-c');

    expect(result.nodes[nodeA]).toEqual(
      expect.objectContaining({
        id: nodeA,
        terraform: {
          kind: 'terraform',
          address: 'node-a',
          resource: 'terraform',
          name: 'node-a',
          moduleAddress: undefined,
        },
        adapter: {
          [DotAdapter.name]: expect.objectContaining({
            color: 'red',
            shape: 'box',
          }),
        },
      }),
    );

    expect(result.nodes[nodeB]).toEqual(
      expect.objectContaining({
        id: nodeB,
      }),
    );
    expect(result.nodes[nodeB].adapter).toBeUndefined();

    expect(result.nodes[nodeC]).toEqual(
      expect.objectContaining({
        id: nodeC,
      }),
    );

    const edgeAB = edgeIdFrom(nodeA, nodeB);
    const edgeBC = edgeIdFrom(nodeB, nodeC);
    const edgesById = Object.fromEntries(
      result.edges.map((edge) => [edge.id, edge]),
    );

    expect(edgesById[edgeAB]).toEqual(
      expect.objectContaining({
        from: nodeA,
        to: nodeB,
        attributes: {
          adapter: {
            [DotAdapter.name]: expect.objectContaining({
              weight: '2',
              style: 'dashed',
            }),
          },
        },
      }),
    );

    expect(edgesById[edgeBC]).toEqual(
      expect.objectContaining({
        from: nodeB,
        to: nodeC,
        attributes: undefined,
      }),
    );

    expect(result.schemaVersion).toBe(TG_SCHEMA_VERSION);
  });

  it('uses the provided description', () => {
    const importer = new TerraformDotImporter();
    const result = importer.fromString(DOT_INPUT, {
      description: { source: 'terraform' },
    });

    expect(result.description).toEqual({ source: 'terraform' });
  });

  it('creates namespaced terraform-address ids by node kind', () => {
    const importer = new TerraformDotImporter();
    const result = importer.fromString(TERRAFORM_ADDRESS_INPUT);

    const moduleId = tgNodeIdFrom('module', 'module.module_name');
    const resourceId = tgNodeIdFrom(
      'resource',
      'module.module_name.aws_s3_bucket.bucket',
    );
    const dataId = tgNodeIdFrom(
      'data',
      'module.module_name.data.aws_iam_policy_document.policy',
    );
    const edgeId = edgeIdFrom(resourceId, dataId);

    expect(result.nodes[moduleId]).toEqual(
      expect.objectContaining({
        id: moduleId,
        terraform: {
          kind: 'module',
          address: 'module.module_name',
          resource: 'module',
          name: 'module_name',
          moduleAddress: undefined,
        },
      }),
    );
    expect(result.nodes[resourceId]).toEqual(
      expect.objectContaining({
        id: resourceId,
        terraform: {
          kind: 'resource',
          address: 'module.module_name.aws_s3_bucket.bucket',
          resource: 'aws_s3_bucket',
          name: 'bucket',
          moduleAddress: 'module.module_name',
          parentModuleName: 'module_name',
          parentModuleNodeId: moduleId,
        },
      }),
    );
    expect(result.nodes[dataId]).toEqual(
      expect.objectContaining({
        id: dataId,
        terraform: {
          kind: 'data',
          address: 'module.module_name.data.aws_iam_policy_document.policy',
          resource: 'aws_iam_policy_document',
          name: 'policy',
          moduleAddress: 'module.module_name',
          parentModuleName: 'module_name',
          parentModuleNodeId: moduleId,
        },
      }),
    );
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: edgeId,
          from: resourceId,
          to: dataId,
        }),
      ]),
    );
  });
});
