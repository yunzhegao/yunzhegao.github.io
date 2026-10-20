const yearTargets = document.querySelectorAll("[data-current-year]");
yearTargets.forEach((target) => {
  target.textContent = String(new Date().getFullYear());
});

const cvDialog = document.querySelector("[data-cv-dialog]");
const openCvButtons = document.querySelectorAll("[data-open-cv]");
const closeCvButton = document.querySelector("[data-close-cv]");

openCvButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cvDialog?.showModal();
  });
});

closeCvButton?.addEventListener("click", () => {
  cvDialog?.close();
});

cvDialog?.addEventListener("click", (event) => {
  if (event.target === cvDialog) cvDialog.close();
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = menuToggle
  ? document.getElementById(menuToggle.getAttribute("aria-controls"))
  : null;

const closeMobileNav = () => {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", menuToggle.dataset.openLabel || "Open navigation");
  mobileNav.hidden = true;
};

menuToggle?.addEventListener("click", () => {
  if (!mobileNav) return;
  const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute(
    "aria-label",
    willOpen ? menuToggle.dataset.closeLabel : menuToggle.dataset.openLabel,
  );
  mobileNav.hidden = !willOpen;
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileNav);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileNav();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMobileNav();
});
