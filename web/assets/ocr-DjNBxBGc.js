import { d as o, f as m, o as p, c as S, r as k, i as D, a as M, b as L, s as b, e as $, g as U, h as I } from "./dom-CESGoSUg.js";
import { s as g, e as R, a as j, u as x } from "./feed-DrSayDY3.js";
import { g as l, s as P, a as h, b as v, c as q, d as C, e as H, r as W } from "./workspace-B8Q7ZcFj.js";
function O(t) {
  if (!Number.isFinite(t) || t <= 0) return "0 B";
  const n = ["B", "KB", "MB", "GB"];
  let a = t, s = 0;
  for (; a >= 1024 && s < n.length - 1; )
    a /= 1024, s += 1;
  const e = s === 0 || a >= 10 ? 0 : 1;
  return `${a.toFixed(e)} ${n[s]}`;
}
const z = /* @__PURE__ */ new Set(["image/png", "image/jpeg", "image/webp", "image/tiff"]);
function G(t) {
  $.src = t, I.hidden = !1, document.addEventListener("keydown", A);
}
function w() {
  I.hidden = !0, $.src = "", document.removeEventListener("keydown", A);
}
function A(t) {
  t.key === "Escape" && w();
}
function K() {
  const t = document.activeElement;
  return t && t.closest('input, textarea, select, [contenteditable="true"]') ? !1 : l().isPointerOverOcrCard || (t ? p.contains(t) : !1);
}
function B(t) {
  return z.has(t);
}
function N(t) {
  return !!(t != null && t.type) && B(t.type);
}
function F(t) {
  const n = [];
  let a = 0;
  return t.forEach((s) => {
    var e;
    N(s) ? n.push(s) : ((e = s == null ? void 0 : s.type) != null && e.startsWith("image/") || /\.svgz?$/i.test((s == null ? void 0 : s.name) || "")) && (a += 1);
  }), a > 0 && g(`Rejected ${a} unsupported image file${a === 1 ? "" : "s"}. SVG uploads are not allowed.`, "error"), n;
}
function V(t) {
  if (!t) return [];
  const n = Array.from(t.items || []).filter((a) => a.kind === "file" && B(a.type)).map((a, s) => {
    const e = a.getAsFile();
    if (!e) return null;
    if (!e.name) {
      const i = e.type.split("/")[1] || "png";
      return new File([e], `clipboard-image-${Date.now()}-${s}.${i}`, { type: e.type });
    }
    return e;
  }).filter(Boolean);
  return n.length > 0 ? n : F(Array.from(t.files || []));
}
function E(t) {
  v([...l().stagedFiles, ...t]);
}
function T() {
  const { stagedFiles: t } = l();
  L.innerHTML = "", b && (b.textContent = `${t.length} file${t.length === 1 ? "" : "s"}`), t.forEach((n, a) => {
    const s = document.createElement("li");
    s.className = "file-item", s.draggable = !0, s.dataset.index = a;
    const e = URL.createObjectURL(n);
    s.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">::</span>
      <img class="file-thumb" src="${e}" alt="" />
      <span class="file-info">
        <span class="file-name" title="${R(n.name)}">${R(n.name)}</span>
        <span class="file-meta">${O(n.size)}</span>
      </span>
      <span class="file-ok" title="Ready">
        <span class="icon icon-check" aria-hidden="true"></span>
      </span>
      <button class="file-remove" data-index="${a}" title="Remove">
        <span class="icon icon-trash" aria-hidden="true"></span>
      </button>`;
    const i = s.querySelector(".file-thumb");
    i.addEventListener("load", () => {
      const r = s.querySelector(".file-meta");
      r.textContent = `${O(n.size)} · ${i.naturalWidth} × ${i.naturalHeight}`, URL.revokeObjectURL(e);
    }), i.addEventListener("click", () => {
      const r = URL.createObjectURL(n);
      G(r), $.addEventListener("load", () => URL.revokeObjectURL(r), { once: !0 });
    }), s.addEventListener("dragstart", (r) => {
      q(a), r.dataTransfer.effectAllowed = "move", requestAnimationFrame(() => s.classList.add("dragging"));
    }), s.addEventListener("dragend", () => {
      s.classList.remove("dragging"), L.querySelectorAll(".file-item").forEach((r) => r.classList.remove("drag-over"));
    }), s.addEventListener("dragover", (r) => {
      r.preventDefault(), r.dataTransfer.dropEffect = "move", L.querySelectorAll(".file-item").forEach((d) => d.classList.remove("drag-over")), s.classList.add("drag-over");
    }), s.addEventListener("drop", (r) => {
      r.preventDefault(), s.classList.remove("drag-over");
      const { dragSrcIndex: d, stagedFiles: c } = l();
      if (d === null || d === a) return;
      const u = [...c], [f] = u.splice(d, 1);
      u.splice(a, 0, f), v(u);
    }), s.querySelector(".file-remove").addEventListener("click", () => {
      const r = l().stagedFiles.filter((d, c) => c !== a);
      v(r);
    }), L.appendChild(s);
  }), U.hidden = t.length === 0;
}
function y() {
  const { processing: t, stagedFiles: n } = l();
  k.disabled = t || n.length === 0, S.disabled = t || n.length === 0;
}
async function Z(t) {
  const n = t.length === 1 ? t[0].name : `${t.length} images`;
  o.classList.add("ocr-loading"), C(!0), k.disabled = !0;
  const a = j("info", `OCR: ${n}`, "extracting text…");
  try {
    const s = new FormData();
    t.forEach((f) => s.append("files", f));
    const e = await fetch(window.apiURL("/api/ocr"), { method: "POST", body: s });
    if (!e.ok) {
      const f = await e.json().catch(() => ({ error: e.statusText }));
      throw new Error(f.error || e.statusText);
    }
    const { text: i } = await e.json(), r = i || "";
    H({
      kind: "ocr",
      title: "OCR Result",
      format: "plain",
      rawText: r,
      plainText: r
    });
    const d = !!l().workingText.trim();
    !d && r.trim() ? (W(r), g("OCR result replaced empty working text.", "success")) : g("OCR result ready for review.", "success"), v([]);
    const c = r ? r.trim().split(/\s+/).filter(Boolean).length : 0, u = !d && r.trim() ? `${c} word${c === 1 ? "" : "s"} extracted · promoted to working text` : `${c} word${c === 1 ? "" : "s"} extracted`;
    x(a, "ok", `OCR: ${n}`, u);
  } catch (s) {
    x(a, "fail", `OCR: ${n}`, s.message), g(s.message, "error");
  } finally {
    o.classList.remove("ocr-loading"), C(!1), y();
  }
}
function X() {
  var a, s;
  T(), y();
  let t = l().stagedFiles, n = l().processing;
  P((e) => {
    e.stagedFiles !== t && T(), (e.processing !== n || e.stagedFiles !== t) && y(), t = e.stagedFiles, n = e.processing;
  }), o.addEventListener("click", (e) => {
    e.target instanceof HTMLLabelElement || m.click();
  }), o.addEventListener("keydown", (e) => {
    (e.key === "Enter" || e.key === " ") && (e.preventDefault(), m.click());
  }), m.addEventListener("change", () => {
    const e = F(Array.from(m.files || []));
    e.length > 0 && E(e), m.value = "";
  }), o.addEventListener("dragenter", (e) => {
    e.preventDefault(), o.classList.add("drag-active");
  }), o.addEventListener("dragover", (e) => {
    e.preventDefault(), o.classList.add("drag-active");
  }), o.addEventListener("dragleave", (e) => {
    o.contains(e.relatedTarget) || o.classList.remove("drag-active");
  }), o.addEventListener("drop", (e) => {
    var r;
    e.preventDefault(), o.classList.remove("drag-active");
    const i = F(Array.from(((r = e.dataTransfer) == null ? void 0 : r.files) || []));
    i.length > 0 && E(i);
  }), p.addEventListener("mouseenter", () => h(!0)), p.addEventListener("mouseleave", () => h(!1)), p.addEventListener("focusin", () => h(!0)), p.addEventListener("focusout", () => h(!1)), document.addEventListener("paste", (e) => {
    if (!K()) return;
    const i = V(e.clipboardData);
    i.length !== 0 && (e.preventDefault(), E(i), g(`Staged ${i.length} pasted image${i.length === 1 ? "" : "s"}.`, "success"));
  }), S.addEventListener("click", () => {
    v([]), g("Cleared staged OCR files.", "success");
  }), k.addEventListener("click", async () => {
    const e = l().stagedFiles;
    e.length !== 0 && await Z(e);
  }), (a = D) == null || a.addEventListener("click", w), (s = M) == null || s.addEventListener("click", w);
}
export {
  X as initOCR
};
