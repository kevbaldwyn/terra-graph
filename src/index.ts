import defaultConfig from "./config/config.default.js";
import { Hook, extend } from "./Graph/Hooks/index.js";
import { excludeResourceExceptWhenInEdgeMatches } from "./Graph/Hooks/Filters/index.js";
import { groupResources, singleResources } from "./Graph/Hooks/Modifiers/aws/index.js";
import { addMeta, addModuleParent, alignNodes, edgeReverse, explicitEdge, nodeToEdgeLabel, normaliseModules, removeEdge, removeNodeAndRedirectRelationships, styleEdge } from "./Graph/Hooks/Modifiers/index.js";
import { ApiGateway, S3, TransferFamily, TrendMicroCloudFormationStack } from "./Graph/Plugins/aws/index.js";

// export types
export * from "./Nodes/index.js";
export * from "./Graph/index.js";
export * from "./config/Config.js";

// define globals
declare global {
	var TerraGraph: {
		defaultConfig: typeof import("./config/config.default.js").default;
		Hook: typeof import("./Graph/Hooks/index.js").Hook;
		extend: typeof import("./Graph/Hooks/index.js").extend;
		excludeResourceExceptWhenInEdgeMatches: typeof import("./Graph/Hooks/Filters/index.js").excludeResourceExceptWhenInEdgeMatches;
		groupResources: typeof import("./Graph/Hooks/Modifiers/aws/index.js").groupResources;
		singleResources: typeof import("./Graph/Hooks/Modifiers/aws/index.js").singleResources;
		addMeta: typeof import("./Graph/Hooks/Modifiers/index.js").addMeta;
		addModuleParent: typeof import("./Graph/Hooks/Modifiers/index.js").addModuleParent;
		alignNodes: typeof import("./Graph/Hooks/Modifiers/index.js").alignNodes;
		edgeReverse: typeof import("./Graph/Hooks/Modifiers/index.js").edgeReverse;
		explicitEdge: typeof import("./Graph/Hooks/Modifiers/index.js").explicitEdge;
		nodeToEdgeLabel: typeof import("./Graph/Hooks/Modifiers/index.js").nodeToEdgeLabel;
		normaliseModules: typeof import("./Graph/Hooks/Modifiers/index.js").normaliseModules;
		removeEdge: typeof import("./Graph/Hooks/Modifiers/index.js").removeEdge;
		removeNodeAndRedirectRelationships: typeof import("./Graph/Hooks/Modifiers/index.js").removeNodeAndRedirectRelationships;
		styleEdge: typeof import("./Graph/Hooks/Modifiers/index.js").styleEdge;
		ApiGateway: typeof import("./Graph/Plugins/aws/index.js").ApiGateway;
		S3: typeof import("./Graph/Plugins/aws/index.js").S3;
		TransferFamily: typeof import("./Graph/Plugins/aws/index.js").TransferFamily;
		TrendMicroCloudFormationStack: typeof import("./Graph/Plugins/aws/index.js").TrendMicroCloudFormationStack;
	}
}

global.TerraGraph = {
	defaultConfig,
	Hook,
	extend,
	excludeResourceExceptWhenInEdgeMatches,
	groupResources,
	singleResources,
	addMeta,
	addModuleParent,
	alignNodes,
	edgeReverse,
	explicitEdge,
	nodeToEdgeLabel,
	normaliseModules,
	removeEdge,
	removeNodeAndRedirectRelationships,
	styleEdge,
	ApiGateway,
	S3,
	TransferFamily,
	TrendMicroCloudFormationStack,
}
