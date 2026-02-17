import { AdapterOperationsConstructor } from './Operations/Operations.js';
import { NamedRuleRegistry } from './Rules/NamedRuleRegistry.js';
import { BaseRule } from './Rules/Rule.js';
import { SerializedRule } from './Rules/RuleConfig.js';
import { SupportedAdapterOperationsRegistry } from './Serialization/Registry.js';

export type ProfileRenderConfig<TOptions = Record<string, unknown>> = {
  options?: TOptions;
};

export type NamedRuleRef = {
  namedRule: string;
};

export type ProfilePhaseRule = BaseRule | SerializedRule | NamedRuleRef;
export type SerializedProfilePhaseRule = SerializedRule | NamedRuleRef;
export type ProfilePhasePlan = ProfilePhaseRule[][];
export type SerializedProfilePhasePlan = SerializedProfilePhaseRule[][];

export type SerializedProfile<TOptions = Record<string, unknown>> = {
  name: string;
  supports?: string;
  render?: ProfileRenderConfig<TOptions>;
  phases?: SerializedProfilePhasePlan;
  usesProfiles?: SerializedProfile<TOptions>[];
};

export type ProfileOptions<TOptions = Record<string, unknown>> = {
  supports?: AdapterOperationsConstructor;
  render?: ProfileRenderConfig<TOptions>;
  phases?: ProfilePhasePlan;
  usesProfiles?: Profile<TOptions>[];
};

export class Profile<TOptions = Record<string, unknown>> {
  public readonly supports?: AdapterOperationsConstructor;
  private readonly render?: ProfileRenderConfig<TOptions>;
  private readonly phases: ProfilePhasePlan;
  private readonly usesProfiles: Profile<TOptions>[];

  constructor(
    public readonly name: string,
    options: ProfileOptions<TOptions>,
  ) {
    this.supports = options.supports;
    this.render = options.render;
    this.phases = options.phases ?? [];
    this.usesProfiles = options.usesProfiles ?? [];
  }

  public use(profile: Profile<TOptions>): Profile<TOptions> {
    return new Profile(this.name, {
      supports: this.supports,
      render: this.render,
      phases: this.phases,
      usesProfiles: [...this.usesProfiles, profile],
    });
  }

  public addPhases(phases: ProfilePhasePlan): Profile<TOptions> {
    return new Profile(this.name, {
      supports: this.supports,
      render: this.render,
      phases: [...this.phases, ...phases],
      usesProfiles: this.usesProfiles,
    });
  }

  public resolvePhases(namedRules?: NamedRuleRegistry): BaseRule[][] {
    if (this.supports) {
      this.assertCompatibleSupportedAdapterOperations(this.supports);
    }

    const ownPhases = this.resolveOwnPhases(namedRules);
    return this.usesProfiles.reduce(
      // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
      (acc, profile) => [...acc, ...profile.resolvePhases(namedRules)],
      ownPhases,
    );
  }

  public serialize(): SerializedProfile<TOptions> {
    return {
      name: this.name,
      supports: this.supports?.name,
      render: this.render,
      phases: this.serializePhases(this.phases),
      usesProfiles: this.usesProfiles.map((profile) => profile.serialize()),
    };
  }

  public static deseriaize<TOptions = Record<string, unknown>>(
    json: SerializedProfile<TOptions>,
    supportedAdpaterOperationsRegistry?: SupportedAdapterOperationsRegistry,
  ): Profile<TOptions> {
    const supports = json.supports
      ? supportedAdpaterOperationsRegistry?.[json.supports]
      : undefined;
    if (json.supports && !supports) {
      throw new Error(
        `Profile.supports ('${json.supports}') is not registered`,
      );
    }
    return new Profile(json.name, {
      supports,
      render: json.render,
      phases: Profile.deserializePhases(json.phases ?? []),
      usesProfiles: (json.usesProfiles ?? []).map((profile) =>
        Profile.deseriaize<TOptions>(profile, supportedAdpaterOperationsRegistry),
      ),
    });
  }

  public resolveRendererOptions(): TOptions | undefined {
    const inherited = this.usesProfiles.reduce<TOptions | undefined>(
      (_acc, profile) => profile.resolveRendererOptions(),
      undefined,
    );
    return this.render?.options ?? inherited;
  }

  private assertCompatibleSupportedAdapterOperations(
    supports: AdapterOperationsConstructor,
  ) {
    const conflicting = this.collectProfiles().filter(
      (profile) => profile.supports && profile.supports !== supports,
    );
    if (conflicting.length > 0) {
      const names = conflicting.map((profile) => profile.name).join(', ');
      throw new Error(
        `Profile.supports conflict for ('${supports.name}') (conflicting profiles: ${names})`,
      );
    }
  }

  private collectProfiles(): Profile<TOptions>[] {
    return [
      this,
      ...this.usesProfiles.flatMap((profile) => profile.collectProfiles()),
    ];
  }

  private resolveOwnPhases(namedRules?: NamedRuleRegistry): BaseRule[][] {
    return this.phases.map((phase) =>
      phase.map((rule) => this.resolveRule(rule, namedRules)),
    );
  }

  private resolveRule(
    rule: ProfilePhaseRule,
    namedRules?: NamedRuleRegistry,
  ): BaseRule {
    if (rule instanceof BaseRule) {
      return Profile.deserializeRule(rule.serialize());
    }

    if (Profile.isNamedRuleRef(rule)) {
      if (!namedRules) {
        throw new Error(
          `Profile '${this.name}' contains named rules but no NamedRuleRegistry was provided`,
        );
      }
      return namedRules.resolve(rule.namedRule);
    }

    return Profile.deserializeRule(rule);
  }

  private serializePhases(phases: ProfilePhasePlan): SerializedProfilePhasePlan {
    return phases.map((phase) =>
      phase.map((rule) => {
        if (rule instanceof BaseRule) {
          return rule.serialize();
        }
        return rule;
      }),
    );
  }

  private static deserializePhases(
    phases: SerializedProfilePhasePlan,
  ): ProfilePhasePlan {
    return phases.map((phase) => phase.map((rule) => rule));
  }

  private static deserializeRule<ReturnedRuleType = BaseRule>(
    rule: SerializedRule,
  ): ReturnedRuleType {
    return BaseRule.fromSerialized(rule) as ReturnedRuleType;
  }

  private static isNamedRuleRef(rule: ProfilePhaseRule): rule is NamedRuleRef {
    return (
      typeof rule === 'object' &&
      rule !== null &&
      'namedRule' in rule &&
      typeof rule.namedRule === 'string'
    );
  }
}
