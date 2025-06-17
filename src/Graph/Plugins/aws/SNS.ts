import { Matcher } from '../../../Nodes/Matcher.js';
import { Hook } from '../../Hooks/Hooks.js';
import { edgeReverse } from '../../Hooks/Modifiers/edgeReverse.js';
import { nodeToEdgeLabel } from '../../Hooks/Modifiers/nodeToEdgeLabel.js';
import { Plugin } from '../../Plugin.js';

export const SNS: Plugin = () => ({
  [Hook.META_APPLY]: [
    edgeReverse([
      {
        from: Matcher.node.resourceOrNodeNameEquals(['aws_sns_topic']),
        to: Matcher.node.resourceOrNodeNameEquals([
          'aws_sns_topic_subscription',
        ]),
      },
    ]),
  ],
  [Hook.GRAPH_DECORATE]: [
    nodeToEdgeLabel(
      Matcher.node.resourceEquals(['aws_sns_topic_subscription']),
    ),
  ],
});
