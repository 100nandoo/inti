import { G as T, H as k, I as x, J as S, K as L, L as v, M as B, N as $, O as b, P as C, p as M, j as F, Q as H, R as W } from "./dom-CESGoSUg.js";
import { e as f, t as p, a as P, s as u, b as h, u as w } from "./feed-DrSayDY3.js";
import { updateTextMetrics as G } from "./metrics-CLwihjC0.js";
import { q as j, g as l, s as E, d as m, t as U } from "./workspace-CHqLEj39.js";
import { d as z, b as I } from "./download-DpmJkw8r.js";
function O(e) {
  const { processing: t, workingText: o, latestTextResult: d, lastAudioBlob: i, lastAudioSourceLabel: a, lastAudioSourceText: n } = e, s = o.trim().length > 0, r = d.plainText.trim().length > 0, c = !!i;
  return {
    hasWorkingText: s,
    hasResult: r,
    hasAudio: c,
    speechPreviewHtml: o.trim() ? K(o) : "<p>Generate speech from the current working text or the latest text result.</p>",
    speechPreviewLength: String(o.length),
    controlsDisabled: t,
    audioMeta: c ? `${a || "Audio result"} · ${N(n)} words · ${(i.size / 1024).toFixed(1)} KB` : "No audio yet",
    audioCardHtml: c ? `<p>${f(a || "Generated from working text")}</p><p>${f(p(n, 180))}</p>` : "<p>Generate speech from the current working text or the latest text result to keep an audio snapshot here.</p>"
  };
}
function K(e) {
  return e.trim() ? e.split(/\n{2,}/).slice(0, 3).map((t) => `<p>${f(t).replace(/\n/g, "<br>")}</p>`).join("") : "";
}
function N(e) {
  return e.trim() ? e.trim().split(/\s+/).length : 0;
}
async function q({
  apiURL: e,
  text: t,
  voice: o,
  model: d,
  fetchImpl: i = fetch
}) {
  const a = await i(e("/api/speak"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: t, voice: o, model: d })
  });
  if (!a.ok) {
    const r = await a.json().catch(() => ({ error: a.statusText }));
    throw new Error(r.error || a.statusText);
  }
  const { opus: n } = await a.json(), s = Uint8Array.from(atob(n), (r) => r.charCodeAt(0));
  return {
    blob: new Blob([s], { type: "audio/opus" }),
    bytes: s
  };
}
async function J(e, t = () => new AudioContext()) {
  const o = await new Promise((s) => {
    const r = new FileReader();
    r.onload = () => {
      const c = r.result.split(",")[1] || r.result;
      s(c);
    }, r.readAsDataURL(e);
  }), d = Uint8Array.from(atob(o), (s) => s.charCodeAt(0)), i = t(), a = await i.decodeAudioData(d.buffer), n = i.createBufferSource();
  return n.buffer = a, n.connect(i.destination), n.start(), new Promise((s) => {
    n.onended = () => {
      i.close(), s();
    };
  });
}
function Q(e, t) {
  return e ? (z(e, I(t, "opus")), !0) : !1;
}
function g() {
  const { processing: e } = l(), t = O(l());
  b.innerHTML = t.speechPreviewHtml, b.dataset.previewTextLength = t.speechPreviewLength, v.disabled = t.controlsDisabled, C.disabled = t.controlsDisabled, L.disabled = t.controlsDisabled, M.disabled = t.controlsDisabled, F.disabled = t.controlsDisabled, T.disabled = e || !t.hasWorkingText, k.disabled = e || !t.hasResult, B.disabled = t.controlsDisabled, $.disabled = t.controlsDisabled, x.disabled = e || !t.hasAudio, S.disabled = e || !t.hasAudio, H.textContent = t.audioMeta, W.innerHTML = t.audioCardHtml, G();
}
async function y(e, { sourceLabel: t = "Working Text" } = {}) {
  const o = L.value, d = v.value;
  m(!0), u("Synthesizing…");
  const i = performance.now(), a = e.trim().split(/\s+/).length, n = P("info", `"${p(e, 60)}"`, `${d} · ${o} · synthesizing…`);
  try {
    const { blob: s, bytes: r } = await q({
      apiURL: window.apiURL,
      text: e,
      voice: o,
      model: d
    });
    U(s, e, t);
    const c = ((performance.now() - i) / 1e3).toFixed(1);
    u("Audio result ready.", "success"), w(
      n,
      "ok",
      `"${p(e, 60)}"`,
      `${a} words · ${c}s · ${d} · ${o} · ${(r.length / 1024).toFixed(1)} KB`
    ), B.checked && await R(), $.checked && D(e);
  } catch (s) {
    u(s.message, "error"), w(n, "fail", `"${p(e, 60)}"`, s.message);
  } finally {
    m(!1);
  }
}
async function R() {
  const { lastAudioBlob: e } = l();
  if (e) {
    u("Playing…"), h(!0);
    try {
      await J(e), u("");
    } catch (t) {
      u(t.message, "error");
    } finally {
      h(!1);
    }
  }
}
function A() {
  return !!l().lastAudioBlob;
}
function ee() {
  j();
}
function D(e) {
  const { lastAudioBlob: t } = l();
  return t ? (Q(t, e), P("ok", "Downloaded", "Opus file saved to your downloads folder"), !0) : !1;
}
function te() {
  E(g), T.addEventListener("click", async () => {
    const { processing: e, workingText: t } = l(), o = t.trim();
    !o || e || await y(o, { sourceLabel: "Working Text" });
  }), k.addEventListener("click", async () => {
    const { processing: e, latestTextResult: t } = l(), o = t.plainText.trim();
    !o || e || await y(o, { sourceLabel: t.title || "Latest Text Result" });
  }), x.addEventListener("click", async () => {
    A() && await R();
  }), S.addEventListener("click", () => {
    const { lastAudioSourceText: e } = l();
    A() && D(e || "audio");
  }), g();
}
export {
  ee as clearGeneratedAudio,
  D as downloadGeneratedAudio,
  A as hasGeneratedAudio,
  te as initTTS,
  R as playAudio,
  y as synthesizeText
};
