import { AdapterOperationsConstructor } from './Operations/Operations.js';
import { BaseRule } from './Rules/Rule.js';
import { SerializedRule, SerializedRulePlan } from './Rules/RuleConfig.js';
import { SupportedAdapterOperationsRegistry } from './Serialization/Registry.js';

export type ProfileRenderConfig<TOptions = Record<string, unknown>> = {
  options?: TOptions;
};

export type SerializedProfile<TOptions = Record<string, unknown>> = {
  name: string;
  supports?: string;
  render?: ProfileRenderConfig<TOptions>;
  phases?: SerializedRulePlan;
  usesProfiles?: SerializedProfile<TOptions>[];
};

export type ProfileOptions<TOptions = Record<string, unknown>> = {
  supports?: AdapterOperationsConstructor;
  render?: ProfileRenderConfig<TOptions>;
  phases?: BaseRule[][];
  usesProfiles?: Profile<TOptions>[];
};

export class Profile<TOptions = Record<string, unknown>> {
  public readonly supports?: AdapterOperationsConstructor;
  private readonly render?: ProfileRenderConfig<TOptions>;
  private readonly phases: BaseRule[][];
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

  public addPhases(phases: BaseRule[][]): Profile<TOptions> {
    return new Profile(this.name, {
      supports: this.supports,
      render: this.render,
      phases: [...this.phases, ...phases],
      usesProfiles: this.usesProfiles,
    });
  }

  public resolvePhases(): BaseRule[][] {
    if (this.supports) {
      this.assertCompatibleSupportedAdapterOperations(this.supports);
    }
    return this.usesProfiles.reduce(
      // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
      (acc, profile) => [...acc, ...profile.resolvePhases()],
      this.phases,
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

  private serializePhases(phases: BaseRule[][]): SerializedRulePlan {
    return phases.map((phase) => phase.map((rule) => rule.serialize()));
  }

  private static deserializePhases(phases: SerializedRulePlan): BaseRule[][] {
    return phases.map((phase) =>
      phase.map((rule) => Profile.deserializeRule(rule)),
    );
  }

  private static deserializeRule<ReturnedRuleType = BaseRule>(
    rule: SerializedRule,
  ): ReturnedRuleType {
    return BaseRule.fromSerialized(rule) as ReturnedRuleType;
  }
}
