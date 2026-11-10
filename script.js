/* =========================================================
   Portfolio interactions: themes, navigation, filters, terminal,
   and accessible client-side contact form validation.
   ========================================================= */
(() => {
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll("[data-theme-choice]")];
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const themeColors = { light: "#f4f0e2", dark: "#111d20", violet: "#201c2b" };

  // Restore the visitor's theme preference when storage is available.
  let savedTheme = "light";
  try {
    const storedTheme = localStorage.getItem("portfolio-theme");
    if (storedTheme && themeColors[storedTheme]) savedTheme = storedTheme;
  } catch { /* Private browsing can disable localStorage; defaults still work. */ }

  function setTheme(theme) {
    if (!themeColors[theme]) return;
    root.dataset.theme = theme;
    metaTheme?.setAttribute("content", themeColors[theme]);
    themeButtons.forEach((button) => {
      const active = button.dataset.themeChoice === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    try { localStorage.setItem("portfolio-theme", theme); } catch { /* Optional preference. */ }
  }
  setTheme(savedTheme);
  themeButtons.forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.themeChoice)));

  // Keep the mobile menu keyboard-friendly and close it after navigation.
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  function closeMenu() {
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
    primaryNav?.classList.remove("is-open");
  }
  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    primaryNav?.classList.toggle("is-open", !isOpen);
  });
  primaryNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

  // Filter the project cards without requiring a page reload.
  const filters = [...document.querySelectorAll(".filter-button")];
  const projectCards = [...document.querySelectorAll(".project-card")];
  filters.forEach((button) => button.addEventListener("click", () => {
    const category = button.dataset.filter;
    filters.forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle("is-active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    projectCards.forEach((card) => card.classList.toggle("is-hidden", category !== "all" && card.dataset.category !== category));
  }));

  // Small portfolio terminal. All user-entered text is inserted as text,
  // never interpreted as HTML.
  const terminal = document.querySelector("#terminal-output");
  const terminalForm = document.querySelector("#terminal-form");
  const terminalInput = document.querySelector("#terminal-input");
  const terminalClear = document.querySelector(".terminal-clear");
  const commandHistory = [];
  let historyIndex = 0;

  function addTerminalLine(text, kind = "response") {
    const line = document.createElement("p");
    line.className = `terminal-line ${kind}`;
    line.textContent = text;
    terminal.append(line);
    terminal.scrollTop = terminal.scrollHeight;
  }
  function navigateTo(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const commands = {
    help: () => "Commands: about · skills · projects · contact · clear · help",
    about: () => { navigateTo("about"); return "Taking you to the about section…"; },
    skills: () => { navigateTo("skills"); return "Taking you to the skills section…"; },
    projects: () => { navigateTo("projects"); return "Taking you to selected work…"; },
    contact: () => { navigateTo("contact"); return "Taking you to the contact section…"; },
    clear: () => { terminal.replaceChildren(); return null; },
  };
  terminalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const rawCommand = terminalInput.value.trim();
    if (!rawCommand) return;
    const command = rawCommand.toLowerCase();
    addTerminalLine(rawCommand, "command");
    commandHistory.push(rawCommand);
    historyIndex = commandHistory.length;
    terminalInput.value = "";
    if (command === "clear") { commands.clear(); return; }
    const action = commands[command];
    if (action) {
      const response = action();
      if (response) addTerminalLine(response);
    } else {
      addTerminalLine(`Command not found: ${rawCommand}. Type "help" to see available commands.`, "error");
    }
  });
  terminalClear?.addEventListener("click", () => {
    terminal.replaceChildren();
    terminalInput?.focus();
  });
  terminalInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && commandHistory.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      terminalInput.value = commandHistory[historyIndex];
    } else if (event.key === "ArrowDown" && commandHistory.length) {
      event.preventDefault();
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      terminalInput.value = commandHistory[historyIndex] || "";
    }
  });

  // Validate fields in the browser, then prepare a mailto link instead of
  // pretending the static portfolio has a server-side form endpoint.
  const contactForm = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");
  const fieldRules = {
    name: { label: "Your name", errorId: "name-error", check: (field) => field.value.trim().length >= 2, message: "Please enter at least 2 characters." },
    email: { label: "Your email", errorId: "email-error", check: (field) => field.validity.valid && field.value.trim() !== "", message: "Please enter a valid email address." },
    message: { label: "A little about it", errorId: "message-error", check: (field) => field.value.trim().length >= 10, message: "Please enter at least 10 characters." },
  };
  function validateField(field) {
    const rule = fieldRules[field.name];
    const isValid = rule.check(field);
    field.setAttribute("aria-invalid", String(!isValid));
    document.getElementById(rule.errorId).textContent = isValid ? "" : rule.message;
    return isValid;
  }
  Object.keys(fieldRules).forEach((name) => {
    const field = contactForm?.elements.namedItem(name);
    field?.addEventListener("blur", () => validateField(field));
    field?.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) validateField(field);
      formStatus.classList.remove("is-success");
      formStatus.textContent = "This demo validates your message in the browser; it doesn’t send data to a server.";
    });
  });
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = Object.keys(fieldRules).map((name) => contactForm.elements.namedItem(name));
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      formStatus.classList.remove("is-success");
      formStatus.textContent = "Please check the highlighted fields and try again.";
      fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }
    const name = contactForm.elements.namedItem("name").value.trim();
    const email = contactForm.elements.namedItem("email").value.trim();
    const message = contactForm.elements.namedItem("message").value.trim();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
    formStatus.replaceChildren();
    formStatus.append(document.createTextNode("Looks good — "));
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
    emailLink.textContent = "open your email app to send it";
    emailLink.style.textDecoration = "underline";
    formStatus.append(emailLink, document.createTextNode(". Replace hello@example.com with your email address."));
    formStatus.classList.add("is-success");
  });

  document.querySelector("#year").textContent = new Date().getFullYear();
})();
