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
