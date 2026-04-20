(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const sidemenu = document.getElementById("sidemenu");
  const openBtn = document.getElementById("openMenuBtn");
  const closeBtn = document.getElementById("closeMenuBtn");

  function openMenu() {
    if (!sidemenu) return;
    sidemenu.classList.add("open");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    if (!sidemenu) return;
    sidemenu.classList.remove("open");
    document.body.classList.remove("menu-open");
  }

  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  const navAnchors = sidemenu ? sidemenu.querySelectorAll("a[href]") : [];
  navAnchors.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (event) => {
    if (!sidemenu || !sidemenu.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedInsideMenu = sidemenu.contains(target);
    const clickedOpenBtn = openBtn && openBtn.contains(target);
    if (!clickedInsideMenu && !clickedOpenBtn) closeMenu();
  });

  // Tab switching in About section
  const tabButtons = Array.from(document.querySelectorAll(".tab-links"));
  const tabPanels = Array.from(document.querySelectorAll(".tab-contents"));

  function setActiveTab(tabId) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle("active-link", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle("active-tab", panel.id === tabId);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab) setActiveTab(btn.dataset.tab);
    });
  });

  // Contact form integration with status feedback
  const scriptURL = "https://script.google.com/macros/s/AKfycbyAWzMbKlhuJy_xK9u3fSwRgdrpp9r3IhpE-cI1Nml98XGX2RM-wujo2AqyWU4BqWKHzg/exec";
  const form = document.forms["submit-to-google-sheet"];
  const submitBtn = document.getElementById("submitBtn");
  const formStatus = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        if (formStatus) formStatus.textContent = "Please fill all required fields correctly.";
        form.reportValidity();
        return;
      }

      if (submitBtn) submitBtn.classList.add("is-loading");
      if (formStatus) formStatus.textContent = "Sending...";

      try {
        const response = await fetch(scriptURL, {
          method: "POST",
          body: new FormData(form)
        });

        if (!response.ok) throw new Error("Request failed");
        form.reset();
        if (formStatus) formStatus.textContent = "Thanks. Your message was sent successfully.";
      } catch (error) {
        if (formStatus) formStatus.textContent = "Message could not be sent. Please try again later.";
      } finally {
        if (submitBtn) submitBtn.classList.remove("is-loading");
      }
    });
  }

  function sanitizeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[s]));
  }

  function getYoutubeEmbedUrl(url) {
    if (!url) return "";
    const input = String(url).trim();
    const directIdPattern = /^[a-zA-Z0-9_-]{11}$/;
    if (directIdPattern.test(input)) return `https://www.youtube.com/embed/${input}`;

    try {
      const parsed = new URL(input);
      const hostname = parsed.hostname.replace(/^www\./, "");

      if (hostname === "youtube.com" || hostname === "m.youtube.com") {
        if (parsed.pathname === "/watch") {
          const id = parsed.searchParams.get("v");
          if (id && directIdPattern.test(id)) return `https://www.youtube.com/embed/${id}`;
        }
        if (parsed.pathname.startsWith("/embed/")) {
          const id = parsed.pathname.split("/embed/")[1]?.split("/")[0];
          if (id && directIdPattern.test(id)) return `https://www.youtube.com/embed/${id}`;
        }
        if (parsed.pathname.startsWith("/shorts/")) {
          const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
          if (id && directIdPattern.test(id)) return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (hostname === "youtu.be") {
        const id = parsed.pathname.replace("/", "").split("/")[0];
        if (id && directIdPattern.test(id)) return `https://www.youtube.com/embed/${id}`;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function videoCardToHtml(video) {
    const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl || video.videoId || "");
    if (!embedUrl) return "";

    const title = sanitizeHtml(video.title || "AI Video");
    const description = sanitizeHtml(video.description || "Hands-on AI content");

    return `
      <article class="video-item" aria-label="${title}">
        <div class="video-frame-wrap">
          <iframe
            src="${embedUrl}"
            title="${title}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <div class="video-meta">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </article>
    `;
  }

  async function loadVideoShowcase() {
    const track = document.getElementById("videoMarqueeTrack");
    if (!track) return;

    try {
      const response = await fetch("videos.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load videos.json");
      const videos = await response.json();
      const cards = videos.map(videoCardToHtml).filter(Boolean);

      if (!cards.length) {
        track.innerHTML = "<p class=\"video-empty\">No videos available right now.</p>";
        return;
      }

      // Duplicate list for seamless marquee loop.
      track.innerHTML = cards.join("") + cards.join("");
    } catch (error) {
      track.innerHTML = "<p class=\"video-empty\">Videos could not be loaded. Please check videos.json.</p>";
    }
  }

  loadVideoShowcase();
})();
