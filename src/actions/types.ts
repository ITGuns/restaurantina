export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: string };

export const fail = (error: string, extra: { fieldErrors?: Record<string, string>; code?: string } = {}): ActionResult<never> => ({
  ok: false,
  error,
  ...extra,
});
