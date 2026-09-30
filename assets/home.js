/* A small-screen navigation that stays available when JavaScript is disabled. */
(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;
  document.documentElement.classList.add("js-ready");
  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".header")) closeMenu();
  });
})();
