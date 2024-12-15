import { HookMap } from "../Graph/Hooks/Hooks";
import { Plugin } from "../Graph/Plugin";

interface Graph extends Record<string, unknown> {
  rankdir?: string;
}
export type Config = {
  graph?: Graph;
  hooks: HookMap;
  plugins?: Plugin[];
};
