import { RuleMatchError, RuleModifyError } from './RuleError.js';
import { BaseRule } from './Rules/Rule.js';
import { AdapterOperations } from './Operations/Operations.js';
import { NodeId, TgGraph } from './TgGraph.js';
import { Renderer } from './Renderer.js';

// TODO: better name not bound to rules
export type PhaseRunnerContext = {
  logger?: (message: string) => void;
  errorHandler?: (error: Error) => void;
};

// export type GraphResolverInput<AdapterType extends Adapter & Operations> = {
export type GraphResolverInput = {
  graph: TgGraph;
  // phases are ordered arrays of rules to apply sequentially
  phases: BaseRule[][];
  context?: PhaseRunnerContext;
};

export class GraphResolver {
  // private adapter?: Adapter;

  constructor(private readonly adapter: AdapterOperations) {}

  public resolve(input: GraphResolverInput): AdapterOperations {
    let adapter = this.adapter.withTgGraph(input.graph);
    const phases = input.phases ?? [];
    for (const [index, phase] of phases.entries()) {
      const phaseLabel = `phase-${index + 1}`;
      this.log(
        input.context,
        `applying ${phaseLabel}: ${adapter.nodeIds().length} nodes`,
      );
      adapter = this.modify(adapter, phase, input.context, phaseLabel);
    }
    // this.adapter = adapter;

    return adapter;
  }

  // public render(): string {
  //   if (!this.adapter) {
  //     throw new Error('No adapter defined when trying to render');
  //   }

  //   // this feels weird
  //   return this.adapter.getRenderer().render(this.adapter);
  // }

  private modify(
    adapter: AdapterOperations,
    rules: BaseRule[],
    context?: PhaseRunnerContext,
    logPrefix = 'phase',
  ): AdapterOperations {
    let updated = adapter;
    const nodeIds = adapter.nodeIds();

    for (const nodeId of nodeIds) {
      for (const rule of rules) {
        const node = updated.getNodeAttributes(nodeId);
        if (!node) {
          break;
        }
        try {
          if (rule.match(nodeId, node, updated)) {
            if (rule.describe) {
              this.log(
                context,
                this.logMessage(
                  `${logPrefix}:match`,
                  rule.describe(nodeId, node),
                  nodeId,
                ),
              );
            }
            try {
              if (!rule.supports(updated)) {
                continue;
              }
              updated = rule.apply(nodeId, node, updated);
            } catch (e) {
              throw new RuleModifyError(
                { cause: e as Error },
                {
                  nodeId: nodeId as unknown as string,
                  nodeAttributes: node,
                },
              );
            }
          }
        } catch (e) {
          if (!(e instanceof RuleModifyError)) {
            // biome-ignore lint/suspicious/noCatchAssign: <explanation>
            e = new RuleMatchError(
              { cause: e as Error },
              {
                nodeId: nodeId as unknown as string,
                nodeAttributes: node,
              },
            );
          }
          this.handleError(context, e as Error);
        }
      }
    }
    return updated;
  }

  private log(context: PhaseRunnerContext | undefined, message: string) {
    if (context?.logger) {
      context.logger(message);
    }
  }

  private handleError(context: PhaseRunnerContext | undefined, error: Error) {
    if (context?.errorHandler) {
      context.errorHandler(error);
      return;
    }
    throw error;
  }

  private logMessage(prefix: string, msg: string, nodeName: NodeId) {
    return ` -> [${prefix}][${msg}]: ${nodeName}`;
  }
}
