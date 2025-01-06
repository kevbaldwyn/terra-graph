import { exec, execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { Command, Flags } from '@oclif/core';
import { Graph, decorate, filter } from '../Graph/Graph.js';
import { Hook, extend, getHooks } from '../Graph/Hooks/Hooks.js';
import { mergePlugins } from '../Graph/Plugin.js';
import { NodeFilter } from '../Nodes/Filter.js';
import { NodeModifier } from '../Nodes/Modifier.js';
import { Node, NodeWithParent } from '../Nodes/Node.js';
import { Config } from '../config/Config.js';
import defaultConfig from '../config/config.default.js';
import core from '../config/hooks.core.js';

/**
 * NOTES:
 * graphviz
 * use references to resources for things like lambda environment vars to enable graph to be built correctly (rather than reference local or var name: ie dynamodb table name)
 */
// TODO: represent external connection (create the node and relationship) - new hook step, or hang off existing node - probably latter?
// TODO: order of items inside step function
// TODO: test with VPC
// TODO: name filters so they can be explicitly removed
// TODO: pass a plan file to gain more context (edge direction / labels ie GIT PUT to S3 bucket)? / handle for_each / multiple instances

export default class Create extends Command {
  private stdin = '';
  private static readonly defaultFileNameConvention = 'terra-graph';

  static override description =
    'Create a diagram from the piped output of `terraform graph`';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    configFile: Flags.string({
      required: false,
      default: `${Create.defaultFileNameConvention}.js`,
      char: 'c',
    }),
    outFile: Flags.string({
      required: false,
      char: 'o',
    }),
    outFormat: Flags.string({
      required: false,
      default: 'png',
      char: 'f',
    }),
    verbose: Flags.boolean({
      required: false,
      default: false,
    }),
    continueOnError: Flags.boolean({
      required: false,
      default: false,
    }),
  };

  async init() {
    try {
      execSync('dot --version', { stdio: 'pipe' });
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (e: any) {
      this.error(
        "command 'dot' not found, you probably need to install 'graphviz'",
      );
    }

    const readStdin = async () => {
      let data = '';
      const rl = createInterface({
        input: process.stdin,
      });

      for await (const line of rl) {
        data += `${line}\n`;
      }
      return data;
    };
    this.stdin = await readStdin();
  }

  private loggerFactory(verbose: boolean): Command['log'] {
    const logger = (message: string) => {
      this.log(message);
    };
    if (verbose) {
      return logger;
    }
    return () => {};
  }

  private errorFactory(continueOnError: boolean): Command['error'] {
    const errorHandler = (error: Error) => {
      this.error(error);
    };
    if (!continueOnError) {
      return errorHandler;
    }
    return ((error: Error) => {
      console.error(error);
    }) as Create['error'];
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    const logger = this.loggerFactory(flags.verbose);
    const errorHandler = this.errorFactory(flags.continueOnError);

    logger(`reading config file: ${flags.configFile}`);
    const config = await this.getConfig(flags.configFile);

    logger('reading graph');
    const graph = Graph.fromString(this.stdin, [], [], config.description);

    // meta.before
    logger(`applying first filter: ${graph.nodeCount()} nodes`);
    const metaBefore = filter(
      filter(
        graph,
        getHooks<NodeFilter<Node>>(Hook.META_BEFORE, core),
        logger,
        errorHandler,
      ),
      getHooks<NodeFilter<Node>>(Hook.META_BEFORE, config.hooks),
      logger,
      errorHandler,
    );

    // meta.apply
    logger(`applying meta data: ${metaBefore.nodeCount()} nodes`);
    const metaApply = decorate(
      decorate(
        metaBefore,
        getHooks<NodeModifier<Node>>(Hook.META_APPLY, core),
        logger,
        errorHandler,
      ),
      getHooks<NodeModifier<NodeWithParent>>(Hook.META_APPLY, config.hooks),
      logger,
      errorHandler,
    );

    // graph.filter
    logger(`applying final filter: ${metaApply.nodeCount()} nodes`);
    const graphFilter = filter(
      filter(
        metaApply,
        getHooks<NodeFilter<NodeWithParent>>(Hook.GRAPH_FILTER, core),
        logger,
        errorHandler,
      ),
      getHooks<NodeFilter<NodeWithParent>>(Hook.GRAPH_FILTER, config.hooks),
      logger,
      errorHandler,
    );

    // graph.decorate
    logger(`decorating graph: ${graphFilter.nodeCount()} nodes`);
    const final = decorate(
      decorate(
        graphFilter,
        getHooks<NodeModifier<NodeWithParent>>(Hook.GRAPH_DECORATE, core),
        logger,
        errorHandler,
      ),
      getHooks<NodeModifier<NodeWithParent>>(Hook.GRAPH_DECORATE, config.hooks),
      logger,
      errorHandler,
    );

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const rankdir = config.graph!.rankdir!;
    let ranksep = 2.5;
    let nodesep = 0.6;
    if (['TB', 'BT'].includes(rankdir)) {
      nodesep = 2.5;
      ranksep = 0.6;
    }

    logger(`applying graph options: final node count: ${final.nodeCount()}`);
    final.setGraph({
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      ...(final.graph() as unknown as Record<string, any>),
      rankdir,
      ranksep,
      nodesep,
      ...config.graph,
    });

    const outFileName = flags.outFile
      ? flags.outFile
      : `${Create.defaultFileNameConvention}.${flags.outFormat}`;

    logger(`writing ${outFileName}`);
    if (flags.outFormat === 'txt') {
      writeFileSync(outFileName, final.toString());
    } else {
      exec(
        `echo '${final.toString()}' | dot -T${
          flags.outFormat
        } > ${outFileName}`,
        (error, stdout, stderr) => {
          if (error) {
            throw error;
          }
        },
      );
    }
  }

  private async getConfig(
    configFile: string,
  ): Promise<Pick<Config, 'graph' | 'hooks' | 'description'>> {
    let config: Config;
    if (configFile) {
      // TODO: handle errors / invalid hookmap
      const userConfig = (await import(path.resolve(configFile)))
        .default as Config;
      config = {
        ...userConfig,
        graph: {
          ...defaultConfig.graph,
          ...userConfig.graph,
        },
      } as Config;
    } else {
      config = defaultConfig;
    }

    const r: Config = {
      graph: config.graph,
      hooks: extend(mergePlugins(config.plugins ?? []), config.hooks),
    };

    if (config.description) {
      r.description = config.description;
    }

    return r;
  }
}
