import { Profile } from '../Profile.js';
import { RuleSet } from './RuleSet.js';
import { NamedRuleRegistry } from './NamedRuleRegistry.js';
import { NamedRuleSetRegistry } from './NamedRuleSetRegistry.js';
import './Node/RemoveNode.js';

describe('RuleSet.resolvePhases', () => {
  it('shoud resolve named rules when a registry is provided', () => {
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
    const ruleSet = new RuleSet({
      rules: [{ namedRule: 'removeDataNodes' }],
    });

    const phases = ruleSet.resolvePhases(registry);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(1);
    expect(phases[0][0].serialize()).toEqual({
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

  it('shoud throw when named rules are used without a registry', () => {
    const ruleSet = new RuleSet({
      rules: [{ namedRule: 'removeDataNodes' }],
    });

    expect(() => ruleSet.resolvePhases()).toThrow(
      'RuleSet contains named rules but no NamedRuleRegistry was provided',
    );
  });

  it('shoud resolve named rule sets when a registry is provided', () => {
    const namedRules = new NamedRuleRegistry({
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
    const namedRuleSets = new NamedRuleSetRegistry({
      baseSet: new RuleSet({
        rules: [{ namedRule: 'removeDataNodes' }],
      }),
    });
    const ruleSet = new RuleSet({
      rules: [{ namedRuleSet: 'baseSet' }],
    });

    const phases = ruleSet.resolvePhases(namedRules, namedRuleSets);

    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveLength(1);
    expect(phases[0][0].serialize()).toEqual({
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

  it('shoud throw when named rule sets are used without a registry', () => {
    const ruleSet = new RuleSet({
      rules: [{ namedRuleSet: 'baseSet' }],
    });

    expect(() => ruleSet.resolvePhases()).toThrow(
      'RuleSet contains named rule sets but no NamedRuleSetRegistry was provided',
    );
  });

});

describe('RuleSet.serialize', () => {
  it('shoud serialize and deserialize phases', () => {
    const ruleSet = new RuleSet({
      rules: [{ namedRule: 'removeDataNodes' }],
    });

    const serialized = ruleSet.serialize();
    const restored = RuleSet.deseriaize(serialized);

    expect(restored.serialize()).toStrictEqual(serialized);
  });
});

describe('RuleSet.toPhases', () => {
  it('shoud provide phases that can be consumed by a profile', () => {
    const ruleSet = new RuleSet({
      rules: [{ namedRule: 'removeDataNodes' }],
    });
    const profile = new Profile('overview', { phases: ruleSet.toPhases() });

    const phases = profile.serialize().phases ?? [];
    expect(phases).toHaveLength(1);
    expect(phases[0][0]).toEqual({ namedRule: 'removeDataNodes' });
  });
});
