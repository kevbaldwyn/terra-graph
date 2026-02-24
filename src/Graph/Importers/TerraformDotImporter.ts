import { Graph as GraphLibGraph } from 'graphlib';
import dot from 'graphlib-dot';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { ImportContext, Importer } from '../Importer.js';
import {
  TG_SCHEMA_VERSION,
  TgEdgeAttributes,
  TgGraph,
  TgNodeKind,
  TgNode,
  TgNodeTerraform,
  edgeIdFrom,
  tgNodeIdFrom,
} from '../TgGraph.js';

type GraphLibEdge = { v: string; w: string; name?: string };

export class TerraformDotImporter implements Importer {
  public fromString(input: string, context: ImportContext = {}): TgGraph {
    const graph = dot.read(input) as GraphLibGraph;
    const nodes: Record<string, TgNode> = {};
    const edges: TgGraph['edges'] = [];
    const nodeIdMap = new Map<string, TgNode['id']>();

    for (const rawNodeId of graph.nodes()) {
      const attributes = (graph.node(rawNodeId) ?? {}) as Record<
        string,
        unknown
      >;
      const { label, ...adapterAttributes } = attributes;
      const address = this.resolveAddress(
        rawNodeId,
        typeof label === 'string' ? label : undefined,
      );
      const kind = this.resolveKind(address);
      const nodeDetails = this.describeNode(address, kind);
      const id = tgNodeIdFrom(kind, address);
      const node: TgNode = {
        id,
        terraform: nodeDetails,
      };

      if (Object.keys(adapterAttributes).length > 0) {
        node.adapter = {
          [DotAdapter.name]: adapterAttributes,
        };
      }

      nodes[id] = node;
      nodeIdMap.set(rawNodeId, id);
    }

    for (const edge of graph.edges() as GraphLibEdge[]) {
      const from = this.resolveNodeId(
        edge.v,
        graph.node(edge.v) as Record<string, unknown> | undefined,
        nodeIdMap,
      );
      const to = this.resolveNodeId(
        edge.w,
        graph.node(edge.w) as Record<string, unknown> | undefined,
        nodeIdMap,
      );
      const suffix = edge.name === undefined ? undefined : String(edge.name);
      const edgeId = edgeIdFrom(from, to, suffix);
      const attributes = (graph.edge(edge) ?? {}) as Record<string, unknown>;

      let edgeAttributes: TgEdgeAttributes | undefined;
      if (Object.keys(attributes).length > 0) {
        edgeAttributes = {
          adapter: {
            [DotAdapter.name]: attributes,
          },
        };
      }

      edges.push({
        id: edgeId,
        from,
        to,
        attributes: edgeAttributes,
      });
    }

    return {
      schemaVersion: TG_SCHEMA_VERSION,
      description: context.description ?? {},
      nodes,
      edges,
    };
  }

  private resolveNodeId(
    rawNodeId: string,
    nodeAttributes: Record<string, unknown> | undefined,
    nodeIdMap: Map<string, TgNode['id']>,
  ): TgNode['id'] {
    const existing = nodeIdMap.get(rawNodeId);
    if (existing) {
      return existing;
    }

    const label = nodeAttributes?.label;
    const address = this.resolveAddress(
      rawNodeId,
      typeof label === 'string' ? label : undefined,
    );
    const kind = this.resolveKind(address);
    const nodeId = tgNodeIdFrom(kind, address);
    nodeIdMap.set(rawNodeId, nodeId);
    return nodeId;
  }

  private resolveAddress(rawNodeId: string, label?: string): string {
    const normalizedRaw = this.normalizeAddress(rawNodeId);

    if (normalizedRaw.startsWith('cluster_module.')) {
      return `module.${normalizedRaw.slice('cluster_module.'.length)}`;
    }

    if (!label) {
      return normalizedRaw;
    }

    const normalizedLabel = this.normalizeAddress(label);
    if (
      normalizedRaw.startsWith('module.') &&
      !normalizedLabel.startsWith('module.')
    ) {
      const modulePrefix = this.extractModulePrefix(normalizedRaw);
      if (modulePrefix) {
        return `${modulePrefix}.${normalizedLabel}`;
      }
    }

    return normalizedRaw;
  }

  private normalizeAddress(value: string): string {
    return value
      .trim()
      .replace(/^\[root\]\s*/, '')
      .replace(/\s+\([^)]*\)$/, '');
  }

  private extractModulePrefix(value: string): string | undefined {
    const segments = value.split('.');
    let index = 0;

    while (segments[index] === 'module' && segments[index + 1]) {
      index += 2;
    }

    if (index === 0) {
      return undefined;
    }

    return segments.slice(0, index).join('.');
  }

  private resolveKind(address: string): TgNodeKind {
    if (address === 'root') {
      return 'root';
    }

    const segments = address.split('.');
    let index = 0;
    while (segments[index] === 'module' && segments[index + 1]) {
      index += 2;
    }

    const head = segments[index] ?? '';
    if (head === 'data') {
      return 'data';
    }
    if (head === 'local') {
      return 'local';
    }
    if (head === 'var') {
      return 'var';
    }
    if (head === 'output') {
      return 'output';
    }
    if (head === 'meta') {
      return 'meta';
    }
    if (head.startsWith('provider[') || address.startsWith('provider[')) {
      return 'provider';
    }

    if (address.startsWith('module.') && index >= segments.length) {
      return 'module';
    }

    return segments.length > 1 ? 'resource' : 'terraform';
  }

  private describeNode(
    address: string,
    kind: TgNodeKind,
  ): TgNodeTerraform {
    const segments = address.split('.');
    let index = 0;
    while (segments[index] === 'module' && segments[index + 1]) {
      index += 2;
    }

    const moduleAddress =
      index > 0 ? segments.slice(0, index).join('.') : undefined;
    const tail = segments.slice(index);

    if (kind === 'resource') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: tail[0],
        name: tail[1],
      };
    }

    if (kind === 'data') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: tail[1],
        name: tail[2],
      };
    }

    if (kind === 'local' || kind === 'var' || kind === 'output') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: kind,
        name: tail[1] ?? tail[0],
      };
    }

    if (kind === 'module') {
      const moduleSegments = segments.slice(0, index);
      const parentModuleAddress =
        moduleSegments.length > 2
          ? moduleSegments.slice(0, moduleSegments.length - 2).join('.')
          : undefined;
      return {
        kind,
        address,
        moduleAddress: parentModuleAddress,
        ...this.parentModuleHelpers(parentModuleAddress),
        resource: 'module',
        name: moduleSegments[moduleSegments.length - 1] ?? address,
      };
    }

    if (kind === 'provider') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: 'provider',
        name: tail.join('.') || address,
      };
    }

    if (kind === 'root') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: 'root',
        name: 'root',
      };
    }

    if (kind === 'meta') {
      return {
        kind,
        address,
        moduleAddress,
        ...this.parentModuleHelpers(moduleAddress),
        resource: 'meta',
        name: tail.join('.') || address,
      };
    }

    return {
      kind,
      address,
      moduleAddress,
      ...this.parentModuleHelpers(moduleAddress),
      resource: 'terraform',
      name: address,
    };
  }

  private parentModuleHelpers(
    moduleAddress: string | undefined,
  ): Pick<TgNodeTerraform, 'parentModuleName' | 'parentModuleNodeId'> {
    if (!moduleAddress) {
      return {};
    }

    const parts = moduleAddress.split('.');
    return {
      parentModuleName: parts[parts.length - 1] ?? moduleAddress,
      parentModuleNodeId: tgNodeIdFrom('module', moduleAddress),
    };
  }
}
