const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function initYear() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function initTheme() {
  const root = document.documentElement;
  const btn = $(".theme-toggle");
  const saved = localStorage.getItem("theme");
  const systemPrefersLight =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

  const initial = saved || (systemPrefersLight ? "light" : "dark");
  root.dataset.theme = initial;

  const syncBtn = () => {
    if (!btn) return;
    const isLight = root.dataset.theme === "light";
    btn.setAttribute("aria-pressed", String(isLight));
    btn.title = isLight ? "Switch to dark theme" : "Switch to light theme";
    $(".theme-label", btn).textContent = isLight ? "Light" : "Dark";
  };

  syncBtn();

  btn?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    syncBtn();
    showToast(`${next === "light" ? "Light" : "Dark"} theme enabled`);
  });
}

function initMobileNav() {
  const toggle = $(".nav-toggle");
  const panel = $("#nav-links");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    panel.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      const firstLink = $(".nav-link", panel);
      firstLink?.focus();
    }
  };

  toggle.addEventListener("click", () => {
    const open = !panel.classList.contains("open");
    setOpen(open);
  });

  // Close when clicking a link
  panel.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (a && panel.classList.contains("open")) setOpen(false);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("open")) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!panel.classList.contains("open")) return;
    setOpen(false);
    toggle.focus();
  });
}

function initReveal() {
  const items = $$(".reveal");
  if (items.length === 0) return;
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    for (const el of items) el.classList.add("visible");
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  for (const el of items) io.observe(el);
}

function initActiveNav() {
  const links = $$(".nav-link");
  const sections = links
    .map((a) => $(a.getAttribute("href")))
    .filter((el) => el && el.id);

  if (!links.length || !sections.length) return;

  const setActive = (id) => {
    links.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      rootMargin: "-40% 0px -50% 0px", // adjusts detection zone
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));

  links.forEach((a) => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").slice(1);
      setActive(id);
    });
  });
}

function animateCounter(el, target) {
  const start = 0;
  const duration = prefersReducedMotion() ? 0 : 900;
  const t0 = performance.now();

  const tick = (t) => {
    const p = duration === 0 ? 1 : clamp((t - t0) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(start + (target - start) * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const nums = $$(".stat-num[data-counter]");
  if (nums.length === 0) return;

  const run = (el) => {
    const target = Number(el.getAttribute("data-counter") || "0");
    if (!Number.isFinite(target)) return;
    animateCounter(el, target);
  };

  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    for (const el of nums) run(el);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.35 }
  );

  for (const el of nums) io.observe(el);
}

function initCopyEmail() {
  const btn = $("#copy-email");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const email = btn.getAttribute("data-email");
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied to clipboard");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast("Email copied");
    }
  });
}

const PROJECTS = {
  taskManager: {
    title: "Full Stack Task Manager (MERN + TypeScript)",
    subtitle: "Authentication, CRUD, and a polished UI — typed end-to-end.",
    body: `
      <p>Highlights:</p>
      <ul>
        <li>MERN stack: React + NodeJS + ExpressJs + MongoDB.</li>
        <li>TypeScript across the app for safer refactors and cleaner contracts.</li>
        <li>Auth + protected routes (login/signup) and full CRUD flows.</li>
        <li>Responsive UI with clear loading/empty/error states.</li>
      </ul>
      
    `,
    code: "https://github.com/",
    live: "https://example.com",
  },
  paytm: {
    title: "PayTM Clone (JavaScript)",
    subtitle: "A UI clone focused on layout accuracy and responsiveness.",
    body: `
      <p>Highlights:</p>
      <ul>
        <li>Pixel-focused UI clone with responsive sections.</li>
        <li>Clean components and consistent spacing/typography.</li>
        <li>Smooth hover/active states and practical UI polish.</li>
      </ul>
      
    `,
    code: "https://github.com/",
    live: "https://example.com",
  },
  chatApp: {
    title: "Full Stack Chatting Application (MERN + JavaScript + Socket.io)",
    subtitle: "Real-time chat with Socket.io and practical full-stack flows.",
    body: `
      <p>Highlights:</p>
      <ul>
        <li>Real-time messaging using Socket.io (instant updates, low latency).</li>
        <li>MERN stack: React + NodeJS + ExpressJs + MongoDB.</li>
        <li>Practical chat flows (users, conversations, messages) with clean UI states.</li>
      </ul>
     
    `,
    code: "https://github.com/",
    live: "https://example.com",
  },
};

function initProjectModal() {
  const modal = $("#project-modal");
  if (!modal) return;
  const title = $("#modal-title");
  const subtitle = $("#modal-subtitle");
  const body = $("#modal-body");
  const code = $("#modal-code");
  const live = $("#modal-live");

  const open = (key) => {
    const data = PROJECTS[key];
    if (!data) return;
    title.textContent = data.title;
    subtitle.textContent = data.subtitle;
    body.innerHTML = data.body;
    code.href = data.code;
    live.href = data.live;
    modal.showModal();
  };

  $("#projects-grid")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-project]");
    if (!btn) return;
    open(btn.getAttribute("data-project"));
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) modal.close();
  });
}

function validateEmail(email) {
  // Reasonable, not perfect.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initContactForm() {
  const form = $("#contact-form");
  if (!form) return;

  const note = $("#form-note");
  const errorFor = (name) => $(`[data-error-for="${name}"]`, form);
  const setError = (name, msg) => {
    const el = errorFor(name);
    if (el) el.textContent = msg || "";
  };
  const get = (name) => form.elements[name]?.value?.trim?.() ?? "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = get("name");
    const email = get("email");
    const message = get("message");

    setError("name", name ? "" : "Please enter your name.");
    setError("email", email ? (validateEmail(email) ? "" : "Please enter a valid email.") : "Email is required.");
    setError("message", message ? "" : "Please write a short message.");

    const hasError = !!(errorFor("name")?.textContent || errorFor("email")?.textContent || errorFor("message")?.textContent);
    if (hasError) {
      note.textContent = "Fix the highlighted fields and try again.";
      showToast("Please fix the form fields");
      return;
    }

    note.textContent = "Opening your email client…";

    const to = "sinhanikhil366@gmail.com";
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}\n`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });

  form.addEventListener("reset", () => {
    setError("name", "");
    setError("email", "");
    setError("message", "");
    if (note) note.textContent = "";
  });
}

function initBackToTop() {
  const a = $(".back-to-top");
  if (!a) return;
  a.addEventListener("click", (e) => {
    // Some browsers can behave oddly when targeting a sticky header element;
    // this ensures a reliable scroll-to-top.
    if (!("scrollTo" in window)) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", "#home");
  });
}

initYear();
initTheme();
initMobileNav();
initReveal();
initActiveNav();
initCopyEmail();
initProjectModal();
initContactForm();
initBackToTop();

