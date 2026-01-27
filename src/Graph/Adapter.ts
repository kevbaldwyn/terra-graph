import { TgGraph } from './TgGraph.js';

export interface Adapter {
  toTgGraph(): TgGraph;
}

export type AdapterFactory<A extends Adapter> = {
  fromTgGraph(tg: TgGraph): A;
};
