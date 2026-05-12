var $n = Object.defineProperty;
var Kt = (e) => {
  throw TypeError(e);
};
var Jn = (e, t, n) => t in e ? $n(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var $ = (e, t, n) => Jn(e, typeof t != "symbol" ? t + "" : t, n), kt = (e, t, n) => t.has(e) || Kt("Cannot " + n);
var s = (e, t, n) => (kt(e, t, "read from private field"), n ? n.call(e) : t.get(e)), g = (e, t, n) => t.has(e) ? Kt("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), _ = (e, t, n, i) => (kt(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), E = (e, t, n) => (kt(e, t, "access private method"), n);
var Zn = Array.isArray, Qn = Array.prototype.indexOf, Le = Array.prototype.includes, Xn = Array.from, ei = Object.defineProperty, Ye = Object.getOwnPropertyDescriptor, ti = Object.getOwnPropertyDescriptors, ni = Object.prototype, ii = Array.prototype, un = Object.getPrototypeOf, $t = Object.isExtensible;
const ri = () => {
};
function si(e) {
  return e();
}
function St(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function ai() {
  var e, t, n = new Promise((i, r) => {
    e = i, t = r;
  });
  return { promise: n, resolve: e, reject: t };
}
const D = 2, Ke = 4, zt = 8, fn = 1 << 24, X = 16, oe = 32, _e = 64, Tt = 128, Y = 512, N = 1024, F = 2048, ne = 4096, ee = 8192, ve = 16384, Ge = 32768, Jt = 1 << 25, pt = 65536, At = 1 << 17, li = 1 << 18, tt = 1 << 19, cn = 1 << 20, Ce = 65536, ht = 1 << 21, vt = 1 << 22, $e = 1 << 23, Ue = Symbol("$state"), jt = new class extends Error {
  constructor() {
    super(...arguments);
    $(this, "name", "StaleReactionError");
    $(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function oi(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function ui(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function fi() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ci(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function di() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function pi() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function hi() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function vi() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function _i() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const mi = 2, R = Symbol(), gi = "http://www.w3.org/1999/xhtml";
function wi() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function bi() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function dn(e) {
  return e === this.v;
}
function gr(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
let wt = !1;
function yi() {
  wt = !0;
}
let O = null;
function _t(e) {
  O = e;
}
function pn(e, t = !1, n) {
  O = {
    p: O,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      y
    ),
    l: wt && !t ? { s: null, u: null, $: [] } : null
  };
}
function hn(e) {
  var t = (
    /** @type {ComponentContext} */
    O
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var i of n)
      Pn(i);
  }
  return t.i = !0, O = t.p, /** @type {T} */
  {};
}
function bt() {
  return !wt || O !== null && O.l === null;
}
let Ne = [];
function ki() {
  var e = Ne;
  Ne = [], St(e);
}
function Pe(e) {
  if (Ne.length === 0) {
    var t = Ne;
    queueMicrotask(() => {
      t === Ne && ki();
    });
  }
  Ne.push(e);
}
function vn(e) {
  var t = y;
  if (t === null)
    return w.f |= $e, e;
  if ((t.f & Ge) === 0 && (t.f & Ke) === 0)
    throw e;
  Oe(e, t);
}
function Oe(e, t) {
  for (; t !== null; ) {
    if ((t.f & Tt) !== 0) {
      if ((t.f & Ge) === 0)
        throw e;
      try {
        t.b.error(e);
        return;
      } catch (n) {
        e = n;
      }
    }
    t = t.parent;
  }
  throw e;
}
const Ei = -7169;
function T(e, t) {
  e.f = e.f & Ei | t;
}
function Lt(e) {
  (e.f & Y) !== 0 || e.deps === null ? T(e, N) : T(e, ne);
}
function _n(e) {
  if (e !== null)
    for (const t of e)
      (t.f & D) === 0 || (t.f & Ce) === 0 || (t.f ^= Ce, _n(
        /** @type {Derived} */
        t.deps
      ));
}
function mn(e, t, n) {
  (e.f & F) !== 0 ? t.add(e) : (e.f & ne) !== 0 && n.add(e), _n(e.deps), T(e, N);
}
const we = /* @__PURE__ */ new Set();
let m = null, C = null, Rt = null, Et = !1, De = null, st = null;
var Zt = 0;
let xi = 1;
var Fe, Me, Ee, re, Z, Ze, L, Qe, de, se, Q, Ie, ze, xe, S, at, gn, lt, Ct, ot, Si;
const mt = class mt {
  constructor() {
    g(this, S);
    $(this, "id", xi++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    $(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    $(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    g(this, Fe, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    g(this, Me, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    g(this, Ee, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    g(this, re, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    g(this, Z, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    g(this, Ze, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    g(this, L, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    g(this, Qe, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    g(this, de, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    g(this, se, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    g(this, Q, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    g(this, Ie, /* @__PURE__ */ new Set());
    $(this, "is_fork", !1);
    g(this, ze, !1);
    /** @type {Set<Batch>} */
    g(this, xe, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    s(this, Q).has(t) || s(this, Q).set(t, { d: [], m: [] }), s(this, Ie).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (i) => this.schedule(i)) {
    var i = s(this, Q).get(t);
    if (i) {
      s(this, Q).delete(t);
      for (var r of i.d)
        T(r, F), n(r);
      for (r of i.m)
        T(r, ne), n(r);
    }
    s(this, Ie).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, i = !1) {
    t.v !== R && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & $e) === 0 && (this.current.set(t, [n, i]), C == null || C.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    m = this;
  }
  deactivate() {
    m = null, C = null;
  }
  flush() {
    try {
      Et = !0, m = this, E(this, S, lt).call(this);
    } finally {
      Zt = 0, Rt = null, De = null, st = null, Et = !1, m = null, C = null, Ae.clear();
    }
  }
  discard() {
    for (const t of s(this, Me)) t(this);
    s(this, Me).clear(), s(this, Ee).clear(), we.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    s(this, Qe).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    let i = s(this, re).get(n) ?? 0;
    if (s(this, re).set(n, i + 1), t) {
      let r = s(this, Z).get(n) ?? 0;
      s(this, Z).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(t, n, i) {
    let r = s(this, re).get(n) ?? 0;
    if (r === 1 ? s(this, re).delete(n) : s(this, re).set(n, r - 1), t) {
      let a = s(this, Z).get(n) ?? 0;
      a === 1 ? s(this, Z).delete(n) : s(this, Z).set(n, a - 1);
    }
    s(this, ze) || i || (_(this, ze, !0), Pe(() => {
      _(this, ze, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const i of t)
      s(this, de).add(i);
    for (const i of n)
      s(this, se).add(i);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    s(this, Fe).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    s(this, Me).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(t) {
    s(this, Ee).add(t);
  }
  run_fork_commit_callbacks() {
    for (const t of s(this, Ee)) t(this);
    s(this, Ee).clear();
  }
  settled() {
    return (s(this, Ze) ?? _(this, Ze, ai())).promise;
  }
  static ensure() {
    if (m === null) {
      const t = m = new mt();
      Et || (we.add(m), Pe(() => {
        m === t && t.flush();
      }));
    }
    return m;
  }
  apply() {
    {
      C = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    var r;
    if (Rt = t, (r = t.b) != null && r.is_pending && (t.f & (Ke | zt | fn)) !== 0 && (t.f & Ge) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var i = n.f;
      if (De !== null && n === y && (w === null || (w.f & D) === 0))
        return;
      if ((i & (_e | oe)) !== 0) {
        if ((i & N) === 0)
          return;
        n.f ^= N;
      }
    }
    s(this, L).push(n);
  }
};
Fe = new WeakMap(), Me = new WeakMap(), Ee = new WeakMap(), re = new WeakMap(), Z = new WeakMap(), Ze = new WeakMap(), L = new WeakMap(), Qe = new WeakMap(), de = new WeakMap(), se = new WeakMap(), Q = new WeakMap(), Ie = new WeakMap(), ze = new WeakMap(), xe = new WeakMap(), S = new WeakSet(), at = function() {
  return this.is_fork || s(this, Z).size > 0;
}, gn = function() {
  for (const i of s(this, xe))
    for (const r of s(i, Z).keys()) {
      for (var t = !1, n = r; n.parent !== null; ) {
        if (s(this, Q).has(n)) {
          t = !0;
          break;
        }
        n = n.parent;
      }
      if (!t)
        return !0;
    }
  return !1;
}, lt = function() {
  var u, o;
  if (Zt++ > 1e3 && (we.delete(this), Ti()), !E(this, S, at).call(this)) {
    for (const l of s(this, de))
      s(this, se).delete(l), T(l, F), this.schedule(l);
    for (const l of s(this, se))
      T(l, ne), this.schedule(l);
  }
  const t = s(this, L);
  _(this, L, []), this.apply();
  var n = De = [], i = [], r = st = [];
  for (const l of t)
    try {
      E(this, S, Ct).call(this, l, n, i);
    } catch (p) {
      throw yn(l), p;
    }
  if (m = null, r.length > 0) {
    var a = mt.ensure();
    for (const l of r)
      a.schedule(l);
  }
  if (De = null, st = null, E(this, S, at).call(this) || E(this, S, gn).call(this)) {
    E(this, S, ot).call(this, i), E(this, S, ot).call(this, n);
    for (const [l, p] of s(this, Q))
      bn(l, p);
  } else {
    s(this, re).size === 0 && we.delete(this), s(this, de).clear(), s(this, se).clear();
    for (const l of s(this, Fe)) l(this);
    s(this, Fe).clear(), Qt(i), Qt(n), (u = s(this, Ze)) == null || u.resolve();
  }
  var f = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    m
  );
  if (s(this, L).length > 0) {
    const l = f ?? (f = this);
    s(l, L).push(...s(this, L).filter((p) => !s(l, L).includes(p)));
  }
  f !== null && (we.add(f), E(o = f, S, lt).call(o));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Ct = function(t, n, i) {
  t.f ^= N;
  for (var r = t.first; r !== null; ) {
    var a = r.f, f = (a & (oe | _e)) !== 0, u = f && (a & N) !== 0, o = u || (a & ee) !== 0 || s(this, Q).has(r);
    if (!o && r.fn !== null) {
      f ? r.f ^= N : (a & Ke) !== 0 ? n.push(r) : nt(r) && ((a & X) !== 0 && s(this, se).add(r), Be(r));
      var l = r.first;
      if (l !== null) {
        r = l;
        continue;
      }
    }
    for (; r !== null; ) {
      var p = r.next;
      if (p !== null) {
        r = p;
        break;
      }
      r = r.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
ot = function(t) {
  for (var n = 0; n < t.length; n += 1)
    mn(t[n], s(this, de), s(this, se));
}, Si = function() {
  var p, v, h;
  for (const d of we) {
    var t = d.id < this.id, n = [];
    for (const [c, [b, k]] of this.current) {
      if (d.current.has(c)) {
        var i = (
          /** @type {[any, boolean]} */
          d.current.get(c)[0]
        );
        if (t && b !== i)
          d.current.set(c, [b, k]);
        else
          continue;
      }
      n.push(c);
    }
    var r = [...d.current.keys()].filter((c) => !this.current.has(c));
    if (r.length === 0)
      t && d.discard();
    else if (n.length > 0) {
      if (t)
        for (const c of s(this, Ie))
          d.unskip_effect(c, (b) => {
            var k;
            (b.f & (X | vt)) !== 0 ? d.schedule(b) : E(k = d, S, ot).call(k, [b]);
          });
      d.activate();
      var a = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
      for (var u of n)
        wn(u, r, a, f);
      f = /* @__PURE__ */ new Map();
      var o = [...d.current.keys()].filter(
        (c) => this.current.has(c) ? (
          /** @type {[any, boolean]} */
          this.current.get(c)[0] !== c
        ) : !0
      );
      for (const c of s(this, Qe))
        (c.f & (ve | ee | At)) === 0 && qt(c, o, f) && ((c.f & (vt | X)) !== 0 ? (T(c, F), d.schedule(c)) : s(d, de).add(c));
      if (s(d, L).length > 0) {
        d.apply();
        for (var l of s(d, L))
          E(p = d, S, Ct).call(p, l, [], []);
        _(d, L, []);
      }
      d.deactivate();
    }
  }
  for (const d of we)
    s(d, xe).has(this) && (s(d, xe).delete(this), s(d, xe).size === 0 && !E(v = d, S, at).call(v) && (d.activate(), E(h = d, S, lt).call(h)));
};
let qe = mt;
function Ti() {
  try {
    di();
  } catch (e) {
    Oe(e, Rt);
  }
}
let H = null;
function Qt(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var i = e[n++];
      if ((i.f & (ve | ee)) === 0 && nt(i) && (H = /* @__PURE__ */ new Set(), Be(i), i.deps === null && i.first === null && i.nodes === null && i.teardown === null && i.ac === null && Mn(i), (H == null ? void 0 : H.size) > 0)) {
        Ae.clear();
        for (const r of H) {
          if ((r.f & (ve | ee)) !== 0) continue;
          const a = [r];
          let f = r.parent;
          for (; f !== null; )
            H.has(f) && (H.delete(f), a.push(f)), f = f.parent;
          for (let u = a.length - 1; u >= 0; u--) {
            const o = a[u];
            (o.f & (ve | ee)) === 0 && Be(o);
          }
        }
        H.clear();
      }
    }
    H = null;
  }
}
function wn(e, t, n, i) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const r of e.reactions) {
      const a = r.f;
      (a & D) !== 0 ? wn(
        /** @type {Derived} */
        r,
        t,
        n,
        i
      ) : (a & (vt | X)) !== 0 && (a & F) === 0 && qt(r, t, i) && (T(r, F), Bt(
        /** @type {Effect} */
        r
      ));
    }
}
function qt(e, t, n) {
  const i = n.get(e);
  if (i !== void 0) return i;
  if (e.deps !== null)
    for (const r of e.deps) {
      if (Le.call(t, r))
        return !0;
      if ((r.f & D) !== 0 && qt(
        /** @type {Derived} */
        r,
        t,
        n
      ))
        return n.set(
          /** @type {Derived} */
          r,
          !0
        ), !0;
    }
  return n.set(e, !1), !1;
}
function Bt(e) {
  m.schedule(e);
}
function bn(e, t) {
  if (!((e.f & oe) !== 0 && (e.f & N) !== 0)) {
    (e.f & F) !== 0 ? t.d.push(e) : (e.f & ne) !== 0 && t.m.push(e), T(e, N);
    for (var n = e.first; n !== null; )
      bn(n, t), n = n.next;
  }
}
function yn(e) {
  T(e, N);
  for (var t = e.first; t !== null; )
    yn(t), t = t.next;
}
function Ai(e) {
  let t = 0, n = Vt(0), i;
  return () => {
    Yt() && (he(n), Wi(() => (t === 0 && (i = Ht(() => e(() => He(n)))), t += 1, () => {
      Pe(() => {
        t -= 1, t === 0 && (i == null || i(), i = void 0, He(n));
      });
    })));
  };
}
var Ri = pt | tt;
function Ci(e, t, n, i) {
  new Ni(e, t, n, i);
}
var G, It, V, Se, M, W, P, q, ae, Te, pe, je, Xe, et, le, gt, x, Oi, Di, Pi, Nt, ut, ft, Ot, Dt;
class Ni {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, i, r) {
    g(this, x);
    /** @type {Boundary | null} */
    $(this, "parent");
    $(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    $(this, "transform_error");
    /** @type {TemplateNode} */
    g(this, G);
    /** @type {TemplateNode | null} */
    g(this, It, null);
    /** @type {BoundaryProps} */
    g(this, V);
    /** @type {((anchor: Node) => void)} */
    g(this, Se);
    /** @type {Effect} */
    g(this, M);
    /** @type {Effect | null} */
    g(this, W, null);
    /** @type {Effect | null} */
    g(this, P, null);
    /** @type {Effect | null} */
    g(this, q, null);
    /** @type {DocumentFragment | null} */
    g(this, ae, null);
    g(this, Te, 0);
    g(this, pe, 0);
    g(this, je, !1);
    /** @type {Set<Effect>} */
    g(this, Xe, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    g(this, et, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    g(this, le, null);
    g(this, gt, Ai(() => (_(this, le, Vt(s(this, Te))), () => {
      _(this, le, null);
    })));
    var a;
    _(this, G, t), _(this, V, n), _(this, Se, (f) => {
      var u = (
        /** @type {Effect} */
        y
      );
      u.b = this, u.f |= Tt, i(f);
    }), this.parent = /** @type {Effect} */
    y.b, this.transform_error = r ?? ((a = this.parent) == null ? void 0 : a.transform_error) ?? ((f) => f), _(this, M, Yi(() => {
      E(this, x, Nt).call(this);
    }, Ri));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    mn(t, s(this, Xe), s(this, et));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!s(this, V).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    E(this, x, Ot).call(this, t, n), _(this, Te, s(this, Te) + t), !(!s(this, le) || s(this, je)) && (_(this, je, !0), Pe(() => {
      _(this, je, !1), s(this, le) && Sn(s(this, le), s(this, Te));
    }));
  }
  get_effect_pending() {
    return s(this, gt).call(this), he(
      /** @type {Source<number>} */
      s(this, le)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!s(this, V).onerror && !s(this, V).failed)
      throw t;
    m != null && m.is_fork ? (s(this, W) && m.skip_effect(s(this, W)), s(this, P) && m.skip_effect(s(this, P)), s(this, q) && m.skip_effect(s(this, q)), m.on_fork_commit(() => {
      E(this, x, Dt).call(this, t);
    })) : E(this, x, Dt).call(this, t);
  }
}
G = new WeakMap(), It = new WeakMap(), V = new WeakMap(), Se = new WeakMap(), M = new WeakMap(), W = new WeakMap(), P = new WeakMap(), q = new WeakMap(), ae = new WeakMap(), Te = new WeakMap(), pe = new WeakMap(), je = new WeakMap(), Xe = new WeakMap(), et = new WeakMap(), le = new WeakMap(), gt = new WeakMap(), x = new WeakSet(), Oi = function() {
  try {
    _(this, W, be(() => s(this, Se).call(this, s(this, G))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Di = function(t) {
  const n = s(this, V).failed;
  n && _(this, q, be(() => {
    n(
      s(this, G),
      () => t,
      () => () => {
      }
    );
  }));
}, Pi = function() {
  const t = s(this, V).pending;
  t && (this.is_pending = !0, _(this, P, be(() => t(s(this, G)))), Pe(() => {
    var n = _(this, ae, document.createDocumentFragment()), i = Nn();
    n.append(i), _(this, W, E(this, x, ft).call(this, () => be(() => s(this, Se).call(this, i)))), s(this, pe) === 0 && (s(this, G).before(n), _(this, ae, null), ct(
      /** @type {Effect} */
      s(this, P),
      () => {
        _(this, P, null);
      }
    ), E(this, x, ut).call(
      this,
      /** @type {Batch} */
      m
    ));
  }));
}, Nt = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), _(this, pe, 0), _(this, Te, 0), _(this, W, be(() => {
      s(this, Se).call(this, s(this, G));
    })), s(this, pe) > 0) {
      var t = _(this, ae, document.createDocumentFragment());
      Ki(s(this, W), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        s(this, V).pending
      );
      _(this, P, be(() => n(s(this, G))));
    } else
      E(this, x, ut).call(
        this,
        /** @type {Batch} */
        m
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
ut = function(t) {
  this.is_pending = !1, t.transfer_effects(s(this, Xe), s(this, et));
}, /**
 * @template T
 * @param {() => T} fn
 */
ft = function(t) {
  var n = y, i = w, r = O;
  ge(s(this, M)), ie(s(this, M)), _t(s(this, M).ctx);
  try {
    return qe.ensure(), t();
  } catch (a) {
    return vn(a), null;
  } finally {
    ge(n), ie(i), _t(r);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Ot = function(t, n) {
  var i;
  if (!this.has_pending_snippet()) {
    this.parent && E(i = this.parent, x, Ot).call(i, t, n);
    return;
  }
  _(this, pe, s(this, pe) + t), s(this, pe) === 0 && (E(this, x, ut).call(this, n), s(this, P) && ct(s(this, P), () => {
    _(this, P, null);
  }), s(this, ae) && (s(this, G).before(s(this, ae)), _(this, ae, null)));
}, /**
 * @param {unknown} error
 */
Dt = function(t) {
  s(this, W) && (te(s(this, W)), _(this, W, null)), s(this, P) && (te(s(this, P)), _(this, P, null)), s(this, q) && (te(s(this, q)), _(this, q, null));
  var n = s(this, V).onerror;
  let i = s(this, V).failed;
  var r = !1, a = !1;
  const f = () => {
    if (r) {
      bi();
      return;
    }
    r = !0, a && _i(), s(this, q) !== null && ct(s(this, q), () => {
      _(this, q, null);
    }), E(this, x, ft).call(this, () => {
      E(this, x, Nt).call(this);
    });
  }, u = (o) => {
    try {
      a = !0, n == null || n(o, f), a = !1;
    } catch (l) {
      Oe(l, s(this, M) && s(this, M).parent);
    }
    i && _(this, q, E(this, x, ft).call(this, () => {
      try {
        return be(() => {
          var l = (
            /** @type {Effect} */
            y
          );
          l.b = this, l.f |= Tt, i(
            s(this, G),
            () => o,
            () => f
          );
        });
      } catch (l) {
        return Oe(
          l,
          /** @type {Effect} */
          s(this, M).parent
        ), null;
      }
    }));
  };
  Pe(() => {
    var o;
    try {
      o = this.transform_error(t);
    } catch (l) {
      Oe(l, s(this, M) && s(this, M).parent);
      return;
    }
    o !== null && typeof o == "object" && typeof /** @type {any} */
    o.then == "function" ? o.then(
      u,
      /** @param {unknown} e */
      (l) => Oe(l, s(this, M) && s(this, M).parent)
    ) : u(o);
  });
};
// @__NO_SIDE_EFFECTS__
function Fi(e) {
  var t = D | F;
  return y !== null && (y.f |= tt), {
    ctx: O,
    deps: null,
    effects: null,
    equals: dn,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      R
    ),
    wv: 0,
    parent: y,
    ac: null
  };
}
function Mi(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      te(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Gt(e) {
  var t, n = y, i = e.parent;
  if (!me && i !== null && (i.f & (ve | ee)) !== 0)
    return wi(), e.v;
  ge(i);
  try {
    e.f &= ~Ce, Mi(e), t = qn(e);
  } finally {
    ge(n);
  }
  return t;
}
function kn(e) {
  var t = Gt(e);
  if (!e.equals(t) && (e.wv = jn(), (!(m != null && m.is_fork) || e.deps === null) && (m !== null ? m.capture(e, t, !0) : e.v = t, e.deps === null))) {
    T(e, N);
    return;
  }
  me || (C !== null ? (Yt() || m != null && m.is_fork) && C.set(e, t) : Lt(e));
}
function Ii(e) {
  var t, n;
  if (e.effects !== null)
    for (const i of e.effects)
      (i.teardown || i.ac) && ((t = i.teardown) == null || t.call(i), (n = i.ac) == null || n.abort(jt), i.teardown = ri, i.ac = null, Je(i, 0), Ut(i));
}
function En(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && Be(t);
}
let Pt = /* @__PURE__ */ new Set();
const Ae = /* @__PURE__ */ new Map();
let xn = !1;
function Vt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: dn,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function fe(e, t) {
  const n = Vt(e);
  return $i(n), n;
}
function ye(e, t, n = !1) {
  w !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!K || (w.f & At) !== 0) && bt() && (w.f & (D | X | vt | At)) !== 0 && (U === null || !Le.call(U, e)) && vi();
  let i = n ? We(t) : t;
  return Sn(e, i, st);
}
function Sn(e, t, n = null) {
  if (!e.equals(t)) {
    Ae.set(e, me ? t : e.v);
    var i = qe.ensure();
    if (i.capture(e, t), (e.f & D) !== 0) {
      const r = (
        /** @type {Derived} */
        e
      );
      (e.f & F) !== 0 && Gt(r), C === null && Lt(r);
    }
    e.wv = jn(), Tn(e, F, n), bt() && y !== null && (y.f & N) !== 0 && (y.f & (oe | _e)) === 0 && (B === null ? Ji([e]) : B.push(e)), !i.is_fork && Pt.size > 0 && !xn && zi();
  }
  return t;
}
function zi() {
  xn = !1;
  for (const e of Pt)
    (e.f & N) !== 0 && T(e, ne), nt(e) && Be(e);
  Pt.clear();
}
function He(e) {
  ye(e, e.v + 1);
}
function Tn(e, t, n) {
  var i = e.reactions;
  if (i !== null)
    for (var r = bt(), a = i.length, f = 0; f < a; f++) {
      var u = i[f], o = u.f;
      if (!(!r && u === y)) {
        var l = (o & F) === 0;
        if (l && T(u, t), (o & D) !== 0) {
          var p = (
            /** @type {Derived} */
            u
          );
          C == null || C.delete(p), (o & Ce) === 0 && (o & Y && (y === null || (y.f & ht) === 0) && (u.f |= Ce), Tn(p, ne, n));
        } else if (l) {
          var v = (
            /** @type {Effect} */
            u
          );
          (o & X) !== 0 && H !== null && H.add(v), n !== null ? n.push(v) : Bt(v);
        }
      }
    }
}
function We(e) {
  if (typeof e != "object" || e === null || Ue in e)
    return e;
  const t = un(e);
  if (t !== ni && t !== ii)
    return e;
  var n = /* @__PURE__ */ new Map(), i = Zn(e), r = /* @__PURE__ */ fe(0), a = Re, f = (u) => {
    if (Re === a)
      return u();
    var o = w, l = Re;
    ie(null), tn(a);
    var p = u();
    return ie(o), tn(l), p;
  };
  return i && n.set("length", /* @__PURE__ */ fe(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(u, o, l) {
        (!("value" in l) || l.configurable === !1 || l.enumerable === !1 || l.writable === !1) && pi();
        var p = n.get(o);
        return p === void 0 ? f(() => {
          var v = /* @__PURE__ */ fe(l.value);
          return n.set(o, v), v;
        }) : ye(p, l.value, !0), !0;
      },
      deleteProperty(u, o) {
        var l = n.get(o);
        if (l === void 0) {
          if (o in u) {
            const p = f(() => /* @__PURE__ */ fe(R));
            n.set(o, p), He(r);
          }
        } else
          ye(l, R), He(r);
        return !0;
      },
      get(u, o, l) {
        var d;
        if (o === Ue)
          return e;
        var p = n.get(o), v = o in u;
        if (p === void 0 && (!v || (d = Ye(u, o)) != null && d.writable) && (p = f(() => {
          var c = We(v ? u[o] : R), b = /* @__PURE__ */ fe(c);
          return b;
        }), n.set(o, p)), p !== void 0) {
          var h = he(p);
          return h === R ? void 0 : h;
        }
        return Reflect.get(u, o, l);
      },
      getOwnPropertyDescriptor(u, o) {
        var l = Reflect.getOwnPropertyDescriptor(u, o);
        if (l && "value" in l) {
          var p = n.get(o);
          p && (l.value = he(p));
        } else if (l === void 0) {
          var v = n.get(o), h = v == null ? void 0 : v.v;
          if (v !== void 0 && h !== R)
            return {
              enumerable: !0,
              configurable: !0,
              value: h,
              writable: !0
            };
        }
        return l;
      },
      has(u, o) {
        var h;
        if (o === Ue)
          return !0;
        var l = n.get(o), p = l !== void 0 && l.v !== R || Reflect.has(u, o);
        if (l !== void 0 || y !== null && (!p || (h = Ye(u, o)) != null && h.writable)) {
          l === void 0 && (l = f(() => {
            var d = p ? We(u[o]) : R, c = /* @__PURE__ */ fe(d);
            return c;
          }), n.set(o, l));
          var v = he(l);
          if (v === R)
            return !1;
        }
        return p;
      },
      set(u, o, l, p) {
        var ue;
        var v = n.get(o), h = o in u;
        if (i && o === "length")
          for (var d = l; d < /** @type {Source<number>} */
          v.v; d += 1) {
            var c = n.get(d + "");
            c !== void 0 ? ye(c, R) : d in u && (c = f(() => /* @__PURE__ */ fe(R)), n.set(d + "", c));
          }
        if (v === void 0)
          (!h || (ue = Ye(u, o)) != null && ue.writable) && (v = f(() => /* @__PURE__ */ fe(void 0)), ye(v, We(l)), n.set(o, v));
        else {
          h = v.v !== R;
          var b = f(() => We(l));
          ye(v, b);
        }
        var k = Reflect.getOwnPropertyDescriptor(u, o);
        if (k != null && k.set && k.set.call(p, l), !h) {
          if (i && typeof o == "string") {
            var A = (
              /** @type {Source<number>} */
              n.get("length")
            ), z = Number(o);
            Number.isInteger(z) && z >= A.v && ye(A, z + 1);
          }
          He(r);
        }
        return !0;
      },
      ownKeys(u) {
        he(r);
        var o = Reflect.ownKeys(u).filter((v) => {
          var h = n.get(v);
          return h === void 0 || h.v !== R;
        });
        for (var [l, p] of n)
          p.v !== R && !(l in u) && o.push(l);
        return o;
      },
      setPrototypeOf() {
        hi();
      }
    }
  );
}
var Xt, An, Rn, Cn;
function ji() {
  if (Xt === void 0) {
    Xt = window, An = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Rn = Ye(t, "firstChild").get, Cn = Ye(t, "nextSibling").get, $t(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), $t(n) && (n.__t = void 0);
  }
}
function Nn(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Wt(e) {
  return (
    /** @type {TemplateNode | null} */
    Rn.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function yt(e) {
  return (
    /** @type {TemplateNode | null} */
    Cn.call(e)
  );
}
function J(e, t) {
  return /* @__PURE__ */ Wt(e);
}
function Li(e, t = !1) {
  {
    var n = /* @__PURE__ */ Wt(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ yt(n) : n;
  }
}
function ce(e, t = 1, n = !1) {
  let i = e;
  for (; t--; )
    i = /** @type {TemplateNode} */
    /* @__PURE__ */ yt(i);
  return i;
}
function qi(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(gi, e, void 0)
  );
}
function On(e) {
  var t = w, n = y;
  ie(null), ge(null);
  try {
    return e();
  } finally {
    ie(t), ge(n);
  }
}
function Dn(e) {
  y === null && (w === null && ci(), fi()), me && ui();
}
function Bi(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Ve(e, t) {
  var n = y;
  n !== null && (n.f & ee) !== 0 && (e |= ee);
  var i = {
    ctx: O,
    deps: null,
    nodes: null,
    f: e | F | Y,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  m == null || m.register_created_effect(i);
  var r = i;
  if ((e & Ke) !== 0)
    De !== null ? De.push(i) : qe.ensure().schedule(i);
  else if (t !== null) {
    try {
      Be(i);
    } catch (f) {
      throw te(i), f;
    }
    r.deps === null && r.teardown === null && r.nodes === null && r.first === r.last && // either `null`, or a singular child
    (r.f & tt) === 0 && (r = r.first, (e & X) !== 0 && (e & pt) !== 0 && r !== null && (r.f |= pt));
  }
  if (r !== null && (r.parent = n, n !== null && Bi(r, n), w !== null && (w.f & D) !== 0 && (e & _e) === 0)) {
    var a = (
      /** @type {Derived} */
      w
    );
    (a.effects ?? (a.effects = [])).push(r);
  }
  return i;
}
function Yt() {
  return w !== null && !K;
}
function Ft(e) {
  Dn();
  var t = (
    /** @type {Effect} */
    y.f
  ), n = !w && (t & oe) !== 0 && (t & Ge) === 0;
  if (n) {
    var i = (
      /** @type {ComponentContext} */
      O
    );
    (i.e ?? (i.e = [])).push(e);
  } else
    return Pn(e);
}
function Pn(e) {
  return Ve(Ke | cn, e);
}
function Gi(e) {
  return Dn(), Ve(zt | cn, e);
}
function Vi(e) {
  qe.ensure();
  const t = Ve(_e | tt, e);
  return (n = {}) => new Promise((i) => {
    n.outro ? ct(t, () => {
      te(t), i(void 0);
    }) : (te(t), i(void 0));
  });
}
function Wi(e, t = 0) {
  return Ve(zt | t, e);
}
function Yi(e, t = 0) {
  var n = Ve(X | t, e);
  return n;
}
function be(e) {
  return Ve(oe | tt, e);
}
function Fn(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = me, i = w;
    en(!0), ie(null);
    try {
      t.call(null);
    } finally {
      en(n), ie(i);
    }
  }
}
function Ut(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const r = n.ac;
    r !== null && On(() => {
      r.abort(jt);
    });
    var i = n.next;
    (n.f & _e) !== 0 ? n.parent = null : te(n, t), n = i;
  }
}
function Ui(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & oe) === 0 && te(t), t = n;
  }
}
function te(e, t = !0) {
  var n = !1;
  (t || (e.f & li) !== 0) && e.nodes !== null && e.nodes.end !== null && (Hi(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), T(e, Jt), Ut(e, t && !n), Je(e, 0);
  var i = e.nodes && e.nodes.t;
  if (i !== null)
    for (const a of i)
      a.stop();
  Fn(e), e.f ^= Jt, e.f |= ve;
  var r = e.parent;
  r !== null && r.first !== null && Mn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Hi(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ yt(e);
    e.remove(), e = n;
  }
}
function Mn(e) {
  var t = e.parent, n = e.prev, i = e.next;
  n !== null && (n.next = i), i !== null && (i.prev = n), t !== null && (t.first === e && (t.first = i), t.last === e && (t.last = n));
}
function ct(e, t, n = !0) {
  var i = [];
  In(e, i, !0);
  var r = () => {
    n && te(e), t && t();
  }, a = i.length;
  if (a > 0) {
    var f = () => --a || r();
    for (var u of i)
      u.out(f);
  } else
    r();
}
function In(e, t, n) {
  if ((e.f & ee) === 0) {
    e.f ^= ee;
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const u of i)
        (u.is_global || n) && t.push(u);
    for (var r = e.first; r !== null; ) {
      var a = r.next;
      if ((r.f & _e) === 0) {
        var f = (r.f & pt) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (r.f & oe) !== 0 && (e.f & X) !== 0;
        In(r, t, f ? n : !1);
      }
      r = a;
    }
  }
}
function Ki(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, i = e.nodes.end; n !== null; ) {
      var r = n === i ? null : /* @__PURE__ */ yt(n);
      t.append(n), n = r;
    }
}
let dt = !1, me = !1;
function en(e) {
  me = e;
}
let w = null, K = !1;
function ie(e) {
  w = e;
}
let y = null;
function ge(e) {
  y = e;
}
let U = null;
function $i(e) {
  w !== null && (U === null ? U = [e] : U.push(e));
}
let I = null, j = 0, B = null;
function Ji(e) {
  B = e;
}
let zn = 1, ke = 0, Re = ke;
function tn(e) {
  Re = e;
}
function jn() {
  return ++zn;
}
function nt(e) {
  var t = e.f;
  if ((t & F) !== 0)
    return !0;
  if (t & D && (e.f &= ~Ce), (t & ne) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), i = n.length, r = 0; r < i; r++) {
      var a = n[r];
      if (nt(
        /** @type {Derived} */
        a
      ) && kn(
        /** @type {Derived} */
        a
      ), a.wv > e.wv)
        return !0;
    }
    (t & Y) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    C === null && T(e, N);
  }
  return !1;
}
function Ln(e, t, n = !0) {
  var i = e.reactions;
  if (i !== null && !(U !== null && Le.call(U, e)))
    for (var r = 0; r < i.length; r++) {
      var a = i[r];
      (a.f & D) !== 0 ? Ln(
        /** @type {Derived} */
        a,
        t,
        !1
      ) : t === a && (n ? T(a, F) : (a.f & N) !== 0 && T(a, ne), Bt(
        /** @type {Effect} */
        a
      ));
    }
}
function qn(e) {
  var b;
  var t = I, n = j, i = B, r = w, a = U, f = O, u = K, o = Re, l = e.f;
  I = /** @type {null | Value[]} */
  null, j = 0, B = null, w = (l & (oe | _e)) === 0 ? e : null, U = null, _t(e.ctx), K = !1, Re = ++ke, e.ac !== null && (On(() => {
    e.ac.abort(jt);
  }), e.ac = null);
  try {
    e.f |= ht;
    var p = (
      /** @type {Function} */
      e.fn
    ), v = p();
    e.f |= Ge;
    var h = e.deps, d = m == null ? void 0 : m.is_fork;
    if (I !== null) {
      var c;
      if (d || Je(e, j), h !== null && j > 0)
        for (h.length = j + I.length, c = 0; c < I.length; c++)
          h[j + c] = I[c];
      else
        e.deps = h = I;
      if (Yt() && (e.f & Y) !== 0)
        for (c = j; c < h.length; c++)
          ((b = h[c]).reactions ?? (b.reactions = [])).push(e);
    } else !d && h !== null && j < h.length && (Je(e, j), h.length = j);
    if (bt() && B !== null && !K && h !== null && (e.f & (D | ne | F)) === 0)
      for (c = 0; c < /** @type {Source[]} */
      B.length; c++)
        Ln(
          B[c],
          /** @type {Effect} */
          e
        );
    if (r !== null && r !== e) {
      if (ke++, r.deps !== null)
        for (let k = 0; k < n; k += 1)
          r.deps[k].rv = ke;
      if (t !== null)
        for (const k of t)
          k.rv = ke;
      B !== null && (i === null ? i = B : i.push(.../** @type {Source[]} */
      B));
    }
    return (e.f & $e) !== 0 && (e.f ^= $e), v;
  } catch (k) {
    return vn(k);
  } finally {
    e.f ^= ht, I = t, j = n, B = i, w = r, U = a, _t(f), K = u, Re = o;
  }
}
function Zi(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var i = Qn.call(n, e);
    if (i !== -1) {
      var r = n.length - 1;
      r === 0 ? n = t.reactions = null : (n[i] = n[r], n.pop());
    }
  }
  if (n === null && (t.f & D) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (I === null || !Le.call(I, t))) {
    var a = (
      /** @type {Derived} */
      t
    );
    (a.f & Y) !== 0 && (a.f ^= Y, a.f &= ~Ce), a.v !== R && Lt(a), Ii(a), Je(a, 0);
  }
}
function Je(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var i = t; i < n.length; i++)
      Zi(e, n[i]);
}
function Be(e) {
  var t = e.f;
  if ((t & ve) === 0) {
    T(e, N);
    var n = y, i = dt;
    y = e, dt = !0;
    try {
      (t & (X | fn)) !== 0 ? Ui(e) : Ut(e), Fn(e);
      var r = qn(e);
      e.teardown = typeof r == "function" ? r : null, e.wv = zn;
      var a;
    } finally {
      dt = i, y = n;
    }
  }
}
function he(e) {
  var t = e.f, n = (t & D) !== 0;
  if (w !== null && !K) {
    var i = y !== null && (y.f & ve) !== 0;
    if (!i && (U === null || !Le.call(U, e))) {
      var r = w.deps;
      if ((w.f & ht) !== 0)
        e.rv < ke && (e.rv = ke, I === null && r !== null && r[j] === e ? j++ : I === null ? I = [e] : I.push(e));
      else {
        (w.deps ?? (w.deps = [])).push(e);
        var a = e.reactions;
        a === null ? e.reactions = [w] : Le.call(a, w) || a.push(w);
      }
    }
  }
  if (me && Ae.has(e))
    return Ae.get(e);
  if (n) {
    var f = (
      /** @type {Derived} */
      e
    );
    if (me) {
      var u = f.v;
      return ((f.f & N) === 0 && f.reactions !== null || Gn(f)) && (u = Gt(f)), Ae.set(f, u), u;
    }
    var o = (f.f & Y) === 0 && !K && w !== null && (dt || (w.f & Y) !== 0), l = (f.f & Ge) === 0;
    nt(f) && (o && (f.f |= Y), kn(f)), o && !l && (En(f), Bn(f));
  }
  if (C != null && C.has(e))
    return C.get(e);
  if ((e.f & $e) !== 0)
    throw e.v;
  return e.v;
}
function Bn(e) {
  if (e.f |= Y, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & D) !== 0 && (t.f & Y) === 0 && (En(
        /** @type {Derived} */
        t
      ), Bn(
        /** @type {Derived} */
        t
      ));
}
function Gn(e) {
  if (e.v === R) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Ae.has(t) || (t.f & D) !== 0 && Gn(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Ht(e) {
  var t = K;
  try {
    return K = !0, e();
  } finally {
    K = t;
  }
}
function Qi(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (Ue in e)
      Mt(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == "object" && n && Ue in n && Mt(n);
      }
  }
}
function Mt(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && // We don't want to traverse DOM elements
  !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let i in e)
      try {
        Mt(e[i], t);
      } catch {
      }
    const n = un(e);
    if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
      const i = ti(n);
      for (let r in i) {
        const a = i[r].get;
        if (a)
          try {
            a.call(e);
          } catch {
          }
      }
    }
  }
}
const Xi = ["touchstart", "touchmove"];
function er(e) {
  return Xi.includes(e);
}
const it = Symbol("events"), tr = /* @__PURE__ */ new Set(), nn = /* @__PURE__ */ new Set();
let rn = null;
function sn(e) {
  var k, A;
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), i = e.type, r = ((k = e.composedPath) == null ? void 0 : k.call(e)) || [], a = (
    /** @type {null | Element} */
    r[0] || e.target
  );
  rn = e;
  var f = 0, u = rn === e && e[it];
  if (u) {
    var o = r.indexOf(u);
    if (o !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[it] = t;
      return;
    }
    var l = r.indexOf(t);
    if (l === -1)
      return;
    o <= l && (f = o);
  }
  if (a = /** @type {Element} */
  r[f] || e.target, a !== t) {
    ei(e, "currentTarget", {
      configurable: !0,
      get() {
        return a || n;
      }
    });
    var p = w, v = y;
    ie(null), ge(null);
    try {
      for (var h, d = []; a !== null; ) {
        var c = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var b = (A = a[it]) == null ? void 0 : A[i];
          b != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === a) && b.call(a, e);
        } catch (z) {
          h ? d.push(z) : h = z;
        }
        if (e.cancelBubble || c === t || c === null)
          break;
        a = c;
      }
      if (h) {
        for (let z of d)
          queueMicrotask(() => {
            throw z;
          });
        throw h;
      }
    } finally {
      e[it] = t, delete e.currentTarget, ie(p), ge(v);
    }
  }
}
var ln;
const xt = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  ((ln = globalThis == null ? void 0 : globalThis.window) == null ? void 0 : ln.trustedTypes) && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (e) => e
  })
);
function nr(e) {
  return (
    /** @type {string} */
    (xt == null ? void 0 : xt.createHTML(e)) ?? e
  );
}
function ir(e) {
  var t = qi("template");
  return t.innerHTML = nr(e.replaceAll("<!>", "<!---->")), t.content;
}
function rr(e, t) {
  var n = (
    /** @type {Effect} */
    y
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function sr(e, t) {
  var n = (t & mi) !== 0, i, r = !e.startsWith("<!>");
  return () => {
    i === void 0 && (i = ir(r ? e : "<!>" + e));
    var a = (
      /** @type {TemplateNode} */
      n || An ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    {
      var f = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Wt(a)
      ), u = (
        /** @type {TemplateNode} */
        a.lastChild
      );
      rr(f, u);
    }
    return a;
  };
}
function ar(e, t) {
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function lr(e, t) {
  return or(e, t);
}
const rt = /* @__PURE__ */ new Map();
function or(e, { target: t, anchor: n, props: i = {}, events: r, context: a, intro: f = !0, transformError: u }) {
  ji();
  var o = void 0, l = Vi(() => {
    var p = n ?? t.appendChild(Nn());
    Ci(
      /** @type {TemplateNode} */
      p,
      {
        pending: () => {
        }
      },
      (d) => {
        pn({});
        var c = (
          /** @type {ComponentContext} */
          O
        );
        a && (c.c = a), r && (i.$$events = r), o = e(d, i) || {}, hn();
      },
      u
    );
    var v = /* @__PURE__ */ new Set(), h = (d) => {
      for (var c = 0; c < d.length; c++) {
        var b = d[c];
        if (!v.has(b)) {
          v.add(b);
          var k = er(b);
          for (const ue of [t, document]) {
            var A = rt.get(ue);
            A === void 0 && (A = /* @__PURE__ */ new Map(), rt.set(ue, A));
            var z = A.get(b);
            z === void 0 ? (ue.addEventListener(b, sn, { passive: k }), A.set(b, 1)) : A.set(b, z + 1);
          }
        }
      }
    };
    return h(Xn(tr)), nn.add(h), () => {
      var k;
      for (var d of v)
        for (const A of [t, document]) {
          var c = (
            /** @type {Map<string, number>} */
            rt.get(A)
          ), b = (
            /** @type {number} */
            c.get(d)
          );
          --b == 0 ? (A.removeEventListener(d, sn), c.delete(d), c.size === 0 && rt.delete(A)) : c.set(d, b);
        }
      nn.delete(h), p !== n && ((k = p.parentNode) == null || k.removeChild(p));
    };
  });
  return ur.set(o, l), o;
}
let ur = /* @__PURE__ */ new WeakMap();
function fr(e = !1) {
  const t = (
    /** @type {ComponentContextLegacy} */
    O
  ), n = t.l.u;
  if (!n) return;
  let i = () => Qi(t.s);
  if (e) {
    let r = 0, a = (
      /** @type {Record<string, any>} */
      {}
    );
    const f = /* @__PURE__ */ Fi(() => {
      let u = !1;
      const o = t.s;
      for (const l in o)
        o[l] !== a[l] && (a[l] = o[l], u = !0);
      return u && r++, r;
    });
    i = () => he(f);
  }
  n.b.length && Gi(() => {
    an(t, i), St(n.b);
  }), Ft(() => {
    const r = Ht(() => n.m.map(si));
    return () => {
      for (const a of r)
        typeof a == "function" && a();
    };
  }), n.a.length && Ft(() => {
    an(t, i), St(n.a);
  });
}
function an(e, t) {
  if (e.l.s)
    for (const n of e.l.s) he(n);
  t();
}
function cr(e) {
  O === null && oi(), wt && O.l !== null ? dr(O).m.push(e) : Ft(() => {
    const t = Ht(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
function dr(e) {
  var t = (
    /** @type {ComponentContextLegacy} */
    e.l
  );
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const pr = "5";
var on;
typeof window < "u" && ((on = window.__svelte ?? (window.__svelte = {})).v ?? (on.v = /* @__PURE__ */ new Set())).add(pr);
yi();
var hr = /* @__PURE__ */ sr('<div class="app"><header class="header"><div class="logo"><div class="logo-icon" aria-hidden="true"><img class="logo-icon-dark" src="/icons/inti-logo.svg" alt=""/> <img class="logo-icon-light" src="/icons/inti-light.svg" alt=""/></div> <span class="logo-name">Inti</span></div> <div class="header-nav"><a href="/api-keys.html" class="header-settings-link" title="Manage API keys"><span class="icon icon-key" aria-hidden="true"></span> API Keys</a> <a href="/settings.html" class="header-settings-link" title="Summarizer settings"><span class="icon icon-settings" aria-hidden="true"></span> Settings</a> <button id="theme-toggle" class="theme-toggle" type="button" title="Switch theme" aria-label="Switch theme"><span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span> <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span> <span class="theme-icon theme-icon-minimal icon icon-minimal" aria-hidden="true"></span> <span class="theme-icon theme-icon-minimal-dark icon icon-minimal-dark" aria-hidden="true"></span> <span id="theme-toggle-label">Theme</span></button></div></header> <main class="main-grid"><section class="panel panel-workspace" id="ocr-card"><div class="section-heading"><span class="ornament" aria-hidden="true"></span> <h2>Text Workspace</h2> <span class="source-chip">One working text</span></div> <div class="drop-zone" id="drop-zone" role="button" tabindex="0" aria-label="Import images for OCR"><span class="icon icon-upload-cloud drop-zone-icon" aria-hidden="true"></span> <p>Import images for OCR<br/>or click to <label for="file-input" class="file-label">browse</label></p> <span class="drop-hint" id="drop-hint">PNG, JPG, JPEG, WEBP, TIFF up to 25MB</span> <input type="file" id="file-input" accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/png,image/jpeg,image/webp,image/tiff" multiple="" hidden=""/></div> <div id="file-staging" hidden=""><div class="field-head"><span>Staged files</span> <span id="staged-count">0 files</span></div> <ul id="file-list"></ul> <div class="staging-actions"><button id="clear-files-btn" class="btn-secondary icon-only" title="Clear staged files"><span class="icon icon-trash" aria-hidden="true"></span></button> <button id="run-ocr-btn" class="btn-primary"><span aria-hidden="true">--</span> Extract Text <span class="icon icon-bolt" aria-hidden="true"></span></button></div></div> <div class="field-block ocr-output-block"><div class="field-head"><span>Working text</span> <span id="working-text-count">0 characters</span></div> <textarea id="working-text" rows="9" placeholder="Paste or build text here. OCR and summarization operate on this text by default."></textarea></div> <div id="workspace-actions" class="workspace-actions"><button id="clear-workspace-btn" class="btn-secondary" title="Clear working text"><span class="icon icon-x" aria-hidden="true"></span> Clear</button> <div class="select-wrap provider-wrap"><select id="provider-select" title="Summarizer provider"><option>Server default</option></select></div> <div class="select-wrap provider-wrap" id="sum-model-wrap" hidden=""><select id="sum-model-select" title="Summarizer model"></select></div> <button id="summarize-btn" class="btn-primary" title="Summarize source text"><span class="icon icon-bolt" aria-hidden="true"></span> <span>Summarize</span></button></div></section> <section class="panel panel-result"><div class="section-heading"><span class="ornament" aria-hidden="true"></span> <h2>Latest Text Result</h2> <span class="source-chip" id="text-result-kind-chip">No result yet</span></div> <div id="text-result" class="field-block"><div class="field-head"><span id="text-result-title">Transform result</span> <span id="text-result-count">0 characters</span></div> <div id="text-result-content" class="summary-markdown"></div> <div class="summary-actions result-actions"><button id="result-promote-default-btn" class="btn-primary"><span class="icon icon-arrow-up" aria-hidden="true"></span> <span id="result-promote-default-label">Append to Working Text</span></button> <button id="result-append-btn" class="btn-secondary"><span class="icon icon-arrow-up" aria-hidden="true"></span> <span>Append</span></button> <button id="result-replace-btn" class="btn-secondary"><span class="icon icon-brackets-horizontal" aria-hidden="true"></span> <span>Replace</span></button> <button id="result-copy-btn" class="btn-secondary"><span class="icon icon-copy" aria-hidden="true"></span> <span id="result-copy-label">Copy</span></button> <div class="split-button" id="result-download-group"><button id="result-download-btn" class="btn-secondary split-button-main"><span class="icon icon-download" aria-hidden="true"></span> Download</button> <button id="result-download-toggle" class="btn-secondary split-button-toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="result-download-menu" title="Choose download format"><span class="icon icon-chevron-down" aria-hidden="true"></span></button> <div id="result-download-menu" class="split-menu" role="menu" hidden=""><button type="button" class="split-menu-item" data-format="txt" role="menuitem">Download .txt</button> <button type="button" class="split-menu-item" data-format="md" role="menuitem">Download .md</button></div></div> <button id="result-speak-btn" class="btn-secondary"><span class="icon icon-speaker-waves" aria-hidden="true"></span> Generate Speech from Result</button></div></div></section> <section class="panel panel-tts"><div class="section-heading"><span class="ornament" aria-hidden="true"></span> <h2>Speech</h2> <span class="source-chip">Audio stays available after edits</span></div> <div class="field-block"><div class="field-head"><span>Speech input</span> <span id="speech-input-count">0 characters</span></div> <div id="speech-input-preview" class="summary-markdown speech-preview"></div></div> <div class="controls"><div class="select-wrap"><select id="model-select" title="Select TTS model"></select></div> <div class="select-wrap"><select id="voice-select" title="Select voice"></select></div> <div class="select-wrap"><select id="gender-filter" title="Filter by gender"><option>All voices</option><option>Female</option><option>Male</option></select></div> <div class="action-checkboxes"><label class="action-check"><input type="checkbox" id="action-speak"/> Auto-play</label> <label class="action-check"><input type="checkbox" id="action-download"/> Download</label></div> <button id="generate-working-audio-btn" class="btn-primary generate-btn"><span class="icon icon-speaker" aria-hidden="true"></span> Generate from Working Text</button> <button id="generate-result-audio-btn" class="btn-secondary"><span class="icon icon-speaker-waves" aria-hidden="true"></span> Generate from Result</button> <div class="playing-bar" id="playing-bar"><div class="bar"></div> <div class="bar"></div> <div class="bar"></div> <div class="bar"></div> <div class="bar"></div></div> <span class="status-text" id="status-text"></span></div> <div class="field-block"><div class="field-head"><span>Latest audio result</span> <span id="audio-result-meta">No audio yet</span></div> <div id="audio-result-card" class="summary-markdown speech-preview"></div> <div class="summary-actions"><button id="play-audio-btn" class="btn-secondary"><span class="icon icon-speaker-waves" aria-hidden="true"></span> Play</button> <button id="download-audio-btn" class="btn-secondary"><span class="icon icon-download" aria-hidden="true"></span> Download</button></div></div></section> <section class="panel panel-activity"><div class="section-heading"><span class="ornament" aria-hidden="true"></span> <h2>Activity</h2></div> <div class="feed" id="feed"><p class="feed-empty" id="feed-empty">No activity yet.</p></div> <button class="btn-secondary view-all-btn" type="button">View all</button></section></main></div> <div id="img-preview-modal" hidden=""><div id="img-preview-backdrop"></div> <div id="img-preview-box"><img id="img-preview-img" src="" alt="Preview"/> <button id="img-preview-close" title="Close">×</button></div></div>', 1);
function vr(e, t) {
  pn(t, !1), cr(async () => {
    if (window.__intiLegacyWorkspaceInitialized) return;
    window.__intiLegacyWorkspaceInitialized = !0;
    const [
      { initFeed: A },
      { updateTextMetrics: z },
      { initOCR: ue },
      { initProviders: Vn },
      { initSummarizer: Wn },
      { initTTS: Yn, synthesizeText: Un },
      { initVoices: Hn }
    ] = await Promise.all([
      import("./feed-DrSayDY3.js").then((Kn) => Kn.c),
      import("./metrics-CLwihjC0.js"),
      import("./ocr-n5RoqYBj.js"),
      import("./providers-CR6PBwPD.js"),
      import("./summarizer-DW5QO0se.js"),
      import("./tts-vMFxXLm3.js"),
      import("./voices-DdW-V1kh.js")
    ]);
    A(), Vn(), Hn(), ue(), Wn({ synthesizeText: Un }), Yn(), z();
  }), fr();
  var n = hr(), i = Li(n), r = ce(J(i), 2), a = J(r), f = ce(J(a), 8), u = ce(J(f), 2), o = J(u), l = J(o);
  l.value = l.__value = "";
  var p = ce(a, 4), v = ce(J(p), 4), h = ce(J(v), 4), d = J(h), c = J(d);
  c.value = c.__value = "All";
  var b = ce(c);
  b.value = b.__value = "Female";
  var k = ce(b);
  k.value = k.__value = "Male", ar(e, n), hn();
}
lr(vr, {
  target: document.getElementById("app")
});
export {
  ri as n,
  gr as s,
  Ht as u
};
