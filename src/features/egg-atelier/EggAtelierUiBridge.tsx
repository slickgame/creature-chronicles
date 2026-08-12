"use client";

import { useEffect } from "react";

const REGISTRY_ART = "/images/props/town/egg_atelier_egg_registry.png";
const CATALOG_ROOT = "/images/egg-atelier/furniture-catalog";
const CATALOG_HERO_ART = [
  `${CATALOG_ROOT}/furniture_soft_bedding_hero.png`,
  `${CATALOG_ROOT}/furniture_warming_lamp_hero.png`,
  `${CATALOG_ROOT}/furniture_lineage_ledger_desk_hero.png`,
  `${CATALOG_ROOT}/furniture_incubator_cradle_hero.png`,
] as const;
const CATALOG_TAB_ART = [
  `${CATALOG_ROOT}/catalog_tab_soft_bedding.png`,
  `${CATALOG_ROOT}/catalog_tab_warming_lamp.png`,
  `${CATALOG_ROOT}/catalog_tab_lineage_ledger.png`,
  `${CATALOG_ROOT}/catalog_tab_incubator_cradle.png`,
] as const;
const CATALOG_LABELS = [
  "Soft Bedding Set",
  "Warming Lamp",
  "Lineage Ledger Desk",
  "Incubator Cradle",
] as const;

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

function decorateFurnitureCatalog(): void {
  const shell = document.querySelector<HTMLElement>(".eggAtelierShell");
  if (!shell) return;

  const headings = Array.from(shell.querySelectorAll<HTMLHeadingElement>("h2"));
  const sidebarHeading = headings.find((heading) => normalizeText(heading) === "furniture catalog");
  const mainHeading = headings.find((heading) => normalizeText(heading) === "atelier furniture");

  if (!sidebarHeading || !mainHeading) {
    delete shell.dataset.atelierFurnitureActive;
    return;
  }

  const root = sidebarHeading.closest<HTMLElement>("section");
  const sidebar = sidebarHeading.closest<HTMLElement>("aside");
  const mainPanel = mainHeading.closest<HTMLElement>("section");
  if (!root || !sidebar || !mainPanel || !root.contains(mainPanel)) return;

  shell.dataset.atelierFurnitureActive = "true";
  root.dataset.atelierFurnitureCatalog = "true";
  sidebar.dataset.catalogSidebar = "true";
  mainPanel.dataset.catalogBook = "true";

  if (!sidebar.querySelector('[data-catalog-sidebar-crest="true"]')) {
    const crest = document.createElement("img");
    crest.src = `${CATALOG_ROOT}/catalog_sidebar_crest.png`;
    crest.alt = "";
    crest.dataset.catalogSidebarCrest = "true";
    crest.dataset.catalogInjected = "true";
    sidebar.insertBefore(crest, sidebar.firstChild);
  }

  if (!mainPanel.querySelector('[data-catalog-book-heading="true"]')) {
    const heading = document.createElement("div");
    heading.dataset.catalogBookHeading = "true";
    heading.dataset.catalogInjected = "true";

    const plaque = document.createElement("span");
    plaque.textContent = "Nursery Furnishings";
    const title = document.createElement("strong");
    title.textContent = "Essential Upgrades";
    const subtitle = document.createElement("em");
    subtitle.textContent = "Curated comforts and tools for better care, stronger bonds, and brighter futures.";

    heading.append(plaque, title, subtitle);
    mainPanel.insertBefore(heading, mainHeading.nextSibling);
  }

  const entries = Array.from(mainPanel.querySelectorAll<HTMLElement>("article")).slice(0, 4);
  entries.forEach((entry, index) => {
    entry.dataset.catalogEntry = String(index + 1);

    const art = entry.querySelector<HTMLImageElement>('div[class*="listingArt"] img');
    if (art) {
      art.src = CATALOG_HERO_ART[index];
      art.alt = "";
      art.dataset.catalogHeroArt = "true";
    }

    if (!entry.querySelector('[data-catalog-entry-badge="true"]')) {
      const badge = document.createElement("span");
      badge.dataset.catalogEntryBadge = "true";
      badge.dataset.catalogIndex = String(index + 1);
      badge.dataset.catalogInjected = "true";
      badge.setAttribute("aria-hidden", "true");
      entry.appendChild(badge);
    }
  });

  if (!mainPanel.querySelector('[data-catalog-tabs="true"]')) {
    const tabs = document.createElement("nav");
    tabs.dataset.catalogTabs = "true";
    tabs.dataset.catalogInjected = "true";
    tabs.setAttribute("aria-label", "Furniture catalog entries");

    entries.forEach((entry, index) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.catalogTab = String(index + 1);
      tab.setAttribute("aria-label", `View ${CATALOG_LABELS[index]}`);

      const image = document.createElement("img");
      image.src = CATALOG_TAB_ART[index];
      image.alt = "";
      const label = document.createElement("span");
      label.textContent = CATALOG_LABELS[index];

      tab.append(image, label);
      tab.addEventListener("click", () => {
        entry.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        tabs.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
          button.dataset.active = button === tab ? "true" : "false";
        });
      });
      if (index === 0) tab.dataset.active = "true";
      tabs.appendChild(tab);
    });

    mainPanel.appendChild(tabs);
  }

  if (!mainPanel.querySelector('[data-catalog-notes="true"]')) {
    const notes = document.createElement("div");
    notes.dataset.catalogNotes = "true";
    notes.dataset.catalogInjected = "true";

    const image = document.createElement("img");
    image.src = `${CATALOG_ROOT}/catalog_notes_plaque.png`;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = "Notes & Tips";

    notes.append(image, label);
    mainPanel.appendChild(notes);
  }

  if (!root.querySelector('[data-catalog-quill="true"]')) {
    const quill = document.createElement("img");
    quill.src = `${CATALOG_ROOT}/catalog_quill_ink_decor.png`;
    quill.alt = "";
    quill.dataset.catalogQuill = "true";
    quill.dataset.catalogInjected = "true";
    root.appendChild(quill);
  }
}

export function EggAtelierUiBridge() {
  useEffect(() => {
    const sync = () => {
      exposeSharedPlayerMenu();
      hideQuickhatchEverywhereInAtelier();
      decorateRegistryHotspot();
      decorateFurnitureCatalog();
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

      document
        .querySelectorAll<HTMLElement>('[data-catalog-injected="true"]')
        .forEach((element) => element.remove());
    };
  }, []);

  return null;
}
