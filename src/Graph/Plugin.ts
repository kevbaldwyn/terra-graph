import { Hook, HookMap, extend, getHooks } from './Hooks/Hooks.js';

export type Plugin = () => HookMap;

export const mergePlugins = (plugins: Plugin[]): HookMap => {
  const hooks: HookMap = {
    [Hook.META_BEFORE]: [],
    [Hook.META_APPLY]: [],
    [Hook.GRAPH_FILTER]: [],
    [Hook.GRAPH_DECORATE]: [],
  };

  return plugins.reduce((acc, current) => {
    return extend(acc, current());
  }, hooks);
};
