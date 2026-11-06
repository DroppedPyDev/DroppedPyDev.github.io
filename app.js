fetch("content.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json(); }).then(SITE => {
const $ = s => document.querySelector(s);
const view = $("#view"), nav = $("#nav"), ind = nav.querySelector(".ind");
const pages = [["home","Home"],["projects","Projects"],["writing","Writing"],["resume","Resume"],["links","Links"]];
const fmt = d => new Date(String(d).slice(0,10) + "T00:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const md = t => { t = t || ""; if (/<p[\s>]/.test(t)) return t;
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|#[^\s)]*|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>');
  return t.split(/\n{2,}/).map(b => { b = b.trim(); if (!b) return "";
    if (/^#{1,3} /.test(b)) return `<h2>${inl(b.replace(/^#+ /, ""))}</h2>`;
    if (/^[-*] /.test(b)) return "<ul>" + b.split("\n").map(l => `<li>${inl(l.replace(/^[-*] /, ""))}</li>`).join("") + "</ul>";
    return `<p>${inl(b)}</p>`; }).join(""); };
SITE.posts.forEach(p => p.slug = p.slug || slug(p.title));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* progressive blur layers */
const layers = [[1,100],[2,80],[4,60],[8,40],[16,22]];
document.querySelectorAll(".pblur").forEach(el => {
  const d = el.classList.contains("top") ? "to bottom" : "to top";
  el.innerHTML = layers.map(([b, e]) => `<i style="--b:${b}px;--e:${e}%;--d:${d}"></i>`).join("");
});

/* design settings: defaults < content.json "design" < visitor choices (Style panel) */
const root = document.documentElement;
const DEF = { accent: "#2f5bff", colors: ["#7aa2ff", "#ff9ad5", "#7fe8d0"], blur: 22, roundness: 24, font: "editorial", layout: "sidebar", align: "left", theme: "auto" };
const FONTS = {
  editorial: { d: '"Bricolage Grotesque"', b: '"Source Serif 4"', fb: "Georgia,serif" },
  modern: { d: '"Plus Jakarta Sans"', b: '"Plus Jakarta Sans"', fb: "system-ui,sans-serif", url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap" },
  mono: { d: '"Space Grotesk"', b: '"JetBrains Mono"', fb: "ui-monospace,monospace", url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap" }
};
let saved = {}; try { saved = JSON.parse(localStorage.getItem("style") || "{}"); } catch (e) {}
const mq = matchMedia("(prefers-color-scheme: dark)");
const panel = $("#panel"), styleBtn = $("#theme");
const SW = ["#2f5bff", "#7c3aed", "#e11d74", "#f97316", "#0d9488", "#16a34a"];
$("#sw").innerHTML = SW.map(c => `<button type="button" data-c="${c}" style="background:${c}" aria-label="Accent ${c}"></button>`).join("");

function applyDesign() {
  const c = { ...DEF, ...(SITE.design || {}), ...saved }, st = root.style;
  st.setProperty("--accent-base", c.accent);
  (c.colors || []).slice(0, 3).forEach((v, i) => st.setProperty("--b" + (i + 1), v));
  st.setProperty("--blur", c.blur + "px"); st.setProperty("--r", c.roundness + "px");
  root.dataset.layout = c.layout; root.dataset.align = c.align;
  root.dataset.mode = c.theme === "auto" ? (mq.matches ? "dark" : "light") : c.theme;
  const f = FONTS[c.font] || FONTS.editorial;
  if (f.url && !document.querySelector(`link[data-f="${c.font}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = f.url; l.dataset.f = c.font; document.head.appendChild(l); }
  st.setProperty("--display", f.d + ",system-ui,sans-serif"); st.setProperty("--body", f.b + "," + f.fb);
  panel.querySelectorAll(".seg button").forEach(b => b.classList.toggle("on", b.dataset.v === c.theme));
  panel.querySelectorAll(".sw button").forEach(b => b.classList.toggle("on", b.dataset.c.toLowerCase() === String(c.accent).toLowerCase()));
  $("#blur").value = c.blur; $("#rad").value = c.roundness;
  document.fonts?.ready.then(() => place(true));
}
function save(k, v) { saved[k] = v; try { localStorage.setItem("style", JSON.stringify(saved)); } catch (e) {} applyDesign(); }
function togglePanel(open) { open = open ?? !panel.classList.contains("open"); panel.classList.toggle("open", open); panel.inert = !open; styleBtn.setAttribute("aria-expanded", open); }
panel.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.v) save("theme", b.dataset.v); else if (b.dataset.c) save("accent", b.dataset.c);
  else if (b.id === "reset") { saved = {}; try { localStorage.removeItem("style"); } catch (x) {} applyDesign(); }
});
$("#blur").addEventListener("input", e => save("blur", +e.target.value));
$("#rad").addEventListener("input", e => save("roundness", +e.target.value));
styleBtn.addEventListener("click", () => togglePanel());
document.addEventListener("click", e => { if (!panel.contains(e.target) && !styleBtn.contains(e.target)) togglePanel(false); });
addEventListener("keydown", e => { if (e.key === "Escape") togglePanel(false); });
mq.addEventListener?.("change", applyDesign);
panel.inert = true; applyDesign();

$("#brand").innerHTML = esc(SITE.name) + "<small>" + esc(SITE.tagline) + "</small>";
nav.insertAdjacentHTML("beforeend", pages.map(([id, l]) => `<a href="#${id}" data-p="${id}">${l}</a>`).join(""));

const projectItem = p => `<a class="item" href="${esc(p.url)}" target="_blank" rel="noopener"><h3>${esc(p.title)} <span class="meta">${esc(p.year)}</span></h3><p>${esc(p.desc)}</p><div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div></a>`;
const postItem = p => `<a class="item" href="#post-${esc(p.slug)}"><h3>${esc(p.title)}</h3><p><span class="meta">${fmt(p.date)}</span><br>${esc(p.summary)}</p></a>`;
const posts = () => [...SITE.posts].sort((a, b) => b.date.localeCompare(a.date));

const routes = {
  home: () => `${SITE.status ? `<p class="pill"><i></i>${esc(SITE.status)}</p>` : ""}<h1>${esc(SITE.name)}</h1><p class="lede">${esc(SITE.intro)}</p><p>${esc(SITE.about)}</p>
    <div class="actions"><a class="btn" href="mailto:${esc(SITE.email)}">Get in touch</a><a class="ghost" href="#projects">See projects</a></div>
    <h2>Recent projects</h2>${SITE.projects.slice(0, 2).map(projectItem).join("")}<h2>Latest writing</h2>${posts().slice(0, 2).map(postItem).join("")}`,
  projects: () => `<h1>Projects</h1><p class="muted">Things I’ve built. Each one links to its code.</p>${SITE.projects.map(projectItem).join("")}`,
  writing: () => `<h1>Writing</h1>${posts().map(postItem).join("") || "<p>No posts yet.</p>"}`,
  resume: () => { const r = SITE.resume; return `<h1>Resume</h1>${r.pdf ? `<p><a class="btn" href="${esc(r.pdf)}">Download PDF</a></p>` : ""}
    <h2>Experience</h2>${r.experience.map(j => `<div class="job"><div class="row"><h3>${esc(j.role)}, ${esc(j.org)}</h3><span class="meta">${esc(j.when)}</span></div><ul>${j.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
    <h2>Education</h2>${r.education.map(e => `<div class="job"><div class="row"><h3>${esc(e.what)}</h3><span class="meta">${esc(e.when)}</span></div></div>`).join("")}
    <h2>Skills</h2><div class="tags">${r.skills.map(s => `<span>${esc(s)}</span>`).join("")}</div>`; },
  links: () => `<h1>Links</h1><p class="muted">Where to find me online.</p>${SITE.links.map(l => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span>${esc(l.note)}</span></a>`).join("")}`
};

/* sliding nav indicator */
function place(animate) {
  const a = nav.querySelector('a[aria-current="page"]'); if (!a) return;
  ind.style.width = a.offsetWidth + "px"; ind.style.height = a.offsetHeight + "px";
  ind.style.transform = `translate(${a.offsetLeft}px,${a.offsetTop}px)`;
  if (animate) ind.classList.add("on"); else { ind.classList.remove("on"); void ind.offsetWidth; ind.classList.add("on"); }
  a.scrollIntoView?.({ inline: "center", block: "nearest" });
}

/* staggered scroll-in */
const io = new IntersectionObserver(es => {
  es.filter(e => e.isIntersecting).forEach((e, i) => { e.target.style.transitionDelay = reduce ? "0ms" : i * 70 + "ms"; e.target.classList.add("in"); io.unobserve(e.target); });
}, { threshold: .08, rootMargin: "0px 0px -4% 0px" });

let current = null;
function draw() {
  const hash = location.hash.slice(1) || "home"; let page = hash, html;
  if (hash.startsWith("post-")) {
    const p = SITE.posts.find(x => "post-" + x.slug === hash); page = "writing";
    html = p ? `<a class="back" href="#writing">← All writing</a><article><h1>${esc(p.title)}</h1><p class="meta">${fmt(p.date)}</p>${md(p.body)}</article>` : `<h1>Post not found</h1><p><a href="#writing">Back to all writing</a></p>`;
    document.title = (p ? p.title : "Not found") + " · " + SITE.name;
  } else {
    if (!routes[hash]) page = "home";
    html = routes[page]();
    document.title = page === "home" ? SITE.name : pages.find(x => x[0] === page)[1] + " · " + SITE.name;
  }
  view.innerHTML = html;
  view.querySelectorAll(":scope > *, :scope > article > *").forEach(el => { el.dataset.r = ""; io.observe(el); });
  nav.querySelectorAll("a").forEach(a => a.dataset.p === page ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  place(current !== null); current = page;
  window.scrollTo(0, 0); view.classList.remove("out"); view.focus({ preventScroll: true });
}
function render() { if (current === null || reduce) return draw(); view.classList.add("out"); setTimeout(draw, 170); }
addEventListener("hashchange", render);
addEventListener("resize", () => place(true));
document.fonts?.ready.then(() => place(true));
render();

/* glass highlight follows the pointer */
view.addEventListener("pointermove", e => {
  const t = e.target.closest(".item,.link"); if (!t) return;
  const r = t.getBoundingClientRect(); t.style.setProperty("--mx", e.clientX - r.left + "px"); t.style.setProperty("--my", e.clientY - r.top + "px");
});


}).catch(() => { document.getElementById("view").innerHTML = "<h1>Content not found</h1><p>Serve the site over http (GitHub Pages, or <code>python3 -m http.server</code> locally). Browsers block loading content.json from a plain file.</p>"; });
