import { l as P, w as p, m as W, n as z, q, t as O, u as I, v as S, x as L, y as c, z as x, A as w, B as j, C as U, D as _, E as V, F as J } from "./dom.js";
import { e as H, s as f, a as K, t as k, u as D } from "./feed.js";
import { updateTextMetrics as v } from "./metrics.js";
import { k as $, s as Y, l as C, g as l, m as G, p as g, n as Q, c as E, j as X, h as Z, o as ee, d as te } from "./workspace.js";
import { d as ne, b as se } from "./download.js";
function h(e) {
  return H(e).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
}
function N(e) {
  const a = e.split(`
`);
  let n = "", t = !1;
  for (const s of a) {
    const r = s.trimEnd(), o = r.match(/^(#{1,3})\s+(.+)/);
    if (o) {
      t && (n += "</ul>", t = !1);
      const d = o[1].length;
      n += `<h${d}>${h(o[2])}</h${d}>`;
      continue;
    }
    const i = r.match(/^[-*]\s+(.+)/);
    if (i) {
      t || (n += "<ul>", t = !0), n += `<li>${h(i[1])}</li>`;
      continue;
    }
    t && (n += "</ul>", t = !1), r !== "" && (n += `<p>${h(r)}</p>`);
  }
  return t && (n += "</ul>"), n;
}
function ae(e) {
  return e.trim() ? e.split(/\n{2,}/).map((a) => `<p>${H(a).replace(/\n/g, "<br>")}</p>`).join("") : "";
}
function re(e, a) {
  const n = e.latestTextResult;
  return {
    hasResult: n.rawText.trim().length > 0,
    hasSpeakableText: n.plainText.trim().length > 0,
    kindChip: n.kind ? `${n.kind === "summary" ? "Summary" : "OCR"} result` : "No result yet",
    title: n.title || "Transform result",
    contentHtml: n.kind === "summary" ? N(n.rawText) : ae(n.rawText),
    defaultPromotionLabel: a === "replace" ? "Replace Working Text" : "Append to Working Text"
  };
}
function M(e, a) {
  if (!e.rawText.trim()) return !1;
  const n = a === "md" && e.format === "markdown" ? e.rawText : e.plainText || e.rawText;
  if (!n.trim()) return !1;
  const t = a === "md" ? "text/markdown" : "text/plain", s = new Blob([n], { type: `${t};charset=utf-8` });
  return ne(s, se(n, a)), !0;
}
async function ie(e, a = navigator.clipboard) {
  const n = e.plainText || e.rawText;
  if (!n) return !1;
  try {
    await a.writeText(n);
  } catch {
  }
  return !0;
}
function F(e) {
  if (!e) return 0;
  let a = 0;
  const n = e.match(/(\d+(?:\.\d+)?)h/), t = e.match(/(\d+(?:\.\d+)?)m(?!s)/), s = e.match(/(\d+(?:\.\d+)?)s/);
  return n && (a += parseFloat(n[1]) * 36e5), t && (a += parseFloat(t[1]) * 6e4), s && (a += parseFloat(s[1]) * 1e3), a;
}
async function oe({
  apiURL: e,
  fetchImpl: a = fetch,
  text: n,
  provider: t,
  model: s,
  now: r = Date.now
}) {
  const o = await a(e("/api/summarize"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: n,
      instruction: "",
      provider: t,
      model: s
    })
  });
  if (!o.ok) {
    const T = await o.json().catch(() => ({ error: o.statusText }));
    throw new Error(T.error || o.statusText);
  }
  const i = await o.json(), d = document.createElement("div");
  d.innerHTML = N(i.summary || "");
  const m = r();
  return {
    summaryResult: {
      kind: "summary",
      title: "Summary Result",
      format: "markdown",
      rawText: i.summary || "",
      plainText: d.innerText.trim()
    },
    model: i.model || "",
    provider: i.provider || "",
    rateLimits: i.rateLimits && i.provider === "groq" ? {
      ...i.rateLimits,
      capturedAt: m,
      resetRequestsAt: m + F(i.rateLimits.resetRequests),
      resetTokensAt: m + F(i.rateLimits.resetTokens)
    } : null
  };
}
let A = async () => {
}, R = "md";
const le = /* @__PURE__ */ new Set(["txt", "md"]);
function b() {
  const { processing: e, workingText: a, latestTextResult: n } = l(), t = a.trim().length > 0, s = re(
    l(),
    G(n.kind)
  );
  p.value !== a && (p.value = a), p.disabled = e, P.disabled = e || !t, W.disabled = e || !t, U.innerHTML = s.contentHtml, _.textContent = s.kindChip, V.textContent = s.title, J.textContent = s.defaultPromotionLabel, z.disabled = e || !s.hasResult, q.disabled = e || !s.hasResult, O.disabled = e || !s.hasResult, I.disabled = e || !s.hasResult, L.disabled = e || !s.hasResult, c.disabled = e || !s.hasResult, j.disabled = e || !s.hasSpeakableText, L.disabled && u(), v();
}
function B(e) {
  R = le.has(e) ? e : "md";
}
function de() {
  x.hidden = !1, w.classList.add("is-open"), c.setAttribute("aria-expanded", "true");
}
function u() {
  x.hidden = !0, w.classList.remove("is-open"), c.setAttribute("aria-expanded", "false");
}
function ce() {
  if (x.hidden) {
    de();
    return;
  }
  u();
}
function y(e) {
  const a = l().latestTextResult.kind || "result";
  f(`${a === "summary" ? "Summary" : "OCR result"} ${e === "replace" ? "replaced" : "appended to"} working text.`, "success");
}
async function ue(e) {
  E(!0), f("Summarizing…");
  const a = performance.now(), n = e.trim().split(/\s+/).length, t = K("info", `"${k(e, 60)}"`, "summarizing…");
  try {
    const s = X(), { model: r, provider: o, rateLimits: i, summaryResult: d } = await oe({
      apiURL: window.apiURL,
      text: e,
      provider: s,
      model: Z()
    });
    i && ee(i), te(d);
    const m = ((performance.now() - a) / 1e3).toFixed(1), T = r ? ` · ${r}` : o ? ` · ${o}` : "";
    f("Summary result ready for review.", "success"), D(
      t,
      "ok",
      `"${k(e, 60)}"`,
      `${n} words → summary · ${m}s${T}`
    );
  } catch (s) {
    f(s.message, "error"), D(t, "fail", `"${k(e, 60)}"`, s.message);
  } finally {
    E(!1);
  }
}
function Te({ synthesizeText: e }) {
  var a, n;
  A = e, B((a = window.IntiTheme) == null ? void 0 : a.summaryDownloadFormat), $(window.IntiTheme || {}), Y(b), document.addEventListener("inti:theme-config", (t) => {
    var s;
    $(t.detail || {}), B((s = t.detail) == null ? void 0 : s.summaryDownloadFormat);
  }), (n = P) == null || n.addEventListener("click", () => {
    C(""), f("Working text cleared.", "success"), v();
  }), p.addEventListener("input", () => {
    C(p.value);
  }), W.addEventListener("click", async () => {
    const { processing: t, workingText: s } = l(), r = s.trim();
    !r || t || await ue(r);
  }), z.addEventListener("click", () => {
    const t = G(l().latestTextResult.kind);
    g(t) && y(t);
  }), q.addEventListener("click", () => {
    g("append") && y("append");
  }), O.addEventListener("click", () => {
    g("replace") && y("replace");
  }), I.addEventListener("click", async () => {
    await ie(l().latestTextResult) && (S.textContent = "Copied!", setTimeout(() => {
      S.textContent = "Copy";
    }, 1500));
  }), L.addEventListener("click", () => {
    l().processing || M(l().latestTextResult, R);
  }), c.addEventListener("click", (t) => {
    t.stopPropagation(), !c.disabled && ce();
  }), x.addEventListener("click", (t) => {
    const s = t.target.closest(".split-menu-item");
    if (!s) return;
    const r = s.dataset.format;
    r && (R = r, u(), M(l().latestTextResult, r));
  }), w.addEventListener("keydown", (t) => {
    t.key === "Escape" && (u(), c.focus());
  }), j.addEventListener("click", async () => {
    const { processing: t, latestTextResult: s } = l(), r = s.plainText.trim();
    !r || t || await A(r, { sourceLabel: s.title || "Latest Text Result" });
  }), document.addEventListener("click", (t) => {
    w.contains(t.target) || u();
  }), b();
}
function ke() {
  Q(), u(), v(), b();
}
export {
  Te as initSummarizer,
  ke as resetLatestTextResult,
  ue as summarizeText
};
