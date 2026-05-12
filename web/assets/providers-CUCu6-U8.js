import { p as o, j as c, k as w } from "./dom-CESGoSUg.js";
import { s as m } from "./feed-DrSayDY3.js";
import { f as l, h as s, i as d, g as u, j as S } from "./workspace-Csdb2nMO.js";
const y = [
  { value: "gemini", label: "Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "mock", label: "Mock" }
];
async function v(e, a = "") {
  await window.IntiSummarizerModels.populateSelect(
    c,
    w,
    e,
    a
  );
}
async function g(e = "") {
  const { summarizerConfig: a } = u(), i = a.keys || {}, r = S() || a.provider || e || "";
  o.innerHTML = '<option value="">Server default</option>', y.forEach(({ value: t, label: f }) => {
    if (t === "mock" || i[t]) {
      const n = document.createElement("option");
      n.value = t, n.textContent = f, o.appendChild(n);
    }
  }), r && [...o.options].some((t) => t.value === r) && (o.value = r), l(o.value, a.model || ""), await v(o.value, a.model || "");
}
async function p(e, a) {
  const { summarizerConfig: i } = u(), r = await fetch(window.apiURL("/api/summarizer-config"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: e,
      model: a,
      keys: i.keys
    })
  });
  if (!r.ok) {
    const t = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(t.error || r.statusText);
  }
  d(await r.json());
}
async function h() {
  let e = "";
  try {
    const a = await fetch(window.apiURL("/api/summarizer-config"));
    if (a.ok) {
      const i = await a.json();
      d(i), e = u().summarizerConfig.provider;
    }
  } catch {
  }
  await g(e);
}
async function M() {
  window.preserveKeyLinks(), await h(), o.addEventListener("change", async () => {
    const e = o.value;
    await v(e), l(o.value, o.value === "openrouter" ? "" : c.value);
    try {
      await p(e, s());
    } catch (a) {
      m(a.message, "error");
    }
  }), c.addEventListener("change", async () => {
    l(o.value, s());
    try {
      await p(o.value, s());
    } catch (e) {
      m(e.message, "error");
    }
  });
}
export {
  M as initProviders
};
