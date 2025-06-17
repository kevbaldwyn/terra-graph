import { Graph } from '../Graph/Graph.js';

// TODO: list the DOT Language attributes here
export interface Node extends Record<string, unknown> {
  shape: string;
  fontname: string;
  label: string;
}
export interface NodeWithMeta extends Node {
  meta?: {
    resource: string;
    name: string;
  };
}
export interface NodeWithParent extends NodeWithMeta {
  parent?: {
    node: NodeWithMeta;
    nodeName: string;
    label: string;
    isModule: boolean;
  };
}

export interface EdgeOptions extends Record<string, string | undefined> {
  key?: string;
}

export const rootName = (label: string | NodeWithParent): string => {
  if (
    typeof label === 'object' &&
    label !== null &&
    'meta' in label &&
    label.meta &&
    typeof label.meta.resource === 'string'
  ) {
    return label.meta.resource;
  }
  if (typeof label === 'string') {
    return label.split('.')[0];
  }
  return '';
};

export const leafName = (label: string | NodeWithParent): string => {
  if (typeof label === 'object' && label !== null && 'parent' in label) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return label.parent!.label.split('.')[1];
  }

  if (typeof label === 'object' && label !== null) {
    return label.meta?.name ?? '';
  }

  return String(label).split('.').pop() as string;
};

// export const moduleResource = (label: string) => label.split(".")[2];

const htmlTableWithImage = (
  resource: string,
  name: string,
  image: string,
) => `<<table align="left" border="0" cellpadding="0" cellspacing="0" cellborder="0">
  <tr>
    <td align="left" rowspan="2"><img src="${image}" /></td>
    <td align="left">&nbsp;&nbsp;${name}</td>
  </tr>
  <tr>
    <td align="left"><font point-size="10" color="#999999">&nbsp;&nbsp;${resource}</font></td>
  </tr>
</table>>`;

const htmlTablePlain = (
  resource: string,
  name: string,
) => `<<table align="left" border="0" cellpadding="0" cellspacing="0" cellborder="0">
  <tr>
    <td align="left">${name}</td>
  </tr>
  <tr>
    <td align="left"><font point-size="10" color="#999999">${resource}</font></td>
  </tr>
</table>>`;

export const htmlLabel = (resource: string, name: string, image?: string) => {
  return image
    ? htmlTableWithImage(resource, name, image)
    : htmlTablePlain(resource, name);
};
