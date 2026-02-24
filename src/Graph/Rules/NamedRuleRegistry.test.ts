import { NamedRuleRegistry } from './NamedRuleRegistry.js';
import { RemoveNode } from './Node/RemoveNode.js';

describe('NamedRuleRegistry.resolve', () => {
  it('shoud resolve a named serialized rule', () => {
    const registry = new NamedRuleRegistry({
      removeDataNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
    });

    const rule = registry.resolve('removeDataNodes');

    expect(rule.serialize()).toEqual({
      id: 'RemoveNode',
      config: {
        node: {
          attr: {
            key: 'label',
            startsWith: 'data.',
          },
        },
      },
    });
  });

  it('shoud resolve a fresh instance each time for a named rule object', () => {
    const registry = new NamedRuleRegistry({
      removeLocalNodes: new RemoveNode({
        node: {
          attr: {
            key: 'label',
            startsWith: 'local.',
          },
        },
      }),
    });

    const first = registry.resolve('removeLocalNodes');
    const second = registry.resolve('removeLocalNodes');

    expect(first).not.toBe(second);
    expect(first.serialize()).toEqual(second.serialize());
  });

  it('shoud throw when a named rule is not registered', () => {
    const registry = new NamedRuleRegistry();

    expect(() => registry.resolve('doesNotExist')).toThrow(
      "Named rule 'doesNotExist' is not registered",
    );
  });
});

describe('NamedRuleRegistry.resolvePhases', () => {
  it('shoud resolve a named phase plan into rule instances', () => {
    const registry = new NamedRuleRegistry({
      removeDataNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
      removeLocalNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'local.',
            },
          },
        },
      },
    });

    const plan = registry.resolvePhases([
      ['removeDataNodes'],
      ['removeLocalNodes'],
    ]);

    expect(plan).toHaveLength(2);
    expect(plan[0]).toHaveLength(1);
    expect(plan[1]).toHaveLength(1);
    expect(plan[0][0].serialize().id).toBe('RemoveNode');
    expect(plan[1][0].serialize().id).toBe('RemoveNode');
  });
});

describe('NamedRuleRegistry.register', () => {
  it('shoud return a new registry without mutating the original', () => {
    const base = new NamedRuleRegistry({
      removeDataNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
    });

    const next = base.register('removeLocalNodes', {
      id: 'RemoveNode',
      config: {
        node: {
          attr: {
            key: 'label',
            startsWith: 'local.',
          },
        },
      },
    });

    expect(base.names()).toEqual(['removeDataNodes']);
    expect(next.names()).toEqual(['removeDataNodes', 'removeLocalNodes']);
  });
});

describe('NamedRuleRegistry.use', () => {
  it('shoud combine registries immutably', () => {
    const common = new NamedRuleRegistry({
      removeDataNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
    });
    const aws = new NamedRuleRegistry({
      removeLocalNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'local.',
            },
          },
        },
      },
    });

    const combined = common.use(aws);

    expect(common.names()).toEqual(['removeDataNodes']);
    expect(aws.names()).toEqual(['removeLocalNodes']);
    expect(combined.names()).toEqual(['removeDataNodes', 'removeLocalNodes']);
  });
});

describe('NamedRuleRegistry.from', () => {
  it('shoud combine an array of registries', () => {
    const one = new NamedRuleRegistry({
      removeDataNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
    });
    const two = new NamedRuleRegistry({
      removeLocalNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'local.',
            },
          },
        },
      },
    });

    const combined = NamedRuleRegistry.from([one, two]);

    expect(combined.names()).toEqual(['removeDataNodes', 'removeLocalNodes']);
  });

  it('shoud prefer later registries when names collide', () => {
    const first = new NamedRuleRegistry({
      removeNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'data.',
            },
          },
        },
      },
    });
    const second = new NamedRuleRegistry({
      removeNodes: {
        id: 'RemoveNode',
        config: {
          node: {
            attr: {
              key: 'label',
              startsWith: 'local.',
            },
          },
        },
      },
    });

    const combined = NamedRuleRegistry.from([first, second]);
    const resolved = combined.resolve('removeNodes');

    expect(resolved.serialize()).toEqual({
      id: 'RemoveNode',
      config: {
        node: {
          attr: {
            key: 'label',
            startsWith: 'local.',
          },
        },
      },
    });
  });
});
