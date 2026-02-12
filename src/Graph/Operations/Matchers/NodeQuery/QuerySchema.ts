import { z } from 'zod';

const PredicateObject = z.object({
  eq: z.unknown().optional(),
  in: z.array(z.unknown()).optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  exists: z.boolean().optional(),
});

const refinePredicate = (value: z.infer<typeof PredicateObject>) => {
  const ops = [
    value.eq !== undefined,
    value.in !== undefined,
    value.contains !== undefined,
    value.startsWith !== undefined,
    value.endsWith !== undefined,
    value.exists !== undefined,
  ].filter(Boolean);
  return ops.length === 1;
};

const PredicateSchema = PredicateObject.refine(refinePredicate, {
  message:
    'predicate must specify exactly one of: eq | in | contains | startsWith | endsWith | exists',
});

const AttrPredicateObject = PredicateObject.extend({
  key: z.string().min(1),
});

export const AttrPredicateSchema = AttrPredicateObject.refine(refinePredicate, {
  message:
    'attr must specify exactly one of: eq | in | contains | startsWith | endsWith | exists',
});

export const NodeIdPredicateSchema = PredicateSchema;

export type AttrPredicate = z.infer<typeof AttrPredicateObject>;
export type NodeIdPredicate = z.infer<typeof PredicateObject>;

export type QueryDsl =
  | { and: QueryDsl[] }
  | { or: QueryDsl[] }
  | { not: QueryDsl }
  | { attr: AttrPredicate }
  | { nodeId: NodeIdPredicate }
  | { edge: { in?: QueryDsl; out?: QueryDsl } };

export const QuerySchema: z.ZodType<QueryDsl> = z.lazy(() =>
  z.union([
    z.object({ and: z.array(QuerySchema).min(1) }),
    z.object({ or: z.array(QuerySchema).min(1) }),
    z.object({ not: QuerySchema }),
    z.object({ attr: AttrPredicateSchema }),
    z.object({ nodeId: NodeIdPredicateSchema }),
    z
      .object({
        edge: z.object({
          in: QuerySchema.optional(),
          out: QuerySchema.optional(),
        }),
      })
      .refine((value) => value.edge.in || value.edge.out, {
        message: 'edge must define at least one of: in | out',
      }),
  ]),
) as z.ZodType<QueryDsl>;
