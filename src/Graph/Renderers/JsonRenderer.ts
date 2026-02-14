import { Adapter } from '../Adapter.js';
import { Renderer } from '../Renderer.js';

export class JsonRenderer implements Renderer<Adapter> {
  public render(adapter: Adapter): string {
    return JSON.stringify(adapter.toTgGraph());
  }
}
