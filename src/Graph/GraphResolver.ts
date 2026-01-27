import { Adapter, AdapterFactory } from './Adapter.js';
import { Hook } from './Hooks/Hooks.js';
import { HookMatchError, HookModifyError } from './HookError.js';
import { Operations } from './Operations/Operations.js';
import { HookMap, NodeHook, getHooks } from './Operations/Hooks.js';
import { NodeId, TgGraph } from './TgGraph.js';

type NodeAttributesOf<AdapterType> = AdapterType extends Operations<
  infer NodeAttributes extends Record<string, unknown>,
  infer _EdgeAttributes extends Record<string, unknown>
>
  ? NodeAttributes
  : Record<string, unknown>;

type EdgeAttributesOf<AdapterType> = AdapterType extends Operations<
  infer _NodeAttributes extends Record<string, unknown>,
  infer EdgeAttributes extends Record<string, unknown>
>
  ? EdgeAttributes
  : Record<string, unknown>;

type AdapterOperations<AdapterType> = Operations<
  NodeAttributesOf<AdapterType>,
  EdgeAttributesOf<AdapterType>
>;

// TODO: better name not bound to hooks
export type HookRunnerContext = {
  logger?: (message: string) => void;
  errorHandler?: (error: Error) => void;
};

// export type GraphResolverInput<AdapterType extends Adapter & Operations> = {
export type GraphResolverInput<
  AdapterType extends Adapter &
    Operations<Record<string, unknown>, Record<string, unknown>>,
> = {
  graph: TgGraph;
  // hooks will be pre-solved,
  // the aim will be to have a set of hooks defined within a Profile
  // hooks could therfore be generic (any Operations/Adapter interface)
  // or apply only to specific Operations/Adapter interface
  hooks: HookMap<NodeAttributesOf<AdapterType>, EdgeAttributesOf<AdapterType>>;
  // hooks: OperationsHookMap<AdapterType>;
  context?: HookRunnerContext;
};

export class GraphResolver<
  AdapterType extends Adapter &
    Operations<Record<string, unknown>, Record<string, unknown>>,
> {
  constructor(private readonly adapterFactory: AdapterFactory<AdapterType>) {}

  resolve(input: GraphResolverInput<AdapterType>): AdapterType {
    const hooks = input.hooks;

    let adapter = this.adapterFactory.fromTgGraph(input.graph);

    this.log(
      input.context,
      `applying first filter: ${adapter.nodeIds().length} nodes`,
    );
    adapter = this.modify(
      this.modify(
        adapter,
        this.getHooks(Hook.META_BEFORE, hooks),
        input.context,
        'filter',
      ),
      this.getHooks(Hook.META_BEFORE, hooks),
      input.context,
      'filter',
    );

    this.log(
      input.context,
      `applying meta data: ${adapter.nodeIds().length} nodes`,
    );
    adapter = this.modify(
      this.modify(
        adapter,
        this.getHooks(Hook.META_APPLY, hooks),
        input.context,
        'decorate',
      ),
      this.getHooks(Hook.META_APPLY, hooks),
      input.context,
      'decorate',
    );

    this.log(
      input.context,
      `applying final filter: ${adapter.nodeIds().length} nodes`,
    );
    adapter = this.modify(
      this.modify(
        adapter,
        this.getHooks(Hook.GRAPH_FILTER, hooks),
        input.context,
        'filter',
      ),
      this.getHooks(Hook.GRAPH_FILTER, hooks),
      input.context,
      'filter',
    );

    this.log(
      input.context,
      `decorating graph: ${adapter.nodeIds().length} nodes`,
    );
    adapter = this.modify(
      this.modify(
        adapter,
        this.getHooks(Hook.GRAPH_DECORATE, hooks),
        input.context,
        'decorate',
      ),
      this.getHooks(Hook.GRAPH_DECORATE, hooks),
      input.context,
      'decorate',
    );

    return adapter;
  }

  private modify(
    adapter: AdapterType,
    hooks: NodeHook<
      NodeAttributesOf<AdapterType>,
      EdgeAttributesOf<AdapterType>
    >[],
    context?: HookRunnerContext,
    logPrefix: 'filter' | 'decorate' = 'decorate',
  ): AdapterType {
    let updated = adapter;
    const nodeIds = adapter.nodeIds();

    for (const nodeId of nodeIds) {
      for (const hook of hooks) {
        const operations = this.asOperations(updated);
        const node = operations.getNodeAttributes(nodeId);
        if (!node) {
          break;
        }
        try {
          if (hook.match(nodeId, node, operations)) {
            if (hook.describe) {
              this.log(
                context,
                this.logMessage(
                  `${logPrefix}:match`,
                  hook.describe(nodeId, node),
                  nodeId,
                ),
              );
            }
            try {
              const modified = hook.apply(nodeId, node, operations);
              if (modified) {
                updated = this.asAdapter(modified);
              }
            } catch (e) {
              throw new HookModifyError(
                { cause: e as Error },
                {
                  nodeId: nodeId as unknown as string,
                  nodeAttributes: node,
                },
              );
            }
          }
        } catch (e) {
          if (!(e instanceof HookModifyError)) {
            // biome-ignore lint/suspicious/noCatchAssign: <explanation>
            e = new HookMatchError(
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

  private log(context: HookRunnerContext | undefined, message: string) {
    if (context?.logger) {
      context.logger(message);
    }
  }

  private handleError(context: HookRunnerContext | undefined, error: Error) {
    if (context?.errorHandler) {
      context.errorHandler(error);
      return;
    }
    throw error;
  }

  private logMessage(prefix: string, msg: string, nodeName: NodeId) {
    return ` -> [${prefix}][${msg}]: ${nodeName}`;
  }

  private getHooks<HookStep extends Hook>(
    hookStep: HookStep,
    hooks: HookMap<
      NodeAttributesOf<AdapterType>,
      EdgeAttributesOf<AdapterType>
    >,
  ) {
    return getHooks(hookStep, hooks);
  }

  private asOperations(adapter: AdapterType): AdapterOperations<AdapterType> {
    return adapter as unknown as AdapterOperations<AdapterType>;
  }

  private asAdapter(operations: AdapterOperations<AdapterType>): AdapterType {
    return operations as unknown as AdapterType;
  }
}
