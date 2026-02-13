import type { TgGraph } from './TgGraph.js';

export type ImportContext = {
  description?: Record<string, string>;
};

export interface Importer {
  fromString(input: string, context?: ImportContext): TgGraph;
}
