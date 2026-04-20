// projects.js
const MAX_KEY_PROJECTS = 3;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function sanitizeUrl(url) {
  if (!url) return "#";
  const trimmed = String(url).trim();
  if (/^(https?:\/\/|mailto:|tel:|#|\.\/|\.\.\/|\/|images\/)/i.test(trimmed)) return trimmed;
  return "#";
}

function parseProjectDate(p) {
  const raw = p.date || p.Date || p.createdAt || "";
  if (!raw) return 0;

  // Supports dd.mm.yyyy and ISO-like formats
  const dotFormat = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  const match = String(raw).match(dotFormat);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    return new Date(year, month, day).getTime();
  }

  const asDate = new Date(raw).getTime();
  return Number.isNaN(asDate) ? 0 : asDate;
}

function projectToCardHTML(p) {
  const tags = (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

  const links = (p.links || []).map((l) => {
    const safeUrl = sanitizeUrl(l.url);
    const icon = l.icon || "fa-link";
    const isExternal = /^https?:\/\//i.test(safeUrl);
    const rel = isExternal ? 'rel="noopener"' : "";
    const target = isExternal ? 'target="_blank"' : "";

    const primary = ["view", "live", "demo"].includes((l.label || "").toLowerCase());
    const cls = primary ? "btn-primary" : "btn-ghost";

    return `
      <a class="${cls}" href="${escapeAttr(safeUrl)}" ${target} ${rel}>
        <i class="fa-solid ${escapeAttr(icon)}"></i> ${escapeHtml(l.label || "Link")}
      </a>
    `;
  }).join("");

  return `
    <article class="project-card">
      <div class="project-thumb">
        <img src="${escapeAttr(p.image || "images/latestprojects.jpg")}" alt="${escapeAttr(p.title || "Project")}" loading="lazy" decoding="async">
      </div>
      <div class="project-body">
        <h3 class="project-title">${escapeHtml(p.title || "")}</h3>
        <p class="project-desc">${escapeHtml(p.desc || "")}</p>
        <div class="project-tags">${tags}</div>
        <div class="project-actions">${links}</div>
      </div>
    </article>
  `;
}

async function fetchProjects() {
  const res = await fetch("projects.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load projects.json");

  const projects = await res.json();
  return [...projects].sort((a, b) => parseProjectDate(b) - parseProjectDate(a));
}

async function loadKeyProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  try {
    const sorted = await fetchProjects();
    const featured = sorted.filter((p) => p.featured);
    const keyProjects = (featured.length ? featured : sorted).slice(0, MAX_KEY_PROJECTS);
    grid.innerHTML = keyProjects.map(projectToCardHTML).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="opacity:.8">Could not load projects. Check <b>projects.json</b>.</p>';
  }
}

async function loadAllProjects() {
  const grid = document.getElementById("allProjectsGrid");
  if (!grid) return;

  try {
    const sorted = await fetchProjects();
    grid.innerHTML = sorted.map(projectToCardHTML).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="opacity:.8">Could not load projects. Check <b>projects.json</b>.</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadKeyProjects();
  loadAllProjects();
});
