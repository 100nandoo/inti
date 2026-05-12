import { P as l, K as n, L as m } from "./dom-CESGoSUg.js";
const s = [
  { name: "Zephyr", gender: "Female", characteristic: "Bright" },
  { name: "Puck", gender: "Male", characteristic: "Upbeat" },
  { name: "Charon", gender: "Male", characteristic: "Informative" },
  { name: "Kore", gender: "Female", characteristic: "Firm" },
  { name: "Fenrir", gender: "Male", characteristic: "Excitable" },
  { name: "Leda", gender: "Female", characteristic: "Youthful" },
  { name: "Orus", gender: "Male", characteristic: "Firm" },
  { name: "Aoede", gender: "Female", characteristic: "Breezy" },
  { name: "Callirrhoe", gender: "Female", characteristic: "Easy-going" },
  { name: "Autonoe", gender: "Female", characteristic: "Bright" },
  { name: "Enceladus", gender: "Male", characteristic: "Breathy" },
  { name: "Iapetus", gender: "Male", characteristic: "Clear" },
  { name: "Umbriel", gender: "Male", characteristic: "Easy-going" },
  { name: "Algieba", gender: "Male", characteristic: "Smooth" },
  { name: "Despina", gender: "Female", characteristic: "Smooth" },
  { name: "Erinome", gender: "Female", characteristic: "Clear" },
  { name: "Algenib", gender: "Male", characteristic: "Gravelly" },
  { name: "Rasalgethi", gender: "Male", characteristic: "Informative" },
  { name: "Laomedeia", gender: "Female", characteristic: "Upbeat" },
  { name: "Achernar", gender: "Female", characteristic: "Soft" },
  { name: "Alnilam", gender: "Male", characteristic: "Firm" },
  { name: "Schedar", gender: "Male", characteristic: "Even" },
  { name: "Gacrux", gender: "Female", characteristic: "Mature" },
  { name: "Pulcherrima", gender: "Male", characteristic: "Forward" },
  { name: "Achird", gender: "Male", characteristic: "Friendly" },
  { name: "Zubenelgenubi", gender: "Male", characteristic: "Casual" },
  { name: "Vindemiatrix", gender: "Female", characteristic: "Gentle" },
  { name: "Sadachbia", gender: "Male", characteristic: "Lively" },
  { name: "Sadaltager", gender: "Male", characteristic: "Knowledgeable" },
  { name: "Sulafat", gender: "Female", characteristic: "Warm" }
], o = "Kore";
function d(r = "All", i = !1) {
  const t = i ? n.value : o, a = r === "All" ? s : s.filter((e) => e.gender === r);
  n.innerHTML = "", a.forEach((e) => {
    const c = document.createElement("option");
    c.value = e.name, c.textContent = `${e.name} — ${e.characteristic}`, e.name === t && (c.selected = !0), n.appendChild(c);
  }), !a.find((e) => e.name === t) && a.length > 0 && (n.selectedIndex = 0);
}
async function h() {
  try {
    const r = await fetch(window.apiURL("/api/models"));
    if (!r.ok) return;
    const { models: i, default: t } = await r.json();
    m.innerHTML = "", i.forEach((a) => {
      const e = document.createElement("option");
      e.value = a, e.textContent = a, a === t && (e.selected = !0), m.appendChild(e);
    });
  } catch {
  }
}
function u() {
  d(), h(), l.addEventListener("change", () => {
    d(l.value, !0);
  });
}
export {
  u as initVoices
};
