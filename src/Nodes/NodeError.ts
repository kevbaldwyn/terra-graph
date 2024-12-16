import { Node } from "./Node.js";

type ErrorProps = {
  nodeName: string;
  node: Node;
};

export class NodeModifyError extends Error {
  constructor(options: ErrorOptions, private readonly props: ErrorProps) {
    super(`Hook was unable to modify node ${props.nodeName}`, options);
  }
}

export class NodeMatchError extends Error {
  constructor(options: ErrorOptions, private readonly props: ErrorProps) {
    super(`Hook was unable to match node ${props.nodeName}`, options);
  }
}
