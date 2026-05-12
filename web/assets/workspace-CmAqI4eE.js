import { n as m, u as S, s as b } from "./main-BsTaDOia.js";
function x(e, r, t) {
  if (e == null)
    return r(void 0), m;
  const o = S(
    () => e.subscribe(
      r,
      // @ts-expect-error
      t
    )
  );
  return o.unsubscribe ? () => o.unsubscribe() : o;
}
const a = [];
function T(e, r = m) {
  let t = null;
  const o = /* @__PURE__ */ new Set();
  function s(u) {
    if (b(e, u) && (e = u, t)) {
      const f = !a.length;
      for (const i of o)
        i[1](), a.push(i, e);
      if (f) {
        for (let i = 0; i < a.length; i += 2)
          a[i][0](a[i + 1]);
        a.length = 0;
      }
    }
  }
  function l(u) {
    s(u(
      /** @type {T} */
      e
    ));
  }
  function g(u, f = m) {
    const i = [u, f];
    return o.add(i), o.size === 1 && (t = r(s, l) || m), u(
      /** @type {T} */
      e
    ), () => {
      o.delete(i), o.size === 0 && t && (t(), t = null);
    };
  }
  return { set: s, update: l, subscribe: g };
}
function z(e) {
  let r;
  return x(e, (t) => r = t)(), r;
}
function P() {
  return {
    processing: !1,
    lastAudioBlob: null,
    lastAudioSourceText: "",
    lastAudioSourceLabel: "",
    stagedFiles: [],
    dragSrcIndex: null,
    isPointerOverOcrCard: !1,
    workingText: "",
    latestTextResult: {
      kind: "",
      title: "",
      format: "plain",
      rawText: "",
      plainText: ""
    },
    appearanceConfig: {
      summaryDownloadFormat: "md",
      ocrPromotionBehavior: "append",
      summaryPromotionBehavior: "append"
    },
    summarizerConfig: {
      provider: "",
      model: "",
      keys: { gemini: "", groq: "", openrouter: "" },
      groqLimits: null
    },
    selectedSummarizerProvider: "",
    selectedSummarizerModel: ""
  };
}
function p(e) {
  return e === "replace" ? "replace" : "append";
}
function k(e, r) {
  const t = r || "";
  return e.trim() ? t.trim() ? `${e.replace(/\s+$/, "")}

${t.replace(/^\s+/, "")}` : e : t;
}
const d = T(P());
function c() {
  return z(d);
}
function n(e) {
  d.update((r) => e(r));
}
function B(e) {
  n((r) => ({ ...r, processing: e }));
}
function w(e, r, t) {
  n((o) => ({
    ...o,
    lastAudioBlob: e,
    lastAudioSourceText: r || "",
    lastAudioSourceLabel: t || ""
  }));
}
function C() {
  n((e) => ({
    ...e,
    lastAudioBlob: null,
    lastAudioSourceText: "",
    lastAudioSourceLabel: ""
  }));
}
function L(e) {
  n((r) => ({ ...r, stagedFiles: e }));
}
function q(e) {
  n((r) => ({ ...r, dragSrcIndex: e }));
}
function A(e) {
  n((r) => ({ ...r, isPointerOverOcrCard: e }));
}
function R(e) {
  n((r) => ({ ...r, workingText: e }));
}
function v(e) {
  n((r) => ({ ...r, workingText: e || "" }));
}
function h(e) {
  n((r) => ({
    ...r,
    workingText: k(r.workingText, e || "")
  }));
}
function W({ kind: e = "", title: r = "", format: t = "plain", rawText: o = "", plainText: s = "" }) {
  n((l) => ({
    ...l,
    latestTextResult: {
      kind: e,
      title: r,
      format: t,
      rawText: o,
      plainText: s || o
    }
  }));
}
function F() {
  n((e) => ({
    ...e,
    latestTextResult: {
      kind: "",
      title: "",
      format: "plain",
      rawText: "",
      plainText: ""
    }
  }));
}
function M(e) {
  const t = c().latestTextResult.rawText || "";
  return t.trim() ? e === "replace" ? (v(t), !0) : (h(t), !0) : !1;
}
function O(e) {
  n((r) => ({
    ...r,
    appearanceConfig: {
      summaryDownloadFormat: e.summaryDownloadFormat === "txt" ? "txt" : "md",
      ocrPromotionBehavior: p(e.ocrPromotionBehavior),
      summaryPromotionBehavior: p(e.summaryPromotionBehavior)
    }
  }));
}
function D(e) {
  const r = c();
  return e === "summary" ? r.appearanceConfig.summaryPromotionBehavior : e === "ocr" ? r.appearanceConfig.ocrPromotionBehavior : "append";
}
function _(e) {
  n((r) => {
    var t, o, s;
    return {
      ...r,
      summarizerConfig: {
        provider: e.provider || "",
        model: e.model || "",
        keys: {
          gemini: ((t = e.keys) == null ? void 0 : t.gemini) || "",
          groq: ((o = e.keys) == null ? void 0 : o.groq) || "",
          openrouter: ((s = e.keys) == null ? void 0 : s.openrouter) || ""
        },
        groqLimits: e.groqLimits || null
      },
      selectedSummarizerProvider: r.selectedSummarizerProvider || e.provider || "",
      selectedSummarizerModel: r.selectedSummarizerModel || e.model || ""
    };
  });
}
function I(e) {
  n((r) => ({
    ...r,
    summarizerConfig: {
      ...r.summarizerConfig,
      groqLimits: e
    }
  }));
}
function $(e, r) {
  n((t) => ({
    ...t,
    selectedSummarizerProvider: e || "",
    selectedSummarizerModel: r || ""
  }));
}
function j() {
  return c().selectedSummarizerProvider;
}
function G() {
  const e = c();
  return e.selectedSummarizerProvider === "openrouter" ? "" : e.selectedSummarizerModel;
}
function E() {
  return c();
}
function H(e, { immediate: r = !0 } = {}) {
  let t = !0;
  return d.subscribe((o) => {
    if (!r && t) {
      t = !1;
      return;
    }
    t = !1, e(o);
  });
}
export {
  A as a,
  L as b,
  q as c,
  B as d,
  W as e,
  $ as f,
  E as g,
  G as h,
  _ as i,
  j,
  O as k,
  R as l,
  D as m,
  F as n,
  I as o,
  M as p,
  C as q,
  v as r,
  H as s,
  w as t
};
