import { NamedRuleSetRegistry } from './NamedRuleSetRegistry.js';
import { RuleSet } from './RuleSet.js';

describe('NamedRuleSetRegistry.resolve', () => {
  it('shoud resolve a named serialized rule set', () => {
    const registry = new NamedRuleSetRegistry({
      core: {
        rules: [{ namedRule: 'removeDataNodes' }],
      },
    });

    const set = registry.resolve('core');

    expect(set.serialize()).toEqual({
      rules: [{ namedRule: 'removeDataNodes' }],
    });
  });

  it('shoud resolve a fresh instance each time for a named rule set object', () => {
    const registry = new NamedRuleSetRegistry({
      core: new RuleSet({
        rules: [{ namedRule: 'removeDataNodes' }],
      }),
    });

    const first = registry.resolve('core');
    const second = registry.resolve('core');

    expect(first).not.toBe(second);
    expect(first.serialize()).toEqual(second.serialize());
  });

  it('shoud throw when a named rule set is not registered', () => {
    const registry = new NamedRuleSetRegistry();

    expect(() => registry.resolve('doesNotExist')).toThrow(
      "Named rule set 'doesNotExist' is not registered",
    );
  });
});

describe('NamedRuleSetRegistry.register', () => {
  it('shoud return a new registry without mutating the original', () => {
    const base = new NamedRuleSetRegistry({
      core: {
        rules: [{ namedRule: 'removeDataNodes' }],
      },
    });

    const next = base.register('extra', {
      rules: [{ namedRule: 'removeLocalNodes' }],
    });

    expect(base.names()).toEqual(['core']);
    expect(next.names()).toEqual(['core', 'extra']);
  });
});

describe('NamedRuleSetRegistry.use', () => {
  it('shoud combine registries immutably', () => {
    const common = new NamedRuleSetRegistry({
      core: {
        rules: [{ namedRule: 'removeDataNodes' }],
      },
    });
    const aws = new NamedRuleSetRegistry({
      aws: {
        rules: [{ namedRule: 'removeLocalNodes' }],
      },
    });

    const combined = common.use(aws);

    expect(common.names()).toEqual(['core']);
    expect(aws.names()).toEqual(['aws']);
    expect(combined.names()).toEqual(['core', 'aws']);
  });
});

describe('NamedRuleSetRegistry.from', () => {
  it('shoud combine an array of registries', () => {
    const one = new NamedRuleSetRegistry({
      core: {
        rules: [{ namedRule: 'removeDataNodes' }],
      },
    });
    const two = new NamedRuleSetRegistry({
      aws: {
        rules: [{ namedRule: 'removeLocalNodes' }],
      },
    });

    const combined = NamedRuleSetRegistry.from([one, two]);

    expect(combined.names()).toEqual(['core', 'aws']);
  });
});
