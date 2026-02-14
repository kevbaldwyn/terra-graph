import { Adapter } from './Adapter.js';

export interface Renderer<TAdapter extends Adapter> {
  render(adapter: TAdapter): string;
}
