import { DotAdapter } from '../Adapters/DotAdapter.js';
import { asNodeId, edgeIdFrom } from '../TgGraph.js';
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

describe('TerraformDotImporter.fromString', () => {
  it('parses nodes and edges with dot adapter attributes', () => {
    const importer = new TerraformDotImporter();
    const result = importer.fromString(DOT_INPUT);

    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');

    expect(result.nodes[nodeA]).toEqual(
      expect.objectContaining({
        id: nodeA,
        label: 'A',
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
        label: 'B',
      }),
    );
    expect(result.nodes[nodeB].adapter).toBeUndefined();

    expect(result.nodes[nodeC]).toEqual(
      expect.objectContaining({
        id: nodeC,
        label: 'node-c',
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
  });

  it('uses the provided description', () => {
    const importer = new TerraformDotImporter();
    const result = importer.fromString(DOT_INPUT, {
      description: { source: 'terraform' },
    });

    expect(result.description).toEqual({ source: 'terraform' });
  });
});
