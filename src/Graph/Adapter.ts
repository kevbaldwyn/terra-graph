import { AdapterOperations } from './Operations/Operations.js';
import type { Renderer } from './Renderer.js';
import { TgGraph } from './TgGraph.js';

export interface Adapter {
  toTgGraph(): TgGraph;
  withTgGraph(tg: TgGraph): AdapterOperations;
  getRenderer(): Renderer<Adapter>;
}

// export type AdapterFactory<A extends Adapter> = {
//   fromTgGraph(tg: TgGraph): A;
// };
