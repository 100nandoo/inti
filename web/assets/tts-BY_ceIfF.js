import { G as B, H as L, I as S, J as $, K as v, L as R, M as C, N as P, O as w, P as j, p as D, j as H, Q as b, R as g } from "./dom-CESGoSUg.js";
import { a as F, s as l, b as h, t as p, u as y, e as m } from "./feed-DrSayDY3.js";
import { d as z, b as I } from "./download-DpmJkw8r.js";
import { updateTextMetrics as O } from "./metrics-CLwihjC0.js";
import { q as U, g as d, s as K, d as A, t as N } from "./workspace-B8Q7ZcFj.js";
function T() {
  const { processing: e, workingText: t, latestTextResult: s, lastAudioBlob: a, lastAudioSourceLabel: c, lastAudioSourceText: n } = d(), r = t.trim().length > 0, o = s.plainText.trim().length > 0, i = !!a;
  if (w.innerHTML = t.trim() ? J(t) : "<p>Generate speech from the current working text or the latest text result.</p>", w.dataset.previewTextLength = String(t.length), R.disabled = e, j.disabled = e, v.disabled = e, D.disabled = e, H.disabled = e, B.disabled = e || !r, L.disabled = e || !o, C.disabled = e, P.disabled = e, S.disabled = e || !i, $.disabled = e || !i, i) {
    const u = n.trim() ? n.trim().split(/\s+/).length : 0;
    b.textContent = `${c || "Audio result"} · ${u} words · ${(a.size / 1024).toFixed(1)} KB`, g.innerHTML = `<p>${m(c || "Generated from working text")}</p><p>${m(p(n, 180))}</p>`;
  } else
    b.textContent = "No audio yet", g.innerHTML = "<p>Generate speech from the current working text or the latest text result to keep an audio snapshot here.</p>";
  O();
}
function J(e) {
  return e.trim() ? e.split(/\n{2,}/).slice(0, 3).map((t) => `<p>${m(t).replace(/\n/g, "<br>")}</p>`).join("") : "";
}
async function q(e) {
  const t = await new Promise((r) => {
    const o = new FileReader();
    o.onload = () => {
      const i = o.result.split(",")[1] || o.result;
      r(i);
    }, o.readAsDataURL(e);
  }), s = Uint8Array.from(atob(t), (r) => r.charCodeAt(0)), a = new AudioContext(), c = await a.decodeAudioData(s.buffer), n = a.createBufferSource();
  return n.buffer = c, n.connect(a.destination), n.start(), new Promise((r) => {
    n.onended = () => {
      a.close(), r();
    };
  });
}
async function x(e, { sourceLabel: t = "Working Text" } = {}) {
  const s = v.value, a = R.value;
  A(!0), l("Synthesizing…");
  const c = performance.now(), n = e.trim().split(/\s+/).length, r = F("info", `"${p(e, 60)}"`, `${a} · ${s} · synthesizing…`);
  try {
    const o = await fetch(window.apiURL("/api/speak"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: e, voice: s, model: a })
    });
    if (!o.ok) {
      const f = await o.json().catch(() => ({ error: o.statusText }));
      throw new Error(f.error || o.statusText);
    }
    const { opus: i } = await o.json(), u = Uint8Array.from(atob(i), (f) => f.charCodeAt(0)), E = new Blob([u], { type: "audio/opus" });
    N(E, e, t);
    const W = ((performance.now() - c) / 1e3).toFixed(1);
    l("Audio result ready.", "success"), y(
      r,
      "ok",
      `"${p(e, 60)}"`,
      `${n} words · ${W}s · ${a} · ${s} · ${(u.length / 1024).toFixed(1)} KB`
    ), C.checked && await G(), P.checked && M(e);
  } catch (o) {
    l(o.message, "error"), y(r, "fail", `"${p(e, 60)}"`, o.message);
  } finally {
    A(!1);
  }
}
async function G() {
  const { lastAudioBlob: e } = d();
  if (e) {
    l("Playing…"), h(!0);
    try {
      await q(e), l("");
    } catch (t) {
      l(t.message, "error");
    } finally {
      h(!1);
    }
  }
}
function k() {
  return !!d().lastAudioBlob;
}
function _() {
  U();
}
function M(e) {
  const { lastAudioBlob: t } = d();
  return t ? (z(t, I(e, "opus")), F("ok", "Downloaded", "Opus file saved to your downloads folder"), !0) : !1;
}
function ee() {
  K(T), B.addEventListener("click", async () => {
    const { processing: e, workingText: t } = d(), s = t.trim();
    !s || e || await x(s, { sourceLabel: "Working Text" });
  }), L.addEventListener("click", async () => {
    const { processing: e, latestTextResult: t } = d(), s = t.plainText.trim();
    !s || e || await x(s, { sourceLabel: t.title || "Latest Text Result" });
  }), S.addEventListener("click", async () => {
    k() && await G();
  }), $.addEventListener("click", () => {
    const { lastAudioSourceText: e } = d();
    k() && M(e || "audio");
  }), T();
}
export {
  _ as clearGeneratedAudio,
  M as downloadGeneratedAudio,
  k as hasGeneratedAudio,
  ee as initTTS,
  G as playAudio,
  x as synthesizeText
};
