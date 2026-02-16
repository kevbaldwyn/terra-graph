import { Adapter } from '../Adapter.js';
import { Renderer } from '../Renderer.js';

export class JsonRenderer<TAdapter extends Adapter = Adapter>
  implements Renderer<TAdapter>
{
  public render(adapter: TAdapter): string {
    return JSON.stringify(adapter.toTgGraph());
  }
}
