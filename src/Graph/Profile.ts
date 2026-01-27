import { Hook } from './Hooks/Hooks.js';
import {
  HookMap,
  NodeHook,
  SerializedHook,
  SerializedHookMap,
} from './Operations/Hooks.js';
import { OperationsType } from './Operations/Operations.js';
import {
  HookRegistry,
  OperationsTypeRegistry,
} from './Serialization/Registry.js';

export type ProfileJson = {
  name: string;
  operationsType?: string;
  hooks?: SerializedHookMap;
  usesProfiles?: ProfileJson[];
};

export type ProfileOptions = {
  operationsType?: OperationsType;
  hooks?: HookMap;
  usesProfiles?: Profile[];
};

export class Profile {
  public readonly operationsType?: OperationsType;
  private readonly hooks: HookMap;
  private readonly usesProfiles: Profile[];

  constructor(
    public readonly name: string,
    options: ProfileOptions,
  ) {
    this.operationsType = options.operationsType;
    this.hooks = options.hooks ?? {};
    this.usesProfiles = options.usesProfiles ?? [];
  }

  public use(profile: Profile): Profile {
    return new Profile(this.name, {
      operationsType: this.operationsType,
      hooks: this.hooks,
      usesProfiles: [...this.usesProfiles, profile],
    });
  }

  public addHooks(hooks: HookMap): Profile {
    return new Profile(this.name, {
      operationsType: this.operationsType,
      hooks: this.mergeHooks(this.hooks, hooks),
      usesProfiles: this.usesProfiles,
    });
  }

  public resolveHooks(): HookMap {
    if (this.operationsType) {
      this.assertCompatibleOperationsTypes(this.operationsType);
    }
    return this.usesProfiles.reduce(
      (acc, profile) => this.mergeHooks(acc, profile.resolveHooks()),
      this.hooks,
    );
  }

  public toJson(): ProfileJson {
    return {
      name: this.name,
      operationsType: this.operationsType?.name,
      hooks: this.serializeHookMap(this.hooks),
      usesProfiles: this.usesProfiles.map((profile) => profile.toJson()),
    };
  }

  public static fromJson(
    json: ProfileJson,
    hooks: HookRegistry,
    operationsTypes?: OperationsTypeRegistry,
  ): Profile {
    const operationsType = json.operationsType
      ? operationsTypes?.[json.operationsType]
      : undefined;
    if (json.operationsType && !operationsType) {
      throw new Error(
        `Profile operationsType '${json.operationsType}' is not registered`,
      );
    }
    return new Profile(json.name, {
      operationsType,
      hooks: Profile.deserializeHookMap(json.hooks ?? {}, hooks),
      usesProfiles: (json.usesProfiles ?? []).map((profile) =>
        Profile.fromJson(profile, hooks, operationsTypes),
      ),
    });
  }

  private assertCompatibleOperationsTypes(operationsType: OperationsType) {
    const conflicting = this.collectProfiles().filter(
      (profile) =>
        profile.operationsType && profile.operationsType !== operationsType,
    );
    if (conflicting.length > 0) {
      const names = conflicting.map((profile) => profile.name).join(', ');
      throw new Error(
        `Profile operationsType conflict for '${operationsType.name}' (conflicting profiles: ${names})`,
      );
    }
  }

  private collectProfiles(): Profile[] {
    return [
      this,
      ...this.usesProfiles.flatMap((profile) => profile.collectProfiles()),
    ];
  }

  private mergeHooks(source: HookMap, extension: HookMap): HookMap {
    return {
      [Hook.META_BEFORE]: [
        ...(source[Hook.META_BEFORE] ?? []),
        ...(extension[Hook.META_BEFORE] ?? []),
      ],
      [Hook.META_APPLY]: [
        ...(source[Hook.META_APPLY] ?? []),
        ...(extension[Hook.META_APPLY] ?? []),
      ],
      [Hook.GRAPH_FILTER]: [
        ...(source[Hook.GRAPH_FILTER] ?? []),
        ...(extension[Hook.GRAPH_FILTER] ?? []),
      ],
      [Hook.GRAPH_DECORATE]: [
        ...(source[Hook.GRAPH_DECORATE] ?? []),
        ...(extension[Hook.GRAPH_DECORATE] ?? []),
      ],
    };
  }

  private serializeHookMap(hooks: HookMap): SerializedHookMap {
    return {
      [Hook.META_BEFORE]: this.serializeHooks(hooks[Hook.META_BEFORE]),
      [Hook.META_APPLY]: this.serializeHooks(hooks[Hook.META_APPLY]),
      [Hook.GRAPH_FILTER]: this.serializeHooks(hooks[Hook.GRAPH_FILTER]),
      [Hook.GRAPH_DECORATE]: this.serializeHooks(hooks[Hook.GRAPH_DECORATE]),
    };
  }

  private serializeHooks(
    hooks: NodeHook[] | undefined,
  ): SerializedHook[] | undefined {
    if (!hooks) {
      return undefined;
    }
    return hooks.map((hook) => {
      // TODO: push config validation/normalization into hook classes.
      return hook.serialize();
    });
  }

  private static deserializeHookMap(
    hooks: SerializedHookMap,
    registry: HookRegistry,
  ): HookMap {
    return {
      [Hook.META_BEFORE]: hooks[Hook.META_BEFORE]?.map((hook) =>
        Profile.deserializeHook(hook, registry),
      ),
      [Hook.META_APPLY]: hooks[Hook.META_APPLY]?.map((hook) =>
        Profile.deserializeHook(hook, registry),
      ),
      [Hook.GRAPH_FILTER]: hooks[Hook.GRAPH_FILTER]?.map((hook) =>
        Profile.deserializeHook(hook, registry),
      ),
      [Hook.GRAPH_DECORATE]: hooks[Hook.GRAPH_DECORATE]?.map((hook) =>
        Profile.deserializeHook(hook, registry),
      ),
    };
  }

  private static deserializeHook<ReturnedHookType = NodeHook>(
    hook: SerializedHook,
    registry: HookRegistry,
  ): ReturnedHookType {
    const factory = registry[hook.id];
    if (!factory) {
      throw new Error(`Hook '${hook.id}' is not registered`);
    }
    return factory(hook.config) as ReturnedHookType;
  }
}
