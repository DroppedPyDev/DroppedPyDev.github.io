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

/* theme toggle */
const root = document.documentElement;
try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
$("#theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
});

}).catch(() => { document.getElementById("view").innerHTML = "<h1>Content not found</h1><p>Serve the site over http (GitHub Pages, or <code>python3 -m http.server</code> locally). Browsers block loading content.json from a plain file.</p>"; });
