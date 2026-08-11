"use client";

import { useEffect } from "react";

function normalizeButtonText(button: HTMLButtonElement): string {
  return (button.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findSharedPlayerMenuButton(): HTMLButtonElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      const text = normalizeButtonText(button);
      return text === "menu" && !button.closest("main");
    }) ?? null
  );
}

function findAtelierMenuButton(): HTMLButtonElement | null {
  const main = document.querySelector(".eggAtelierShell main");
  if (!main) return null;

  return (
    Array.from(main.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      const text = normalizeButtonText(button);
      return text === "menu" || text === "☰ menu" || text.endsWith(" menu");
    }) ?? null
  );
}

function hideAtelierQuickhatchPresentation(): void {
  const main = document.querySelector(".eggAtelierShell main");
  if (main) {
    Array.from(main.querySelectorAll<HTMLElement>("span")).forEach((span) => {
      if (!(span.textContent ?? "").includes("Quickhatch Catalyst")) return;
      const container = span.closest<HTMLElement>("button, div");
      if (container) {
        container.dataset.atelierQuickhatchHidden = "true";
        container.style.setProperty("display", "none", "important");
      }
    });
  }

  document
    .querySelectorAll<HTMLButtonElement>('button[data-tutorial-id="quickhatch-catalyst"]')
    .forEach((button) => {
      if (!button.closest(".eggAtelierShell")) return;
      button.dataset.atelierQuickhatchHidden = "true";
      button.style.setProperty("display", "none", "important");
    });
}

export function EggAtelierUiBridge() {
  useEffect(() => {
    let sharedMenuButton: HTMLButtonElement | null = null;
    let atelierMenuButton: HTMLButtonElement | null = null;

    const syncControls = () => {
      sharedMenuButton = findSharedPlayerMenuButton();
      atelierMenuButton = findAtelierMenuButton();

      if (sharedMenuButton) {
        sharedMenuButton.dataset.atelierSharedMenuLauncher = "true";
        sharedMenuButton.style.setProperty("display", "none", "important");
      }

      if (atelierMenuButton) {
        atelierMenuButton.dataset.atelierPlayerMenuLauncher = "true";
        atelierMenuButton.setAttribute("aria-label", "Open player menu");
      }

      hideAtelierQuickhatchPresentation();
    };

    const interceptAtelierMenu = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const clickedButton = target?.closest<HTMLButtonElement>("button");
      const localMenu = findAtelierMenuButton();
      if (!clickedButton || !localMenu || clickedButton !== localMenu) return;

      const sharedMenu = findSharedPlayerMenuButton();
      if (!sharedMenu) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      sharedMenu.click();
    };

    syncControls();
    const observer = new MutationObserver(syncControls);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", interceptAtelierMenu, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", interceptAtelierMenu, true);
      if (sharedMenuButton) {
        sharedMenuButton.style.removeProperty("display");
        delete sharedMenuButton.dataset.atelierSharedMenuLauncher;
      }
      if (atelierMenuButton) {
        delete atelierMenuButton.dataset.atelierPlayerMenuLauncher;
      }
      document
        .querySelectorAll<HTMLElement>('[data-atelier-quickhatch-hidden="true"]')
        .forEach((element) => {
          element.style.removeProperty("display");
          delete element.dataset.atelierQuickhatchHidden;
        });
    };
  }, []);

  return null;
}
