export type RuleErrorProps<NodeAttributes> = {
  nodeId: string;
  nodeAttributes: NodeAttributes;
};

export class RuleModifyError<NodeAttributes> extends Error {
  constructor(
    options: ErrorOptions,
    private readonly props: RuleErrorProps<NodeAttributes>,
  ) {
    super(`Rule was unable to modify node ${props.nodeId}`, options);
  }
}

export class RuleMatchError<NodeAttributes> extends Error {
  constructor(
    options: ErrorOptions,
    private readonly props: RuleErrorProps<NodeAttributes>,
  ) {
    super(`Rule was unable to match node ${props.nodeId}`, options);
  }
}
