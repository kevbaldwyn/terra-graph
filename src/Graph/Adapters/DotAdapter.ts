import { NodeId } from '../TgGraph.js';
import { DotRenderer } from '../Renderers/DotRenderer.js';
import type { Renderer } from '../Renderers/Renderer.js';
import { GraphologyAdapter } from './GraphologyAdapter.js';

type DotRank = {
  mode: 'same' | 'min' | 'max';
  nodes: NodeId[];
};

export class DotAdapter extends GraphologyAdapter {
  private static readonly RankAttr = 'tg:dot:ranks';

  public getRenderer(): Renderer<DotAdapter> {
    return new DotRenderer();
  }

  public addRank(nodes: NodeId[], mode: DotRank['mode'] = 'same'): this {
    const ranks = this.getRanks();
    ranks.push({ mode, nodes });
    return this.setRanks(ranks);
  }

  public getRanks(): DotRank[] {
    return this.readGraphAttribute<DotRank[]>(DotAdapter.RankAttr, []);
  }

  public clearRanks(): this {
    return this.setRanks([]);
  }

  private setRanks(ranks: DotRank[]): this {
    return this.mutateGraph((graph) => {
      graph.setAttribute(DotAdapter.RankAttr, ranks);
    });
  }
}
