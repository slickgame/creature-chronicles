"use client";

import { useEffect } from "react";

const REGISTRY_ART = "/images/props/town/egg_atelier_egg_registry.png";

function normalizeText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function exposeSharedPlayerMenu(): void {
  const shell = document.querySelector<HTMLElement>(".eggAtelierShell");
  if (!shell) return;

  const managedRoot = shell.querySelector<HTMLElement>('[data-player-menu-root="true"]');
  if (!managedRoot) return;

  managedRoot.dataset.playerMenuLauncherHidden = "false";
  const launcher = Array.from(managedRoot.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => normalizeText(button) === "menu",
  );
  if (!launcher) return;

  launcher.dataset.atelierSharedMenuLauncher = "true";
  launcher.setAttribute("aria-label", "Open player menu");
  launcher.style.removeProperty("display");
}

function hideQuickhatchEverywhereInAtelier(): void {
  const shell = document.querySelector<HTMLElement>(".eggAtelierShell");
  if (!shell) return;

  shell
    .querySelectorAll<HTMLElement>('[data-tutorial-id="quickhatch-catalyst"]')
    .forEach((element) => {
      element.dataset.atelierQuickhatchHidden = "true";
      element.style.setProperty("display", "none", "important");
    });

  Array.from(shell.querySelectorAll<HTMLElement>("span, strong")).forEach((label) => {
    if (!normalizeText(label).includes("quickhatch catalyst")) return;
    const container = label.closest<HTMLElement>("button") ?? label.closest<HTMLElement>("div");
    if (!container) return;
    container.dataset.atelierQuickhatchHidden = "true";
    container.style.setProperty("display", "none", "important");
  });
}

function decorateRegistryHotspot(): void {
  const interior = document.querySelector<HTMLElement>(
    '.eggAtelierShell section[aria-label="Egg Atelier interior"]',
  );
  if (!interior) return;

  const existing = interior.querySelector<HTMLButtonElement>(
    'button[data-atelier-registry-hotspot="true"]',
  );
  if (existing) return;

  const hotspot = Array.from(interior.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => !button.closest("aside") && normalizeText(button).includes("dr. selene"),
  );
  if (!hotspot) return;

  hotspot.dataset.atelierRegistryHotspot = "true";
  hotspot.setAttribute("aria-label", "Open Egg Registry");

  const image = hotspot.querySelector<HTMLImageElement>("img");
  if (image) {
    image.src = REGISTRY_ART;
    image.alt = "";
    image.style.borderRadius = "0";
    image.style.objectFit = "contain";
  }

  const title = hotspot.querySelector<HTMLElement>("strong");
  if (title) title.textContent = "Egg Registry";

  const subtitle = hotspot.querySelector<HTMLElement>("span");
  if (subtitle) subtitle.textContent = "Placement • Purchase • Notes";
}

export function EggAtelierUiBridge() {
  useEffect(() => {
    const sync = () => {
      exposeSharedPlayerMenu();
      hideQuickhatchEverywhereInAtelier();
      decorateRegistryHotspot();
    };

    const interceptRegistryHotspot = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const hotspot = target?.closest<HTMLButtonElement>(
        'button[data-atelier-registry-hotspot="true"]',
      );
      if (!hotspot) return;

      const interior = hotspot.closest<HTMLElement>(
        'section[aria-label="Egg Atelier interior"]',
      );
      const registryButton = interior
        ? Array.from(interior.querySelectorAll<HTMLButtonElement>("aside button")).find(
            (button) => normalizeText(button) === "egg registry",
          )
        : null;
      if (!registryButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      registryButton.click();
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", interceptRegistryHotspot, true);

    const retryTimers = [0, 50, 150, 350, 750].map((delay) =>
      window.setTimeout(sync, delay),
    );

    return () => {
      observer.disconnect();
      document.removeEventListener("click", interceptRegistryHotspot, true);
      retryTimers.forEach((timer) => window.clearTimeout(timer));

      document
        .querySelectorAll<HTMLElement>(
          '[data-atelier-shared-menu-launcher="true"], [data-atelier-quickhatch-hidden="true"]',
        )
        .forEach((element) => {
          element.style.removeProperty("display");
          delete element.dataset.atelierSharedMenuLauncher;
          delete element.dataset.atelierQuickhatchHidden;
        });
    };
  }, []);

  return null;
}
