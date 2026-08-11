"use client";

import { useEffect } from "react";

const OPEN_PLAYER_MENU_EVENT = "creature-chronicles:open-player-menu";

function normalizeText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findAtelierMenuButton(): HTMLButtonElement | null {
  const main = document.querySelector(".eggAtelierShell main");
  if (!main) return null;

  return (
    Array.from(main.querySelectorAll<HTMLButtonElement>("header button")).find((button) => {
      const text = normalizeText(button);
      return text === "menu" || text === "☰ menu" || text.endsWith(" menu");
    }) ?? null
  );
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

function hideSharedMenuLauncher(): void {
  const shell = document.querySelector<HTMLElement>(".eggAtelierShell");
  if (!shell) return;

  const managedRoot = shell.querySelector<HTMLElement>('[data-player-menu-root="true"]');
  if (managedRoot) {
    const launcher = Array.from(managedRoot.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => normalizeText(button) === "menu",
    );
    if (launcher) {
      launcher.dataset.atelierSharedMenuLauncher = "true";
      launcher.style.setProperty("display", "none", "important");
    }
  }

  Array.from(shell.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    if (button.closest("main")) return;
    if (normalizeText(button) !== "menu") return;
    button.dataset.atelierSharedMenuLauncher = "true";
    button.style.setProperty("display", "none", "important");
  });
}

export function EggAtelierUiBridge() {
  useEffect(() => {
    const sync = () => {
      const localMenu = findAtelierMenuButton();
      if (localMenu) {
        localMenu.dataset.atelierPlayerMenuLauncher = "true";
        localMenu.setAttribute("aria-label", "Open player menu");
      }
      hideSharedMenuLauncher();
      hideQuickhatchEverywhereInAtelier();
    };

    const interceptAtelierMenu = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const clickedButton = target?.closest<HTMLButtonElement>("button");
      const localMenu = findAtelierMenuButton();
      if (!clickedButton || !localMenu || clickedButton !== localMenu) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.dispatchEvent(new Event(OPEN_PLAYER_MENU_EVENT));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", interceptAtelierMenu, true);

    const retryTimers = [0, 50, 150, 350, 750].map((delay) =>
      window.setTimeout(sync, delay),
    );

    return () => {
      observer.disconnect();
      document.removeEventListener("click", interceptAtelierMenu, true);
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      document
        .querySelectorAll<HTMLElement>('[data-atelier-shared-menu-launcher="true"], [data-atelier-quickhatch-hidden="true"]')
        .forEach((element) => {
          element.style.removeProperty("display");
          delete element.dataset.atelierSharedMenuLauncher;
          delete element.dataset.atelierQuickhatchHidden;
        });
    };
  }, []);

  return null;
}
