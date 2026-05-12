import { l as z, w as m, m as O, n as q, q as I, t as j, u as H, v as D, x as y, y as c, z as w, A as f, B as G, C as $, D as Y, E as Q, F as X } from "./dom-CESGoSUg.js";
import { e as N, s as p, a as Z, t as x, u as E } from "./feed-DrSayDY3.js";
import { d as ee, b as te } from "./download-DpmJkw8r.js";
import { updateTextMetrics as R } from "./metrics-CLwihjC0.js";
import { k as C, s as ne, l as S, g as o, m as _, p as T, n as se, d as F, j as ae, h as re, o as oe, e as ie } from "./workspace-CmAqI4eE.js";
function g(t) {
  return N(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
}
function U(t) {
  const s = t.split(`
`);
  let n = "", e = !1;
  for (const a of s) {
    const r = a.trimEnd(), i = r.match(/^(#{1,3})\s+(.+)/);
    if (i) {
      e && (n += "</ul>", e = !1);
      const l = i[1].length;
      n += `<h${l}>${g(i[2])}</h${l}>`;
      continue;
    }
    const d = r.match(/^[-*]\s+(.+)/);
    if (d) {
      e || (n += "<ul>", e = !0), n += `<li>${g(d[1])}</li>`;
      continue;
    }
    e && (n += "</ul>", e = !1), r !== "" && (n += `<p>${g(r)}</p>`);
  }
  return e && (n += "</ul>"), n;
}
let B = async () => {
}, h = "md";
const le = /* @__PURE__ */ new Set(["txt", "md"]);
function M(t) {
  if (!t) return 0;
  let s = 0;
  const n = t.match(/(\d+(?:\.\d+)?)h/), e = t.match(/(\d+(?:\.\d+)?)m(?!s)/), a = t.match(/(\d+(?:\.\d+)?)s/);
  return n && (s += parseFloat(n[1]) * 36e5), e && (s += parseFloat(e[1]) * 6e4), a && (s += parseFloat(a[1]) * 1e3), s;
}
function de(t) {
  return t.trim() ? t.split(/\n{2,}/).map((s) => `<p>${N(s).replace(/\n/g, "<br>")}</p>`).join("") : "";
}
function L() {
  const { processing: t, workingText: s, latestTextResult: n } = o(), e = s.trim().length > 0, a = n.rawText.trim().length > 0, r = _(n.kind);
  m.value !== s && (m.value = s), m.disabled = t, z.disabled = t || !e, O.disabled = t || !e, n.kind === "summary" ? $.innerHTML = U(n.rawText) : $.innerHTML = de(n.rawText), Y.textContent = n.kind ? `${n.kind === "summary" ? "Summary" : "OCR"} result` : "No result yet", Q.textContent = n.title || "Transform result";
  const i = r === "replace" ? "Replace Working Text" : "Append to Working Text";
  X.textContent = i, q.disabled = t || !a, I.disabled = t || !a, j.disabled = t || !a, H.disabled = t || !a, y.disabled = t || !a, c.disabled = t || !a, G.disabled = t || !n.plainText.trim(), y.disabled && u(), R();
}
function A(t, s, n) {
  const e = new Blob([t], { type: `${n};charset=utf-8` });
  ee(e, te(t, s));
}
function W(t) {
  const { latestTextResult: s } = o();
  if (!s.rawText.trim()) return;
  if (t === "md") {
    const e = s.format === "markdown" ? s.rawText : s.plainText || s.rawText;
    if (!e.trim()) return;
    A(e, "md", "text/markdown");
    return;
  }
  const n = s.plainText || s.rawText;
  n.trim() && A(n, "txt", "text/plain");
}
function P(t) {
  h = le.has(t) ? t : "md";
}
function ce() {
  w.hidden = !1, f.classList.add("is-open"), c.setAttribute("aria-expanded", "true");
}
function u() {
  w.hidden = !0, f.classList.remove("is-open"), c.setAttribute("aria-expanded", "false");
}
function ue() {
  if (w.hidden) {
    ce();
    return;
  }
  u();
}
function k(t) {
  const s = o().latestTextResult.kind || "result";
  p(`${s === "summary" ? "Summary" : "OCR result"} ${t === "replace" ? "replaced" : "appended to"} working text.`, "success");
}
async function me(t) {
  F(!0), p("Summarizing…");
  const s = performance.now(), n = t.trim().split(/\s+/).length, e = Z("info", `"${x(t, 60)}"`, "summarizing…");
  try {
    const a = ae(), r = await fetch(window.apiURL("/api/summarize"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: t,
        instruction: "",
        provider: a,
        model: re()
      })
    });
    if (!r.ok) {
      const V = await r.json().catch(() => ({ error: r.statusText }));
      throw new Error(V.error || r.statusText);
    }
    const { model: i, provider: d, rateLimits: l, summary: b } = await r.json();
    l && d === "groq" && oe({
      ...l,
      capturedAt: Date.now(),
      resetRequestsAt: Date.now() + M(l.resetRequests),
      resetTokensAt: Date.now() + M(l.resetTokens)
    });
    const v = document.createElement("div");
    v.innerHTML = U(b || ""), ie({
      kind: "summary",
      title: "Summary Result",
      format: "markdown",
      rawText: b || "",
      plainText: v.innerText.trim()
    });
    const J = ((performance.now() - s) / 1e3).toFixed(1), K = i ? ` · ${i}` : d ? ` · ${d}` : "";
    p("Summary result ready for review.", "success"), E(
      e,
      "ok",
      `"${x(t, 60)}"`,
      `${n} words → summary · ${J}s${K}`
    );
  } catch (a) {
    p(a.message, "error"), E(e, "fail", `"${x(t, 60)}"`, a.message);
  } finally {
    F(!1);
  }
}
function ge({ synthesizeText: t }) {
  var s, n;
  B = t, P((s = window.IntiTheme) == null ? void 0 : s.summaryDownloadFormat), C(window.IntiTheme || {}), ne(L), document.addEventListener("inti:theme-config", (e) => {
    var a;
    C(e.detail || {}), P((a = e.detail) == null ? void 0 : a.summaryDownloadFormat);
  }), (n = z) == null || n.addEventListener("click", () => {
    S(""), p("Working text cleared.", "success"), R();
  }), m.addEventListener("input", () => {
    S(m.value);
  }), O.addEventListener("click", async () => {
    const { processing: e, workingText: a } = o(), r = a.trim();
    !r || e || await me(r);
  }), q.addEventListener("click", () => {
    const e = _(o().latestTextResult.kind);
    T(e) && k(e);
  }), I.addEventListener("click", () => {
    T("append") && k("append");
  }), j.addEventListener("click", () => {
    T("replace") && k("replace");
  }), H.addEventListener("click", async () => {
    const e = o().latestTextResult.plainText || o().latestTextResult.rawText;
    if (e) {
      try {
        await navigator.clipboard.writeText(e);
      } catch {
      }
      D.textContent = "Copied!", setTimeout(() => {
        D.textContent = "Copy";
      }, 1500);
    }
  }), y.addEventListener("click", () => {
    o().processing || W(h);
  }), c.addEventListener("click", (e) => {
    e.stopPropagation(), !c.disabled && ue();
  }), w.addEventListener("click", (e) => {
    const a = e.target.closest(".split-menu-item");
    if (!a) return;
    const r = a.dataset.format;
    r && (h = r, u(), W(r));
  }), f.addEventListener("keydown", (e) => {
    e.key === "Escape" && (u(), c.focus());
  }), G.addEventListener("click", async () => {
    const { processing: e, latestTextResult: a } = o(), r = a.plainText.trim();
    !r || e || await B(r, { sourceLabel: a.title || "Latest Text Result" });
  }), document.addEventListener("click", (e) => {
    f.contains(e.target) || u();
  }), L();
}
function ke() {
  se(), u(), R(), L();
}
export {
  ge as initSummarizer,
  ke as resetLatestTextResult,
  me as summarizeText
};
