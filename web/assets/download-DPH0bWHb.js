import { f as a } from "./feed-DYy8QE9U.js";
function l(e) {
  return e.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`~>#]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80).trim();
}
function o(e, t = 3) {
  return e.split(/\s+/).filter(Boolean).slice(0, t).join(" ");
}
function c(e) {
  if (!e) return "";
  const t = e.split(`
`).map((n) => n.trim()).filter(Boolean);
  if (!t.length) return "";
  const r = t.find((n) => /^#{1,6}\s+/.test(n));
  if (r)
    return o(l(r.replace(/^#{1,6}\s+/, "")));
  for (const n of t) {
    const i = o(l(n));
    if (i) return i;
  }
  return "";
}
function s(e) {
  return e.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/[_\s-]+/g, "_").replace(/^_+|_+$/g, "");
}
function f(e, t) {
  const r = a(/* @__PURE__ */ new Date()), n = s(c(e));
  return n ? `Inti_${r}_${n}.${t}` : `Inti_${r}.${t}`;
}
function m(e, t) {
  const r = URL.createObjectURL(e), n = document.createElement("a");
  n.href = r, n.download = t, n.click(), URL.revokeObjectURL(r);
}
export {
  f as b,
  m as d
};
