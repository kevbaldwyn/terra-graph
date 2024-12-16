import { HookMap } from "../Graph/Hooks/Hooks.js";
import { Plugin } from "../Graph/Plugin.js";

interface Graph extends Record<string, unknown> {
  rankdir?: string;
}
export type Config = {
  graph?: Graph;
  hooks: HookMap;
  plugins?: Plugin[];
};
