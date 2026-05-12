import { S as t, w as e, T as n, B as r, U as a, O as s } from "./dom-CuOumjtQ.js";
function i() {
  t && (t.textContent = `${e.value.length} characters`), n && (n.textContent = `${r.innerText.trim().length} characters`), a && (a.textContent = `${s.dataset.previewTextLength || e.value.length} characters`);
}
export {
  i as updateTextMetrics
};
