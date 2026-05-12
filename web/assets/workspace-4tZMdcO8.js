const a = /* @__PURE__ */ new Set(), r = {
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
function t() {
  a.forEach((e) => e(r));
}
function s(e) {
  return e === "replace" ? "replace" : "append";
}
function m(e, o) {
  const i = o || "";
  return e.trim() ? i.trim() ? `${e.replace(/\s+$/, "")}

${i.replace(/^\s+/, "")}` : e : i;
}
function d() {
  return r;
}
function f(e, { immediate: o = !0 } = {}) {
  return a.add(e), o && e(r), () => a.delete(e);
}
function p(e) {
  r.processing = e, t();
}
function g(e, o, i) {
  r.lastAudioBlob = e, r.lastAudioSourceText = o || "", r.lastAudioSourceLabel = i || "", t();
}
function x() {
  r.lastAudioBlob = null, r.lastAudioSourceText = "", r.lastAudioSourceLabel = "", t();
}
function S(e) {
  r.stagedFiles = e, t();
}
function T(e) {
  r.dragSrcIndex = e, t();
}
function v(e) {
  r.isPointerOverOcrCard = e, t();
}
function z(e) {
  r.workingText = e, t();
}
function l(e) {
  r.workingText = e || "", t();
}
function c(e) {
  r.workingText = m(r.workingText, e || ""), t();
}
function P({ kind: e = "", title: o = "", format: i = "plain", rawText: n = "", plainText: u = "" }) {
  r.latestTextResult = {
    kind: e,
    title: o,
    format: i,
    rawText: n,
    plainText: u || n
  }, t();
}
function k() {
  r.latestTextResult = {
    kind: "",
    title: "",
    format: "plain",
    rawText: "",
    plainText: ""
  }, t();
}
function y(e) {
  const o = r.latestTextResult.rawText || "";
  return o.trim() ? e === "replace" ? (l(o), !0) : (c(o), !0) : !1;
}
function C(e) {
  r.appearanceConfig = {
    summaryDownloadFormat: e.summaryDownloadFormat === "txt" ? "txt" : "md",
    ocrPromotionBehavior: s(e.ocrPromotionBehavior),
    summaryPromotionBehavior: s(e.summaryPromotionBehavior)
  }, t();
}
function B(e) {
  return e === "summary" ? r.appearanceConfig.summaryPromotionBehavior : e === "ocr" ? r.appearanceConfig.ocrPromotionBehavior : "append";
}
function L(e) {
  var o, i, n;
  r.summarizerConfig = {
    provider: e.provider || "",
    model: e.model || "",
    keys: {
      gemini: ((o = e.keys) == null ? void 0 : o.gemini) || "",
      groq: ((i = e.keys) == null ? void 0 : i.groq) || "",
      openrouter: ((n = e.keys) == null ? void 0 : n.openrouter) || ""
    },
    groqLimits: e.groqLimits || null
  }, r.selectedSummarizerProvider || (r.selectedSummarizerProvider = r.summarizerConfig.provider), r.selectedSummarizerModel || (r.selectedSummarizerModel = r.summarizerConfig.model), t();
}
function h(e) {
  r.summarizerConfig = {
    ...r.summarizerConfig,
    groqLimits: e
  }, t();
}
function w(e, o) {
  r.selectedSummarizerProvider = e || "", r.selectedSummarizerModel = o || "", t();
}
function A() {
  return r.selectedSummarizerProvider;
}
function b() {
  return r.selectedSummarizerProvider === "openrouter" ? "" : r.selectedSummarizerModel;
}
export {
  v as a,
  S as b,
  T as c,
  p as d,
  P as e,
  w as f,
  d as g,
  b as h,
  L as i,
  A as j,
  C as k,
  z as l,
  k as m,
  h as n,
  B as o,
  y as p,
  x as q,
  l as r,
  f as s,
  g as t
};
