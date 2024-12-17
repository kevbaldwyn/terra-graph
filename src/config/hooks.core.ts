import { Hook, HookMap } from "../Graph/Hooks/Hooks.js";
import { addMeta } from "../Graph/Hooks/Modifiers/addMeta.js";
import { addModuleParent } from "../Graph/Hooks/Modifiers/addModuleParent.js";
import { normaliseModules } from "../Graph/Hooks/Modifiers/normaliseModules.js";
import { removeNodeAndRedirectRelationships } from "../Graph/Hooks/Modifiers/removeNodeAndRedirectRelationships.js";
import { Matcher } from "../Nodes/Matcher.js";

const core: HookMap = {
  [Hook.META_BEFORE]: [
    {
      match: Matcher.node.labelStartsWith([
        "data.",
        "local.",
        "var.",
        "null_resource.",
        "local_file.",
      ]),
      remove: true,
    },
  ],
  [Hook.META_APPLY]: [
    addMeta(),
    addModuleParent(),
    removeNodeAndRedirectRelationships(
      Matcher.node.resourceEquals(["time_sleep"])
    ),
  ],
  [Hook.GRAPH_FILTER]: [
    {
      match: (nodeName, node, graph) => {
        return (
          nodeName.startsWith("cluster_module") &&
          graph.children(nodeName).length === 0
        );
      },
      remove: true,
    },
  ],
  [Hook.GRAPH_DECORATE]: [normaliseModules()],
};

export default core;
