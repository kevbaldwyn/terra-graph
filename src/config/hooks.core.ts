import { Hook, HookMap } from "../Graph/Hooks/Hooks.js";
import { addMeta } from "../Graph/Hooks/Modifiers/addMeta.js";
import { addModuleParent } from "../Graph/Hooks/Modifiers/addModuleParent.js";
import { normaliseModules } from "../Graph/Hooks/Modifiers/normaliseModules.js";
import { removeNodeAndRedirectRelationships } from "../Graph/Hooks/Modifiers/removeNodeAndRedirectRelationships.js";

const core: HookMap = {
  [Hook.META_BEFORE]: [
    {
      match: (nodeName, node) => {
        return (
          node.label.startsWith("data.") ||
          node.label.startsWith("local.") ||
          node.label.startsWith("var.") ||
          node.label.startsWith("null_resource.") ||
          node.label.startsWith("local_file.")
        );
      },
      remove: true,
    },
  ],
  [Hook.META_APPLY]: [
    addMeta(),
    addModuleParent(),
    removeNodeAndRedirectRelationships(["time_sleep"]),
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
