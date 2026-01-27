export type HookErrorProps<NodeAttributes> = {
  nodeId: string;
  nodeAttributes: NodeAttributes;
};

export class HookModifyError<NodeAttributes> extends Error {
  constructor(
    options: ErrorOptions,
    private readonly props: HookErrorProps<NodeAttributes>,
  ) {
    super(`Hook was unable to modify node ${props.nodeId}`, options);
  }
}

export class HookMatchError<NodeAttributes> extends Error {
  constructor(
    options: ErrorOptions,
    private readonly props: HookErrorProps<NodeAttributes>,
  ) {
    super(`Hook was unable to match node ${props.nodeId}`, options);
  }
}
