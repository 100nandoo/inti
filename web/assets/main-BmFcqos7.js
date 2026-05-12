var Bn = Object.defineProperty;
var Jt = (e) => {
  throw TypeError(e);
};
var Wn = (e, t, n) => t in e ? Bn(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Z = (e, t, n) => Wn(e, typeof t != "symbol" ? t + "" : t, n), St = (e, t, n) => t.has(e) || Jt("Cannot " + n);
var s = (e, t, n) => (St(e, t, "read from private field"), n ? n.call(e) : t.get(e)), b = (e, t, n) => t.has(e) ? Jt("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), g = (e, t, n, i) => (St(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), E = (e, t, n) => (St(e, t, "access private method"), n);
var Yn = Array.isArray, Hn = Array.prototype.indexOf, Ge = Array.prototype.includes, Un = Array.from, Kn = Object.defineProperty, Ue = Object.getOwnPropertyDescriptor, Jn = Object.getOwnPropertyDescriptors, Zn = Object.prototype, Qn = Array.prototype, un = Object.getPrototypeOf, Zt = Object.isExtensible;
const Xn = () => {
};
function ei(e) {
  return e();
}
function At(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function cn() {
  var e, t, n = new Promise((i, r) => {
    e = i, t = r;
  });
  return { promise: n, resolve: e, reject: t };
}
const N = 2, Ze = 4, rt = 8, dn = 1 << 24, ee = 16, ce = 32, ge = 64, Rt = 128, W = 512, C = 1024, O = 2048, ie = 4096, te = 8192, J = 16384, Me = 32768, Qt = 1 << 25, mt = 65536, Ct = 1 << 17, ti = 1 << 18, We = 1 << 19, pn = 1 << 20, Pe = 65536, gt = 1 << 21, Qe = 1 << 22, me = 1 << 23, Ke = Symbol("$state"), se = new class extends Error {
  constructor() {
    super(...arguments);
    Z(this, "name", "StaleReactionError");
    Z(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}();
function ni(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function ii() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function ri(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function si() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ai(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function li() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function oi() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function fi() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function ui() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function ci() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const R = Symbol(), di = "http://www.w3.org/1999/xhtml", pi = "http://www.w3.org/2000/svg", hi = "http://www.w3.org/1998/Math/MathML";
function vi() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function _i() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function hn(e) {
  return e === this.v;
}
function mi(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function gi(e) {
  return !mi(e, this.v);
}
let Et = !1;
function wi() {
  Et = !0;
}
let P = null;
function Ve(e) {
  P = e;
}
function vn(e, t = !1, n) {
  P = {
    p: P,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: (
      /** @type {Effect} */
      m
    ),
    l: Et && !t ? { s: null, u: null, $: [] } : null
  };
}
function _n(e) {
  var t = (
    /** @type {ComponentContext} */
    P
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var i of n)
      Dn(i);
  }
  return t.i = !0, P = t.p, /** @type {T} */
  {};
}
function st() {
  return !Et || P !== null && P.l === null;
}
let De = [];
function bi() {
  var e = De;
  De = [], At(e);
}
function Fe(e) {
  if (De.length === 0) {
    var t = De;
    queueMicrotask(() => {
      t === De && bi();
    });
  }
  De.push(e);
}
function mn(e) {
  var t = m;
  if (t === null)
    return w.f |= me, e;
  if ((t.f & Me) === 0 && (t.f & Ze) === 0)
    throw e;
  _e(e, t);
}
function _e(e, t) {
  for (; t !== null; ) {
    if ((t.f & Rt) !== 0) {
      if ((t.f & Me) === 0)
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
const yi = -7169;
function S(e, t) {
  e.f = e.f & yi | t;
}
function qt(e) {
  (e.f & W) !== 0 || e.deps === null ? S(e, C) : S(e, ie);
}
function gn(e) {
  if (e !== null)
    for (const t of e)
      (t.f & N) === 0 || (t.f & Pe) === 0 || (t.f ^= Pe, gn(
        /** @type {Derived} */
        t.deps
      ));
}
function wn(e, t, n) {
  (e.f & O) !== 0 ? t.add(e) : (e.f & ie) !== 0 && n.add(e), gn(e.deps), S(e, C);
}
const be = /* @__PURE__ */ new Set();
let _ = null, M = null, Pt = null, Tt = !1, Oe = null, ft = null;
var Xt = 0;
let ki = 1;
var Ie, je, xe, ae, Q, et, L, tt, he, le, X, ze, Le, Se, T, ut, bn, ct, Mt, dt, Ei;
const yt = class yt {
  constructor() {
    b(this, T);
    Z(this, "id", ki++);
    /**
     * The current values of any signals that are updated in this batch.
     * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
     * They keys of this map are identical to `this.#previous`
     * @type {Map<Value, [any, boolean]>}
     */
    Z(this, "current", /* @__PURE__ */ new Map());
    /**
     * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
     * They keys of this map are identical to `this.#current`
     * @type {Map<Value, any>}
     */
    Z(this, "previous", /* @__PURE__ */ new Map());
    /**
     * When the batch is committed (and the DOM is updated), we need to remove old branches
     * and append new ones by calling the functions added inside (if/each/key/etc) blocks
     * @type {Set<(batch: Batch) => void>}
     */
    b(this, Ie, /* @__PURE__ */ new Set());
    /**
     * If a fork is discarded, we need to destroy any effects that are no longer needed
     * @type {Set<(batch: Batch) => void>}
     */
    b(this, je, /* @__PURE__ */ new Set());
    /**
     * Callbacks that should run only when a fork is committed.
     * @type {Set<(batch: Batch) => void>}
     */
    b(this, xe, /* @__PURE__ */ new Set());
    /**
     * Async effects that are currently in flight
     * @type {Map<Effect, number>}
     */
    b(this, ae, /* @__PURE__ */ new Map());
    /**
     * Async effects that are currently in flight, _not_ inside a pending boundary
     * @type {Map<Effect, number>}
     */
    b(this, Q, /* @__PURE__ */ new Map());
    /**
     * A deferred that resolves when the batch is committed, used with `settled()`
     * TODO replace with Promise.withResolvers once supported widely enough
     * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
     */
    b(this, et, null);
    /**
     * The root effects that need to be flushed
     * @type {Effect[]}
     */
    b(this, L, []);
    /**
     * Effects created while this batch was active.
     * @type {Effect[]}
     */
    b(this, tt, []);
    /**
     * Deferred effects (which run after async work has completed) that are DIRTY
     * @type {Set<Effect>}
     */
    b(this, he, /* @__PURE__ */ new Set());
    /**
     * Deferred effects that are MAYBE_DIRTY
     * @type {Set<Effect>}
     */
    b(this, le, /* @__PURE__ */ new Set());
    /**
     * A map of branches that still exist, but will be destroyed when this batch
     * is committed — we skip over these during `process`.
     * The value contains child effects that were dirty/maybe_dirty before being reset,
     * so they can be rescheduled if the branch survives.
     * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
     */
    b(this, X, /* @__PURE__ */ new Map());
    /**
     * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
     * @type {Set<Effect>}
     */
    b(this, ze, /* @__PURE__ */ new Set());
    Z(this, "is_fork", !1);
    b(this, Le, !1);
    /** @type {Set<Batch>} */
    b(this, Se, /* @__PURE__ */ new Set());
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    s(this, X).has(t) || s(this, X).set(t, { d: [], m: [] }), s(this, ze).delete(t);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(t, n = (i) => this.schedule(i)) {
    var i = s(this, X).get(t);
    if (i) {
      s(this, X).delete(t);
      for (var r of i.d)
        S(r, O), n(r);
      for (r of i.m)
        S(r, ie), n(r);
    }
    s(this, ze).add(t);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(t, n, i = !1) {
    t.v !== R && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & me) === 0 && (this.current.set(t, [n, i]), M == null || M.set(t, n)), this.is_fork || (t.v = n);
  }
  activate() {
    _ = this;
  }
  deactivate() {
    _ = null, M = null;
  }
  flush() {
    try {
      Tt = !0, _ = this, E(this, T, ct).call(this);
    } finally {
      Xt = 0, Pt = null, Oe = null, ft = null, Tt = !1, _ = null, M = null, Re.clear();
    }
  }
  discard() {
    for (const t of s(this, je)) t(this);
    s(this, je).clear(), s(this, xe).clear(), be.delete(this);
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(t) {
    s(this, tt).push(t);
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(t, n) {
    let i = s(this, ae).get(n) ?? 0;
    if (s(this, ae).set(n, i + 1), t) {
      let r = s(this, Q).get(n) ?? 0;
      s(this, Q).set(n, r + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   * @param {boolean} skip - whether to skip updates (because this is triggered by a stale reaction)
   */
  decrement(t, n, i) {
    let r = s(this, ae).get(n) ?? 0;
    if (r === 1 ? s(this, ae).delete(n) : s(this, ae).set(n, r - 1), t) {
      let a = s(this, Q).get(n) ?? 0;
      a === 1 ? s(this, Q).delete(n) : s(this, Q).set(n, a - 1);
    }
    s(this, Le) || i || (g(this, Le, !0), Fe(() => {
      g(this, Le, !1), this.flush();
    }));
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(t, n) {
    for (const i of t)
      s(this, he).add(i);
    for (const i of n)
      s(this, le).add(i);
    t.clear(), n.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(t) {
    s(this, Ie).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    s(this, je).add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  on_fork_commit(t) {
    s(this, xe).add(t);
  }
  run_fork_commit_callbacks() {
    for (const t of s(this, xe)) t(this);
    s(this, xe).clear();
  }
  settled() {
    return (s(this, et) ?? g(this, et, cn())).promise;
  }
  static ensure() {
    if (_ === null) {
      const t = _ = new yt();
      Tt || (be.add(_), Fe(() => {
        _ === t && t.flush();
      }));
    }
    return _;
  }
  apply() {
    {
      M = null;
      return;
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(t) {
    var r;
    if (Pt = t, (r = t.b) != null && r.is_pending && (t.f & (Ze | rt | dn)) !== 0 && (t.f & Me) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var n = t; n.parent !== null; ) {
      n = n.parent;
      var i = n.f;
      if (Oe !== null && n === m && (w === null || (w.f & N) === 0))
        return;
      if ((i & (ge | ce)) !== 0) {
        if ((i & C) === 0)
          return;
        n.f ^= C;
      }
    }
    s(this, L).push(n);
  }
};
Ie = new WeakMap(), je = new WeakMap(), xe = new WeakMap(), ae = new WeakMap(), Q = new WeakMap(), et = new WeakMap(), L = new WeakMap(), tt = new WeakMap(), he = new WeakMap(), le = new WeakMap(), X = new WeakMap(), ze = new WeakMap(), Le = new WeakMap(), Se = new WeakMap(), T = new WeakSet(), ut = function() {
  return this.is_fork || s(this, Q).size > 0;
}, bn = function() {
  for (const i of s(this, Se))
    for (const r of s(i, Q).keys()) {
      for (var t = !1, n = r; n.parent !== null; ) {
        if (s(this, X).has(n)) {
          t = !0;
          break;
        }
        n = n.parent;
      }
      if (!t)
        return !0;
    }
  return !1;
}, ct = function() {
  var f, o;
  if (Xt++ > 1e3 && (be.delete(this), xi()), !E(this, T, ut).call(this)) {
    for (const l of s(this, he))
      s(this, le).delete(l), S(l, O), this.schedule(l);
    for (const l of s(this, le))
      S(l, ie), this.schedule(l);
  }
  const t = s(this, L);
  g(this, L, []), this.apply();
  var n = Oe = [], i = [], r = ft = [];
  for (const l of t)
    try {
      E(this, T, Mt).call(this, l, n, i);
    } catch (d) {
      throw En(l), d;
    }
  if (_ = null, r.length > 0) {
    var a = yt.ensure();
    for (const l of r)
      a.schedule(l);
  }
  if (Oe = null, ft = null, E(this, T, ut).call(this) || E(this, T, bn).call(this)) {
    E(this, T, dt).call(this, i), E(this, T, dt).call(this, n);
    for (const [l, d] of s(this, X))
      kn(l, d);
  } else {
    s(this, ae).size === 0 && be.delete(this), s(this, he).clear(), s(this, le).clear();
    for (const l of s(this, Ie)) l(this);
    s(this, Ie).clear(), en(i), en(n), (f = s(this, et)) == null || f.resolve();
  }
  var u = (
    /** @type {Batch | null} */
    /** @type {unknown} */
    _
  );
  if (s(this, L).length > 0) {
    const l = u ?? (u = this);
    s(l, L).push(...s(this, L).filter((d) => !s(l, L).includes(d)));
  }
  u !== null && (be.add(u), E(o = u, T, ct).call(o));
}, /**
 * Traverse the effect tree, executing effects or stashing
 * them for later execution as appropriate
 * @param {Effect} root
 * @param {Effect[]} effects
 * @param {Effect[]} render_effects
 */
Mt = function(t, n, i) {
  t.f ^= C;
  for (var r = t.first; r !== null; ) {
    var a = r.f, u = (a & (ce | ge)) !== 0, f = u && (a & C) !== 0, o = f || (a & te) !== 0 || s(this, X).has(r);
    if (!o && r.fn !== null) {
      u ? r.f ^= C : (a & Ze) !== 0 ? n.push(r) : at(r) && ((a & ee) !== 0 && s(this, le).add(r), Be(r));
      var l = r.first;
      if (l !== null) {
        r = l;
        continue;
      }
    }
    for (; r !== null; ) {
      var d = r.next;
      if (d !== null) {
        r = d;
        break;
      }
      r = r.parent;
    }
  }
}, /**
 * @param {Effect[]} effects
 */
dt = function(t) {
  for (var n = 0; n < t.length; n += 1)
    wn(t[n], s(this, he), s(this, le));
}, Ei = function() {
  var d, v, p;
  for (const h of be) {
    var t = h.id < this.id, n = [];
    for (const [c, [y, k]] of this.current) {
      if (h.current.has(c)) {
        var i = (
          /** @type {[any, boolean]} */
          h.current.get(c)[0]
        );
        if (t && y !== i)
          h.current.set(c, [y, k]);
        else
          continue;
      }
      n.push(c);
    }
    var r = [...h.current.keys()].filter((c) => !this.current.has(c));
    if (r.length === 0)
      t && h.discard();
    else if (n.length > 0) {
      if (t)
        for (const c of s(this, ze))
          h.unskip_effect(c, (y) => {
            var k;
            (y.f & (ee | Qe)) !== 0 ? h.schedule(y) : E(k = h, T, dt).call(k, [y]);
          });
      h.activate();
      var a = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
      for (var f of n)
        yn(f, r, a, u);
      u = /* @__PURE__ */ new Map();
      var o = [...h.current.keys()].filter(
        (c) => this.current.has(c) ? (
          /** @type {[any, boolean]} */
          this.current.get(c)[0] !== c
        ) : !0
      );
      for (const c of s(this, tt))
        (c.f & (J | te | Ct)) === 0 && Gt(c, o, u) && ((c.f & (Qe | ee)) !== 0 ? (S(c, O), h.schedule(c)) : s(h, he).add(c));
      if (s(h, L).length > 0) {
        h.apply();
        for (var l of s(h, L))
          E(d = h, T, Mt).call(d, l, [], []);
        g(h, L, []);
      }
      h.deactivate();
    }
  }
  for (const h of be)
    s(h, Se).has(this) && (s(h, Se).delete(this), s(h, Se).size === 0 && !E(v = h, T, ut).call(v) && (h.activate(), E(p = h, T, ct).call(p)));
};
let $e = yt;
function xi() {
  try {
    li();
  } catch (e) {
    _e(e, Pt);
  }
}
let U = null;
function en(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var i = e[n++];
      if ((i.f & (J | te)) === 0 && at(i) && (U = /* @__PURE__ */ new Set(), Be(i), i.deps === null && i.first === null && i.nodes === null && i.teardown === null && i.ac === null && In(i), (U == null ? void 0 : U.size) > 0)) {
        Re.clear();
        for (const r of U) {
          if ((r.f & (J | te)) !== 0) continue;
          const a = [r];
          let u = r.parent;
          for (; u !== null; )
            U.has(u) && (U.delete(u), a.push(u)), u = u.parent;
          for (let f = a.length - 1; f >= 0; f--) {
            const o = a[f];
            (o.f & (J | te)) === 0 && Be(o);
          }
        }
        U.clear();
      }
    }
    U = null;
  }
}
function yn(e, t, n, i) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const r of e.reactions) {
      const a = r.f;
      (a & N) !== 0 ? yn(
        /** @type {Derived} */
        r,
        t,
        n,
        i
      ) : (a & (Qe | ee)) !== 0 && (a & O) === 0 && Gt(r, t, i) && (S(r, O), Vt(
        /** @type {Effect} */
        r
      ));
    }
}
function Gt(e, t, n) {
  const i = n.get(e);
  if (i !== void 0) return i;
  if (e.deps !== null)
    for (const r of e.deps) {
      if (Ge.call(t, r))
        return !0;
      if ((r.f & N) !== 0 && Gt(
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
function Vt(e) {
  _.schedule(e);
}
function kn(e, t) {
  if (!((e.f & ce) !== 0 && (e.f & C) !== 0)) {
    (e.f & O) !== 0 ? t.d.push(e) : (e.f & ie) !== 0 && t.m.push(e), S(e, C);
    for (var n = e.first; n !== null; )
      kn(n, t), n = n.next;
  }
}
function En(e) {
  S(e, C);
  for (var t = e.first; t !== null; )
    En(t), t = t.next;
}
function Si(e) {
  let t = 0, n = xt(0), i;
  return () => {
    Ht() && (ue(n), Hi(() => (t === 0 && (i = Kt(() => e(() => Je(n)))), t += 1, () => {
      Fe(() => {
        t -= 1, t === 0 && (i == null || i(), i = void 0, Je(n));
      });
    })));
  };
}
var Ti = mt | We;
function Ai(e, t, n, i) {
  new Ri(e, t, n, i);
}
var V, Lt, $, Te, F, B, D, q, oe, Ae, ve, qe, nt, it, fe, kt, x, Ci, Pi, Mi, Nt, pt, ht, Dt, Ot;
class Ri {
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(t, n, i, r) {
    b(this, x);
    /** @type {Boundary | null} */
    Z(this, "parent");
    Z(this, "is_pending", !1);
    /**
     * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
     * Inherited from parent boundary, or defaults to identity.
     * @type {(error: unknown) => unknown}
     */
    Z(this, "transform_error");
    /** @type {TemplateNode} */
    b(this, V);
    /** @type {TemplateNode | null} */
    b(this, Lt, null);
    /** @type {BoundaryProps} */
    b(this, $);
    /** @type {((anchor: Node) => void)} */
    b(this, Te);
    /** @type {Effect} */
    b(this, F);
    /** @type {Effect | null} */
    b(this, B, null);
    /** @type {Effect | null} */
    b(this, D, null);
    /** @type {Effect | null} */
    b(this, q, null);
    /** @type {DocumentFragment | null} */
    b(this, oe, null);
    b(this, Ae, 0);
    b(this, ve, 0);
    b(this, qe, !1);
    /** @type {Set<Effect>} */
    b(this, nt, /* @__PURE__ */ new Set());
    /** @type {Set<Effect>} */
    b(this, it, /* @__PURE__ */ new Set());
    /**
     * A source containing the number of pending async deriveds/expressions.
     * Only created if `$effect.pending()` is used inside the boundary,
     * otherwise updating the source results in needless `Batch.ensure()`
     * calls followed by no-op flushes
     * @type {Source<number> | null}
     */
    b(this, fe, null);
    b(this, kt, Si(() => (g(this, fe, xt(s(this, Ae))), () => {
      g(this, fe, null);
    })));
    var a;
    g(this, V, t), g(this, $, n), g(this, Te, (u) => {
      var f = (
        /** @type {Effect} */
        m
      );
      f.b = this, f.f |= Rt, i(u);
    }), this.parent = /** @type {Effect} */
    m.b, this.transform_error = r ?? ((a = this.parent) == null ? void 0 : a.transform_error) ?? ((u) => u), g(this, F, Ki(() => {
      E(this, x, Nt).call(this);
    }, Ti));
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    wn(t, s(this, nt), s(this, it));
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!s(this, $).pending;
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(t, n) {
    E(this, x, Dt).call(this, t, n), g(this, Ae, s(this, Ae) + t), !(!s(this, fe) || s(this, qe)) && (g(this, qe, !0), Fe(() => {
      g(this, qe, !1), s(this, fe) && bt(s(this, fe), s(this, Ae));
    }));
  }
  get_effect_pending() {
    return s(this, kt).call(this), ue(
      /** @type {Source<number>} */
      s(this, fe)
    );
  }
  /** @param {unknown} error */
  error(t) {
    if (!s(this, $).onerror && !s(this, $).failed)
      throw t;
    _ != null && _.is_fork ? (s(this, B) && _.skip_effect(s(this, B)), s(this, D) && _.skip_effect(s(this, D)), s(this, q) && _.skip_effect(s(this, q)), _.on_fork_commit(() => {
      E(this, x, Ot).call(this, t);
    })) : E(this, x, Ot).call(this, t);
  }
}
V = new WeakMap(), Lt = new WeakMap(), $ = new WeakMap(), Te = new WeakMap(), F = new WeakMap(), B = new WeakMap(), D = new WeakMap(), q = new WeakMap(), oe = new WeakMap(), Ae = new WeakMap(), ve = new WeakMap(), qe = new WeakMap(), nt = new WeakMap(), it = new WeakMap(), fe = new WeakMap(), kt = new WeakMap(), x = new WeakSet(), Ci = function() {
  try {
    g(this, B, ye(() => s(this, Te).call(this, s(this, V))));
  } catch (t) {
    this.error(t);
  }
}, /**
 * @param {unknown} error The deserialized error from the server's hydration comment
 */
Pi = function(t) {
  const n = s(this, $).failed;
  n && g(this, q, ye(() => {
    n(
      s(this, V),
      () => t,
      () => () => {
      }
    );
  }));
}, Mi = function() {
  const t = s(this, $).pending;
  t && (this.is_pending = !0, g(this, D, ye(() => t(s(this, V)))), Fe(() => {
    var n = g(this, oe, document.createDocumentFragment()), i = Wt();
    n.append(i), g(this, B, E(this, x, ht).call(this, () => ye(() => s(this, Te).call(this, i)))), s(this, ve) === 0 && (s(this, V).before(n), g(this, oe, null), vt(
      /** @type {Effect} */
      s(this, D),
      () => {
        g(this, D, null);
      }
    ), E(this, x, pt).call(
      this,
      /** @type {Batch} */
      _
    ));
  }));
}, Nt = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), g(this, ve, 0), g(this, Ae, 0), g(this, B, ye(() => {
      s(this, Te).call(this, s(this, V));
    })), s(this, ve) > 0) {
      var t = g(this, oe, document.createDocumentFragment());
      Zi(s(this, B), t);
      const n = (
        /** @type {(anchor: Node) => void} */
        s(this, $).pending
      );
      g(this, D, ye(() => n(s(this, V))));
    } else
      E(this, x, pt).call(
        this,
        /** @type {Batch} */
        _
      );
  } catch (n) {
    this.error(n);
  }
}, /**
 * @param {Batch} batch
 */
pt = function(t) {
  this.is_pending = !1, t.transfer_effects(s(this, nt), s(this, it));
}, /**
 * @template T
 * @param {() => T} fn
 */
ht = function(t) {
  var n = m, i = w, r = P;
  re(s(this, F)), H(s(this, F)), Ve(s(this, F).ctx);
  try {
    return $e.ensure(), t();
  } catch (a) {
    return mn(a), null;
  } finally {
    re(n), H(i), Ve(r);
  }
}, /**
 * Updates the pending count associated with the currently visible pending snippet,
 * if any, such that we can replace the snippet with content once work is done
 * @param {1 | -1} d
 * @param {Batch} batch
 */
Dt = function(t, n) {
  var i;
  if (!this.has_pending_snippet()) {
    this.parent && E(i = this.parent, x, Dt).call(i, t, n);
    return;
  }
  g(this, ve, s(this, ve) + t), s(this, ve) === 0 && (E(this, x, pt).call(this, n), s(this, D) && vt(s(this, D), () => {
    g(this, D, null);
  }), s(this, oe) && (s(this, V).before(s(this, oe)), g(this, oe, null)));
}, /**
 * @param {unknown} error
 */
Ot = function(t) {
  s(this, B) && (ne(s(this, B)), g(this, B, null)), s(this, D) && (ne(s(this, D)), g(this, D, null)), s(this, q) && (ne(s(this, q)), g(this, q, null));
  var n = s(this, $).onerror;
  let i = s(this, $).failed;
  var r = !1, a = !1;
  const u = () => {
    if (r) {
      _i();
      return;
    }
    r = !0, a && ci(), s(this, q) !== null && vt(s(this, q), () => {
      g(this, q, null);
    }), E(this, x, ht).call(this, () => {
      E(this, x, Nt).call(this);
    });
  }, f = (o) => {
    try {
      a = !0, n == null || n(o, u), a = !1;
    } catch (l) {
      _e(l, s(this, F) && s(this, F).parent);
    }
    i && g(this, q, E(this, x, ht).call(this, () => {
      try {
        return ye(() => {
          var l = (
            /** @type {Effect} */
            m
          );
          l.b = this, l.f |= Rt, i(
            s(this, V),
            () => o,
            () => u
          );
        });
      } catch (l) {
        return _e(
          l,
          /** @type {Effect} */
          s(this, F).parent
        ), null;
      }
    }));
  };
  Fe(() => {
    var o;
    try {
      o = this.transform_error(t);
    } catch (l) {
      _e(l, s(this, F) && s(this, F).parent);
      return;
    }
    o !== null && typeof o == "object" && typeof /** @type {any} */
    o.then == "function" ? o.then(
      f,
      /** @param {unknown} e */
      (l) => _e(l, s(this, F) && s(this, F).parent)
    ) : f(o);
  });
};
function Ni(e, t, n, i) {
  const r = st() ? $t : Fi;
  var a = e.filter((p) => !p.settled);
  if (n.length === 0 && a.length === 0) {
    i(t.map(r));
    return;
  }
  var u = (
    /** @type {Effect} */
    m
  ), f = Di(), o = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((p) => p.promise)) : null;
  function l(p) {
    f();
    try {
      i(p);
    } catch (h) {
      (u.f & J) === 0 && _e(h, u);
    }
    wt();
  }
  if (n.length === 0) {
    o.then(() => l(t.map(r)));
    return;
  }
  var d = xn();
  function v() {
    Promise.all(n.map((p) => /* @__PURE__ */ Oi(p))).then((p) => l([...t.map(r), ...p])).catch((p) => _e(p, u)).finally(() => d());
  }
  o ? o.then(() => {
    f(), v(), wt();
  }) : v();
}
function Di() {
  var e = (
    /** @type {Effect} */
    m
  ), t = w, n = P, i = (
    /** @type {Batch} */
    _
  );
  return function(a = !0) {
    re(e), H(t), Ve(n), a && (e.f & J) === 0 && (i == null || i.activate(), i == null || i.apply());
  };
}
function wt(e = !0) {
  re(null), H(null), Ve(null), e && (_ == null || _.deactivate());
}
function xn() {
  var e = (
    /** @type {Effect} */
    m
  ), t = (
    /** @type {Boundary} */
    e.b
  ), n = (
    /** @type {Batch} */
    _
  ), i = t.is_rendered();
  return t.update_pending_count(1, n), n.increment(i, e), (r = !1) => {
    t.update_pending_count(-1, n), n.decrement(i, e, r);
  };
}
// @__NO_SIDE_EFFECTS__
function $t(e) {
  var t = N | O;
  return m !== null && (m.f |= We), {
    ctx: P,
    deps: null,
    effects: null,
    equals: hn,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      R
    ),
    wv: 0,
    parent: m,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function Oi(e, t, n) {
  let i = (
    /** @type {Effect | null} */
    m
  );
  i === null && ii();
  var r = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), a = xt(
    /** @type {V} */
    R
  ), u = !w, f = /* @__PURE__ */ new Map();
  return Yi(() => {
    var h;
    var o = (
      /** @type {Effect} */
      m
    ), l = cn();
    r = l.promise;
    try {
      Promise.resolve(e()).then(l.resolve, l.reject).finally(wt);
    } catch (c) {
      l.reject(c), wt();
    }
    var d = (
      /** @type {Batch} */
      _
    );
    if (u) {
      if ((o.f & Me) !== 0)
        var v = xn();
      if (
        /** @type {Boundary} */
        i.b.is_rendered()
      )
        (h = f.get(d)) == null || h.reject(se), f.delete(d);
      else {
        for (const c of f.values())
          c.reject(se);
        f.clear();
      }
      f.set(d, l);
    }
    const p = (c, y = void 0) => {
      if (v) {
        var k = y === se;
        v(k);
      }
      if (!(y === se || (o.f & J) !== 0)) {
        if (d.activate(), y)
          a.f |= me, bt(a, y);
        else {
          (a.f & me) !== 0 && (a.f ^= me), bt(a, c);
          for (const [A, j] of f) {
            if (f.delete(A), A === d) break;
            j.reject(se);
          }
        }
        d.deactivate();
      }
    };
    l.promise.then(p, (c) => p(null, c || "unknown"));
  }), $i(() => {
    for (const o of f.values())
      o.reject(se);
  }), new Promise((o) => {
    function l(d) {
      function v() {
        d === r ? o(a) : l(r);
      }
      d.then(v, v);
    }
    l(r);
  });
}
// @__NO_SIDE_EFFECTS__
function Fi(e) {
  const t = /* @__PURE__ */ $t(e);
  return t.equals = gi, t;
}
function Ii(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      ne(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Bt(e) {
  var t, n = m, i = e.parent;
  if (!we && i !== null && (i.f & (J | te)) !== 0)
    return vi(), e.v;
  re(i);
  try {
    e.f &= ~Pe, Ii(e), t = Gn(e);
  } finally {
    re(n);
  }
  return t;
}
function Sn(e) {
  var t = Bt(e);
  if (!e.equals(t) && (e.wv = Ln(), (!(_ != null && _.is_fork) || e.deps === null) && (_ !== null ? _.capture(e, t, !0) : e.v = t, e.deps === null))) {
    S(e, C);
    return;
  }
  we || (M !== null ? (Ht() || _ != null && _.is_fork) && M.set(e, t) : qt(e));
}
function ji(e) {
  var t, n;
  if (e.effects !== null)
    for (const i of e.effects)
      (i.teardown || i.ac) && ((t = i.teardown) == null || t.call(i), (n = i.ac) == null || n.abort(se), i.teardown = Xn, i.ac = null, Xe(i, 0), Ut(i));
}
function Tn(e) {
  if (e.effects !== null)
    for (const t of e.effects)
      t.teardown && Be(t);
}
let Ft = /* @__PURE__ */ new Set();
const Re = /* @__PURE__ */ new Map();
let An = !1;
function xt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: hn,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function pe(e, t) {
  const n = xt(e);
  return Qi(n), n;
}
function ke(e, t, n = !1) {
  w !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!K || (w.f & Ct) !== 0) && st() && (w.f & (N | ee | Qe | Ct)) !== 0 && (Y === null || !Ge.call(Y, e)) && ui();
  let i = n ? Ye(t) : t;
  return bt(e, i, ft);
}
function bt(e, t, n = null) {
  if (!e.equals(t)) {
    Re.set(e, we ? t : e.v);
    var i = $e.ensure();
    if (i.capture(e, t), (e.f & N) !== 0) {
      const r = (
        /** @type {Derived} */
        e
      );
      (e.f & O) !== 0 && Bt(r), M === null && qt(r);
    }
    e.wv = Ln(), Rn(e, O, n), st() && m !== null && (m.f & C) !== 0 && (m.f & (ce | ge)) === 0 && (G === null ? Xi([e]) : G.push(e)), !i.is_fork && Ft.size > 0 && !An && zi();
  }
  return t;
}
function zi() {
  An = !1;
  for (const e of Ft)
    (e.f & C) !== 0 && S(e, ie), at(e) && Be(e);
  Ft.clear();
}
function Je(e) {
  ke(e, e.v + 1);
}
function Rn(e, t, n) {
  var i = e.reactions;
  if (i !== null)
    for (var r = st(), a = i.length, u = 0; u < a; u++) {
      var f = i[u], o = f.f;
      if (!(!r && f === m)) {
        var l = (o & O) === 0;
        if (l && S(f, t), (o & N) !== 0) {
          var d = (
            /** @type {Derived} */
            f
          );
          M == null || M.delete(d), (o & Pe) === 0 && (o & W && (m === null || (m.f & gt) === 0) && (f.f |= Pe), Rn(d, ie, n));
        } else if (l) {
          var v = (
            /** @type {Effect} */
            f
          );
          (o & ee) !== 0 && U !== null && U.add(v), n !== null ? n.push(v) : Vt(v);
        }
      }
    }
}
function Ye(e) {
  if (typeof e != "object" || e === null || Ke in e)
    return e;
  const t = un(e);
  if (t !== Zn && t !== Qn)
    return e;
  var n = /* @__PURE__ */ new Map(), i = Yn(e), r = /* @__PURE__ */ pe(0), a = Ce, u = (f) => {
    if (Ce === a)
      return f();
    var o = w, l = Ce;
    H(null), rn(a);
    var d = f();
    return H(o), rn(l), d;
  };
  return i && n.set("length", /* @__PURE__ */ pe(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, o, l) {
        (!("value" in l) || l.configurable === !1 || l.enumerable === !1 || l.writable === !1) && oi();
        var d = n.get(o);
        return d === void 0 ? u(() => {
          var v = /* @__PURE__ */ pe(l.value);
          return n.set(o, v), v;
        }) : ke(d, l.value, !0), !0;
      },
      deleteProperty(f, o) {
        var l = n.get(o);
        if (l === void 0) {
          if (o in f) {
            const d = u(() => /* @__PURE__ */ pe(R));
            n.set(o, d), Je(r);
          }
        } else
          ke(l, R), Je(r);
        return !0;
      },
      get(f, o, l) {
        var h;
        if (o === Ke)
          return e;
        var d = n.get(o), v = o in f;
        if (d === void 0 && (!v || (h = Ue(f, o)) != null && h.writable) && (d = u(() => {
          var c = Ye(v ? f[o] : R), y = /* @__PURE__ */ pe(c);
          return y;
        }), n.set(o, d)), d !== void 0) {
          var p = ue(d);
          return p === R ? void 0 : p;
        }
        return Reflect.get(f, o, l);
      },
      getOwnPropertyDescriptor(f, o) {
        var l = Reflect.getOwnPropertyDescriptor(f, o);
        if (l && "value" in l) {
          var d = n.get(o);
          d && (l.value = ue(d));
        } else if (l === void 0) {
          var v = n.get(o), p = v == null ? void 0 : v.v;
          if (v !== void 0 && p !== R)
            return {
              enumerable: !0,
              configurable: !0,
              value: p,
              writable: !0
            };
        }
        return l;
      },
      has(f, o) {
        var p;
        if (o === Ke)
          return !0;
        var l = n.get(o), d = l !== void 0 && l.v !== R || Reflect.has(f, o);
        if (l !== void 0 || m !== null && (!d || (p = Ue(f, o)) != null && p.writable)) {
          l === void 0 && (l = u(() => {
            var h = d ? Ye(f[o]) : R, c = /* @__PURE__ */ pe(h);
            return c;
          }), n.set(o, l));
          var v = ue(l);
          if (v === R)
            return !1;
        }
        return d;
      },
      set(f, o, l, d) {
        var Ne;
        var v = n.get(o), p = o in f;
        if (i && o === "length")
          for (var h = l; h < /** @type {Source<number>} */
          v.v; h += 1) {
            var c = n.get(h + "");
            c !== void 0 ? ke(c, R) : h in f && (c = u(() => /* @__PURE__ */ pe(R)), n.set(h + "", c));
          }
        if (v === void 0)
          (!p || (Ne = Ue(f, o)) != null && Ne.writable) && (v = u(() => /* @__PURE__ */ pe(void 0)), ke(v, Ye(l)), n.set(o, v));
        else {
          p = v.v !== R;
          var y = u(() => Ye(l));
          ke(v, y);
        }
        var k = Reflect.getOwnPropertyDescriptor(f, o);
        if (k != null && k.set && k.set.call(d, l), !p) {
          if (i && typeof o == "string") {
            var A = (
              /** @type {Source<number>} */
              n.get("length")
            ), j = Number(o);
            Number.isInteger(j) && j >= A.v && ke(A, j + 1);
          }
          Je(r);
        }
        return !0;
      },
      ownKeys(f) {
        ue(r);
        var o = Reflect.ownKeys(f).filter((v) => {
          var p = n.get(v);
          return p === void 0 || p.v !== R;
        });
        for (var [l, d] of n)
          d.v !== R && !(l in f) && o.push(l);
        return o;
      },
      setPrototypeOf() {
        fi();
      }
    }
  );
}
var tn, Cn, Pn;
function Li() {
  if (tn === void 0) {
    tn = window;
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Cn = Ue(t, "firstChild").get, Pn = Ue(t, "nextSibling").get, Zt(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Zt(n) && (n.__t = void 0);
  }
}
function Wt(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function He(e) {
  return (
    /** @type {TemplateNode | null} */
    Cn.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Yt(e) {
  return (
    /** @type {TemplateNode | null} */
    Pn.call(e)
  );
}
function qi(e, t = !1) {
  {
    var n = /* @__PURE__ */ He(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Yt(n) : n;
  }
}
function Gi(e, t, n) {
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    document.createElementNS(t ?? di, e, void 0)
  );
}
function Mn(e) {
  var t = w, n = m;
  H(null), re(null);
  try {
    return e();
  } finally {
    H(t), re(n);
  }
}
function Nn(e) {
  m === null && (w === null && ai(), si()), we && ri();
}
function Vi(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function de(e, t) {
  var n = m;
  n !== null && (n.f & te) !== 0 && (e |= te);
  var i = {
    ctx: P,
    deps: null,
    nodes: null,
    f: e | O | W,
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
  _ == null || _.register_created_effect(i);
  var r = i;
  if ((e & Ze) !== 0)
    Oe !== null ? Oe.push(i) : $e.ensure().schedule(i);
  else if (t !== null) {
    try {
      Be(i);
    } catch (u) {
      throw ne(i), u;
    }
    r.deps === null && r.teardown === null && r.nodes === null && r.first === r.last && // either `null`, or a singular child
    (r.f & We) === 0 && (r = r.first, (e & ee) !== 0 && (e & mt) !== 0 && r !== null && (r.f |= mt));
  }
  if (r !== null && (r.parent = n, n !== null && Vi(r, n), w !== null && (w.f & N) !== 0 && (e & ge) === 0)) {
    var a = (
      /** @type {Derived} */
      w
    );
    (a.effects ?? (a.effects = [])).push(r);
  }
  return i;
}
function Ht() {
  return w !== null && !K;
}
function $i(e) {
  const t = de(rt, null);
  return S(t, C), t.teardown = e, t;
}
function It(e) {
  Nn();
  var t = (
    /** @type {Effect} */
    m.f
  ), n = !w && (t & ce) !== 0 && (t & Me) === 0;
  if (n) {
    var i = (
      /** @type {ComponentContext} */
      P
    );
    (i.e ?? (i.e = [])).push(e);
  } else
    return Dn(e);
}
function Dn(e) {
  return de(Ze | pn, e);
}
function Bi(e) {
  return Nn(), de(rt | pn, e);
}
function Wi(e) {
  $e.ensure();
  const t = de(ge | We, e);
  return (n = {}) => new Promise((i) => {
    n.outro ? vt(t, () => {
      ne(t), i(void 0);
    }) : (ne(t), i(void 0));
  });
}
function Yi(e) {
  return de(Qe | We, e);
}
function Hi(e, t = 0) {
  return de(rt | t, e);
}
function Ui(e, t = [], n = [], i = []) {
  Ni(i, t, n, (r) => {
    de(rt, () => e(...r.map(ue)));
  });
}
function Ki(e, t = 0) {
  var n = de(ee | t, e);
  return n;
}
function ye(e) {
  return de(ce | We, e);
}
function On(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = we, i = w;
    nn(!0), H(null);
    try {
      t.call(null);
    } finally {
      nn(n), H(i);
    }
  }
}
function Ut(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const r = n.ac;
    r !== null && Mn(() => {
      r.abort(se);
    });
    var i = n.next;
    (n.f & ge) !== 0 ? n.parent = null : ne(n, t), n = i;
  }
}
function Ji(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & ce) === 0 && ne(t), t = n;
  }
}
function ne(e, t = !0) {
  var n = !1;
  (t || (e.f & ti) !== 0) && e.nodes !== null && e.nodes.end !== null && (Fn(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), S(e, Qt), Ut(e, t && !n), Xe(e, 0);
  var i = e.nodes && e.nodes.t;
  if (i !== null)
    for (const a of i)
      a.stop();
  On(e), e.f ^= Qt, e.f |= J;
  var r = e.parent;
  r !== null && r.first !== null && In(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Fn(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ Yt(e);
    e.remove(), e = n;
  }
}
function In(e) {
  var t = e.parent, n = e.prev, i = e.next;
  n !== null && (n.next = i), i !== null && (i.prev = n), t !== null && (t.first === e && (t.first = i), t.last === e && (t.last = n));
}
function vt(e, t, n = !0) {
  var i = [];
  jn(e, i, !0);
  var r = () => {
    n && ne(e), t && t();
  }, a = i.length;
  if (a > 0) {
    var u = () => --a || r();
    for (var f of i)
      f.out(u);
  } else
    r();
}
function jn(e, t, n) {
  if ((e.f & te) === 0) {
    e.f ^= te;
    var i = e.nodes && e.nodes.t;
    if (i !== null)
      for (const f of i)
        (f.is_global || n) && t.push(f);
    for (var r = e.first; r !== null; ) {
      var a = r.next;
      if ((r.f & ge) === 0) {
        var u = (r.f & mt) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (r.f & ce) !== 0 && (e.f & ee) !== 0;
        jn(r, t, u ? n : !1);
      }
      r = a;
    }
  }
}
function Zi(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, i = e.nodes.end; n !== null; ) {
      var r = n === i ? null : /* @__PURE__ */ Yt(n);
      t.append(n), n = r;
    }
}
let _t = !1, we = !1;
function nn(e) {
  we = e;
}
let w = null, K = !1;
function H(e) {
  w = e;
}
let m = null;
function re(e) {
  m = e;
}
let Y = null;
function Qi(e) {
  w !== null && (Y === null ? Y = [e] : Y.push(e));
}
let I = null, z = 0, G = null;
function Xi(e) {
  G = e;
}
let zn = 1, Ee = 0, Ce = Ee;
function rn(e) {
  Ce = e;
}
function Ln() {
  return ++zn;
}
function at(e) {
  var t = e.f;
  if ((t & O) !== 0)
    return !0;
  if (t & N && (e.f &= ~Pe), (t & ie) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), i = n.length, r = 0; r < i; r++) {
      var a = n[r];
      if (at(
        /** @type {Derived} */
        a
      ) && Sn(
        /** @type {Derived} */
        a
      ), a.wv > e.wv)
        return !0;
    }
    (t & W) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    M === null && S(e, C);
  }
  return !1;
}
function qn(e, t, n = !0) {
  var i = e.reactions;
  if (i !== null && !(Y !== null && Ge.call(Y, e)))
    for (var r = 0; r < i.length; r++) {
      var a = i[r];
      (a.f & N) !== 0 ? qn(
        /** @type {Derived} */
        a,
        t,
        !1
      ) : t === a && (n ? S(a, O) : (a.f & C) !== 0 && S(a, ie), Vt(
        /** @type {Effect} */
        a
      ));
    }
}
function Gn(e) {
  var y;
  var t = I, n = z, i = G, r = w, a = Y, u = P, f = K, o = Ce, l = e.f;
  I = /** @type {null | Value[]} */
  null, z = 0, G = null, w = (l & (ce | ge)) === 0 ? e : null, Y = null, Ve(e.ctx), K = !1, Ce = ++Ee, e.ac !== null && (Mn(() => {
    e.ac.abort(se);
  }), e.ac = null);
  try {
    e.f |= gt;
    var d = (
      /** @type {Function} */
      e.fn
    ), v = d();
    e.f |= Me;
    var p = e.deps, h = _ == null ? void 0 : _.is_fork;
    if (I !== null) {
      var c;
      if (h || Xe(e, z), p !== null && z > 0)
        for (p.length = z + I.length, c = 0; c < I.length; c++)
          p[z + c] = I[c];
      else
        e.deps = p = I;
      if (Ht() && (e.f & W) !== 0)
        for (c = z; c < p.length; c++)
          ((y = p[c]).reactions ?? (y.reactions = [])).push(e);
    } else !h && p !== null && z < p.length && (Xe(e, z), p.length = z);
    if (st() && G !== null && !K && p !== null && (e.f & (N | ie | O)) === 0)
      for (c = 0; c < /** @type {Source[]} */
      G.length; c++)
        qn(
          G[c],
          /** @type {Effect} */
          e
        );
    if (r !== null && r !== e) {
      if (Ee++, r.deps !== null)
        for (let k = 0; k < n; k += 1)
          r.deps[k].rv = Ee;
      if (t !== null)
        for (const k of t)
          k.rv = Ee;
      G !== null && (i === null ? i = G : i.push(.../** @type {Source[]} */
      G));
    }
    return (e.f & me) !== 0 && (e.f ^= me), v;
  } catch (k) {
    return mn(k);
  } finally {
    e.f ^= gt, I = t, z = n, G = i, w = r, Y = a, Ve(u), K = f, Ce = o;
  }
}
function er(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var i = Hn.call(n, e);
    if (i !== -1) {
      var r = n.length - 1;
      r === 0 ? n = t.reactions = null : (n[i] = n[r], n.pop());
    }
  }
  if (n === null && (t.f & N) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (I === null || !Ge.call(I, t))) {
    var a = (
      /** @type {Derived} */
      t
    );
    (a.f & W) !== 0 && (a.f ^= W, a.f &= ~Pe), a.v !== R && qt(a), ji(a), Xe(a, 0);
  }
}
function Xe(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var i = t; i < n.length; i++)
      er(e, n[i]);
}
function Be(e) {
  var t = e.f;
  if ((t & J) === 0) {
    S(e, C);
    var n = m, i = _t;
    m = e, _t = !0;
    try {
      (t & (ee | dn)) !== 0 ? Ji(e) : Ut(e), On(e);
      var r = Gn(e);
      e.teardown = typeof r == "function" ? r : null, e.wv = zn;
      var a;
    } finally {
      _t = i, m = n;
    }
  }
}
function ue(e) {
  var t = e.f, n = (t & N) !== 0;
  if (w !== null && !K) {
    var i = m !== null && (m.f & J) !== 0;
    if (!i && (Y === null || !Ge.call(Y, e))) {
      var r = w.deps;
      if ((w.f & gt) !== 0)
        e.rv < Ee && (e.rv = Ee, I === null && r !== null && r[z] === e ? z++ : I === null ? I = [e] : I.push(e));
      else {
        (w.deps ?? (w.deps = [])).push(e);
        var a = e.reactions;
        a === null ? e.reactions = [w] : Ge.call(a, w) || a.push(w);
      }
    }
  }
  if (we && Re.has(e))
    return Re.get(e);
  if (n) {
    var u = (
      /** @type {Derived} */
      e
    );
    if (we) {
      var f = u.v;
      return ((u.f & C) === 0 && u.reactions !== null || $n(u)) && (f = Bt(u)), Re.set(u, f), f;
    }
    var o = (u.f & W) === 0 && !K && w !== null && (_t || (w.f & W) !== 0), l = (u.f & Me) === 0;
    at(u) && (o && (u.f |= W), Sn(u)), o && !l && (Tn(u), Vn(u));
  }
  if (M != null && M.has(e))
    return M.get(e);
  if ((e.f & me) !== 0)
    throw e.v;
  return e.v;
}
function Vn(e) {
  if (e.f |= W, e.deps !== null)
    for (const t of e.deps)
      (t.reactions ?? (t.reactions = [])).push(e), (t.f & N) !== 0 && (t.f & W) === 0 && (Tn(
        /** @type {Derived} */
        t
      ), Vn(
        /** @type {Derived} */
        t
      ));
}
function $n(e) {
  if (e.v === R) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (Re.has(t) || (t.f & N) !== 0 && $n(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function Kt(e) {
  var t = K;
  try {
    return K = !0, e();
  } finally {
    K = t;
  }
}
function tr(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (Ke in e)
      jt(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == "object" && n && Ke in n && jt(n);
      }
  }
}
function jt(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && // We don't want to traverse DOM elements
  !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let i in e)
      try {
        jt(e[i], t);
      } catch {
      }
    const n = un(e);
    if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
      const i = Jn(n);
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
const nr = ["touchstart", "touchmove"];
function ir(e) {
  return nr.includes(e);
}
const lt = Symbol("events"), rr = /* @__PURE__ */ new Set(), sn = /* @__PURE__ */ new Set();
let an = null;
function ln(e) {
  var k, A;
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), i = e.type, r = ((k = e.composedPath) == null ? void 0 : k.call(e)) || [], a = (
    /** @type {null | Element} */
    r[0] || e.target
  );
  an = e;
  var u = 0, f = an === e && e[lt];
  if (f) {
    var o = r.indexOf(f);
    if (o !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e[lt] = t;
      return;
    }
    var l = r.indexOf(t);
    if (l === -1)
      return;
    o <= l && (u = o);
  }
  if (a = /** @type {Element} */
  r[u] || e.target, a !== t) {
    Kn(e, "currentTarget", {
      configurable: !0,
      get() {
        return a || n;
      }
    });
    var d = w, v = m;
    H(null), re(null);
    try {
      for (var p, h = []; a !== null; ) {
        var c = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var y = (A = a[lt]) == null ? void 0 : A[i];
          y != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === a) && y.call(a, e);
        } catch (j) {
          p ? h.push(j) : p = j;
        }
        if (e.cancelBubble || c === t || c === null)
          break;
        a = c;
      }
      if (p) {
        for (let j of h)
          queueMicrotask(() => {
            throw j;
          });
        throw p;
      }
    } finally {
      e[lt] = t, delete e.currentTarget, H(d), re(v);
    }
  }
}
function zt(e, t) {
  var n = (
    /** @type {Effect} */
    m
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
function sr() {
  var e = document.createDocumentFragment(), t = document.createComment(""), n = Wt();
  return e.append(t, n), zt(t, n), e;
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
const ot = /* @__PURE__ */ new Map();
function or(e, { target: t, anchor: n, props: i = {}, events: r, context: a, intro: u = !0, transformError: f }) {
  Li();
  var o = void 0, l = Wi(() => {
    var d = n ?? t.appendChild(Wt());
    Ai(
      /** @type {TemplateNode} */
      d,
      {
        pending: () => {
        }
      },
      (h) => {
        vn({});
        var c = (
          /** @type {ComponentContext} */
          P
        );
        a && (c.c = a), r && (i.$$events = r), o = e(h, i) || {}, _n();
      },
      f
    );
    var v = /* @__PURE__ */ new Set(), p = (h) => {
      for (var c = 0; c < h.length; c++) {
        var y = h[c];
        if (!v.has(y)) {
          v.add(y);
          var k = ir(y);
          for (const Ne of [t, document]) {
            var A = ot.get(Ne);
            A === void 0 && (A = /* @__PURE__ */ new Map(), ot.set(Ne, A));
            var j = A.get(y);
            j === void 0 ? (Ne.addEventListener(y, ln, { passive: k }), A.set(y, 1)) : A.set(y, j + 1);
          }
        }
      }
    };
    return p(Un(rr)), sn.add(p), () => {
      var k;
      for (var h of v)
        for (const A of [t, document]) {
          var c = (
            /** @type {Map<string, number>} */
            ot.get(A)
          ), y = (
            /** @type {number} */
            c.get(h)
          );
          --y == 0 ? (A.removeEventListener(h, ln), c.delete(h), c.size === 0 && ot.delete(A)) : c.set(h, y);
        }
      sn.delete(p), d !== n && ((k = d.parentNode) == null || k.removeChild(d));
    };
  });
  return fr.set(o, l), o;
}
let fr = /* @__PURE__ */ new WeakMap();
function ur(e, t, n = !1, i = !1, r = !1, a = !1) {
  var u = e, f = "";
  if (n)
    var o = (
      /** @type {Element} */
      e
    );
  Ui(() => {
    var l = (
      /** @type {Effect} */
      m
    );
    if (f !== (f = t() ?? "")) {
      if (n) {
        l.nodes = null, o.innerHTML = /** @type {string} */
        f, f !== "" && zt(
          /** @type {TemplateNode} */
          /* @__PURE__ */ He(o),
          /** @type {TemplateNode} */
          o.lastChild
        );
        return;
      }
      if (l.nodes !== null && (Fn(
        l.nodes.start,
        /** @type {TemplateNode} */
        l.nodes.end
      ), l.nodes = null), f !== "") {
        var d = i ? pi : r ? hi : void 0, v = (
          /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
          Gi(i ? "svg" : r ? "math" : "template", d)
        );
        v.innerHTML = /** @type {any} */
        f;
        var p = i || r ? v : (
          /** @type {HTMLTemplateElement} */
          v.content
        );
        if (zt(
          /** @type {TemplateNode} */
          /* @__PURE__ */ He(p),
          /** @type {TemplateNode} */
          p.lastChild
        ), i || r)
          for (; /* @__PURE__ */ He(p); )
            u.before(
              /** @type {TemplateNode} */
              /* @__PURE__ */ He(p)
            );
        else
          u.before(p);
      }
    }
  });
}
function cr(e = !1) {
  const t = (
    /** @type {ComponentContextLegacy} */
    P
  ), n = t.l.u;
  if (!n) return;
  let i = () => tr(t.s);
  if (e) {
    let r = 0, a = (
      /** @type {Record<string, any>} */
      {}
    );
    const u = /* @__PURE__ */ $t(() => {
      let f = !1;
      const o = t.s;
      for (const l in o)
        o[l] !== a[l] && (a[l] = o[l], f = !0);
      return f && r++, r;
    });
    i = () => ue(u);
  }
  n.b.length && Bi(() => {
    on(t, i), At(n.b);
  }), It(() => {
    const r = Kt(() => n.m.map(ei));
    return () => {
      for (const a of r)
        typeof a == "function" && a();
    };
  }), n.a.length && It(() => {
    on(t, i), At(n.a);
  });
}
function on(e, t) {
  if (e.l.s)
    for (const n of e.l.s) ue(n);
  t();
}
function dr(e) {
  P === null && ni(), Et && P.l !== null ? pr(P).m.push(e) : It(() => {
    const t = Kt(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
function pr(e) {
  var t = (
    /** @type {ComponentContextLegacy} */
    e.l
  );
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const hr = "5";
var fn;
typeof window < "u" && ((fn = window.__svelte ?? (window.__svelte = {})).v ?? (fn.v = /* @__PURE__ */ new Set())).add(hr);
wi();
function vr() {
  return `
    <header class="header">
      <div class="logo">
        <div class="logo-icon" aria-hidden="true">
          <img class="logo-icon-dark" src="/icons/inti-logo.svg" alt="" />
          <img class="logo-icon-light" src="/icons/inti-light.svg" alt="" />
        </div>
        <span class="logo-name">Inti</span>
      </div>
      <div class="header-nav">
        <a href="/api-keys.html" class="header-settings-link" title="Manage API keys">
          <span class="icon icon-key" aria-hidden="true"></span>
          API Keys
        </a>
        <a href="/settings.html" class="header-settings-link" title="Summarizer settings">
          <span class="icon icon-settings" aria-hidden="true"></span>
          Settings
        </a>
        <button id="theme-toggle" class="theme-toggle" type="button" title="Switch theme" aria-label="Switch theme">
          <span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span>
          <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span>
          <span class="theme-icon theme-icon-minimal icon icon-minimal" aria-hidden="true"></span>
          <span class="theme-icon theme-icon-minimal-dark icon icon-minimal-dark" aria-hidden="true"></span>
          <span id="theme-toggle-label">Theme</span>
        </button>
      </div>
    </header>
  `;
}
function _r() {
  return `
    <section class="panel panel-workspace" id="ocr-card">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Text Workspace</h2>
        <span class="source-chip">One working text</span>
      </div>
      <div class="drop-zone" id="drop-zone" role="button" tabindex="0" aria-label="Import images for OCR">
        <span class="icon icon-upload-cloud drop-zone-icon" aria-hidden="true"></span>
        <p>Import images for OCR<br />or click to <label for="file-input" class="file-label">browse</label></p>
        <span class="drop-hint" id="drop-hint">PNG, JPG, JPEG, WEBP, TIFF up to 25MB</span>
        <input type="file" id="file-input" accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/png,image/jpeg,image/webp,image/tiff" multiple hidden />
      </div>

      <div id="file-staging" hidden>
        <div class="field-head">
          <span>Staged files</span>
          <span id="staged-count">0 files</span>
        </div>
        <ul id="file-list"></ul>
        <div class="staging-actions">
          <button id="clear-files-btn" class="btn-secondary icon-only" title="Clear staged files">
            <span class="icon icon-trash" aria-hidden="true"></span>
          </button>
          <button id="run-ocr-btn" class="btn-primary">
            <span aria-hidden="true">--</span>
            Extract Text
            <span class="icon icon-bolt" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <div class="field-block ocr-output-block">
        <div class="field-head">
          <span>Working text</span>
          <span id="working-text-count">0 characters</span>
        </div>
        <textarea id="working-text" rows="9" placeholder="Paste or build text here. OCR and summarization operate on this text by default."></textarea>
      </div>

      <div id="workspace-actions" class="workspace-actions">
        <button id="clear-workspace-btn" class="btn-secondary" title="Clear working text">
          <span class="icon icon-x" aria-hidden="true"></span>
          Clear
        </button>
        <div class="select-wrap provider-wrap">
          <select id="provider-select" title="Summarizer provider">
            <option value="">Server default</option>
          </select>
        </div>
        <div class="select-wrap provider-wrap" id="sum-model-wrap" hidden>
          <select id="sum-model-select" title="Summarizer model"></select>
        </div>
        <button id="summarize-btn" class="btn-primary" title="Summarize source text">
          <span class="icon icon-bolt" aria-hidden="true"></span>
          <span>Summarize</span>
        </button>
      </div>
    </section>
  `;
}
function mr() {
  return `
    <section class="panel panel-result">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Latest Text Result</h2>
        <span class="source-chip" id="text-result-kind-chip">No result yet</span>
      </div>

      <div id="text-result" class="field-block">
        <div class="field-head">
          <span id="text-result-title">Transform result</span>
          <span id="text-result-count">0 characters</span>
        </div>
        <div id="text-result-content" class="summary-markdown"></div>
        <div class="summary-actions result-actions">
          <button id="result-promote-default-btn" class="btn-primary">
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span id="result-promote-default-label">Append to Working Text</span>
          </button>
          <button id="result-append-btn" class="btn-secondary">
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span>Append</span>
          </button>
          <button id="result-replace-btn" class="btn-secondary">
            <span class="icon icon-brackets-horizontal" aria-hidden="true"></span>
            <span>Replace</span>
          </button>
          <button id="result-copy-btn" class="btn-secondary">
            <span class="icon icon-copy" aria-hidden="true"></span>
            <span id="result-copy-label">Copy</span>
          </button>
          <div class="split-button" id="result-download-group">
            <button id="result-download-btn" class="btn-secondary split-button-main">
              <span class="icon icon-download" aria-hidden="true"></span>
              Download
            </button>
            <button
              id="result-download-toggle"
              class="btn-secondary split-button-toggle"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="result-download-menu"
              title="Choose download format"
            >
              <span class="icon icon-chevron-down" aria-hidden="true"></span>
            </button>
            <div id="result-download-menu" class="split-menu" role="menu" hidden>
              <button type="button" class="split-menu-item" data-format="txt" role="menuitem">Download .txt</button>
              <button type="button" class="split-menu-item" data-format="md" role="menuitem">Download .md</button>
            </div>
          </div>
          <button id="result-speak-btn" class="btn-secondary">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Generate Speech from Result
          </button>
        </div>
      </div>
    </section>
  `;
}
function gr() {
  return `
    <section class="panel panel-tts">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Speech</h2>
        <span class="source-chip">Audio stays available after edits</span>
      </div>

      <div class="field-block">
        <div class="field-head">
          <span>Speech input</span>
          <span id="speech-input-count">0 characters</span>
        </div>
        <div id="speech-input-preview" class="summary-markdown speech-preview"></div>
      </div>

      <div class="controls">
        <div class="select-wrap">
          <select id="model-select" title="Select TTS model"></select>
        </div>
        <div class="select-wrap">
          <select id="voice-select" title="Select voice"></select>
        </div>
        <div class="select-wrap">
          <select id="gender-filter" title="Filter by gender">
            <option value="All">All voices</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        <div class="action-checkboxes">
          <label class="action-check"><input type="checkbox" id="action-speak" /> Auto-play</label>
          <label class="action-check"><input type="checkbox" id="action-download" /> Download</label>
        </div>
        <button id="generate-working-audio-btn" class="btn-primary generate-btn">
          <span class="icon icon-speaker" aria-hidden="true"></span>
          Generate from Working Text
        </button>
        <button id="generate-result-audio-btn" class="btn-secondary">
          <span class="icon icon-speaker-waves" aria-hidden="true"></span>
          Generate from Result
        </button>

        <div class="playing-bar" id="playing-bar">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>

        <span class="status-text" id="status-text"></span>
      </div>

      <div class="field-block">
        <div class="field-head">
          <span>Latest audio result</span>
          <span id="audio-result-meta">No audio yet</span>
        </div>
        <div id="audio-result-card" class="summary-markdown speech-preview"></div>
        <div class="summary-actions">
          <button id="play-audio-btn" class="btn-secondary">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Play
          </button>
          <button id="download-audio-btn" class="btn-secondary">
            <span class="icon icon-download" aria-hidden="true"></span>
            Download
          </button>
        </div>
      </div>
    </section>
  `;
}
function wr() {
  return `
    <section class="panel panel-activity">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Activity</h2>
      </div>
      <div class="feed" id="feed">
        <p class="feed-empty" id="feed-empty">No activity yet.</p>
      </div>
      <button class="btn-secondary view-all-btn" type="button">View all</button>
    </section>
  `;
}
function br() {
  return `
    <div id="img-preview-modal" hidden>
      <div id="img-preview-backdrop"></div>
      <div id="img-preview-box">
        <img id="img-preview-img" src="" alt="Preview" />
        <button id="img-preview-close" title="Close">×</button>
      </div>
    </div>
  `;
}
function yr() {
  return `
    <div class="app">
      ${vr()}
      <main class="main-grid">
        ${_r()}
        ${mr()}
        ${gr()}
        ${wr()}
      </main>
    </div>
    ${br()}
  `;
}
function kr(e, t) {
  vn(t, !1);
  const n = yr();
  dr(async () => {
    if (window.__intiLegacyWorkspaceInitialized) return;
    window.__intiLegacyWorkspaceInitialized = !0;
    const [
      { initFeed: a },
      { updateTextMetrics: u },
      { initOCR: f },
      { initProviders: o },
      { initSummarizer: l },
      { initTTS: d, synthesizeText: v },
      { initVoices: p }
    ] = await Promise.all([
      import("./feed-DrSayDY3.js").then((h) => h.c),
      import("./metrics-CLwihjC0.js"),
      import("./ocr-b5BdsroK.js"),
      import("./providers-DQ5R_waU.js"),
      import("./summarizer-D5o3yH_V.js"),
      import("./tts-DPqsxh6-.js"),
      import("./voices-CpAZtJg4.js")
    ]);
    a(), o(), p(), f(), l({ synthesizeText: v }), d(), u();
  }), cr();
  var i = sr(), r = qi(i);
  ur(r, () => n), ar(e, i), _n();
}
lr(kr, {
  target: document.getElementById("app")
});
export {
  Xn as n,
  mi as s,
  Kt as u
};
