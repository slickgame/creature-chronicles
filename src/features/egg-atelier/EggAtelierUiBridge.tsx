"use client";

import { useEffect } from "react";

const REGISTRY_ART = "/images/props/town/egg_atelier_egg_registry.png";
const REGISTRY_ROOT = "/images/egg-atelier/egg-registry";
const REGISTRY_HERO_ART = [
  `${REGISTRY_ROOT}/egg_registry_common_offer_hero.png`,
  `${REGISTRY_ROOT}/egg_registry_appraised_offer_hero.png`,
  `${REGISTRY_ROOT}/egg_registry_rare_offer_hero.png`,
] as const;
const CATALOG_ROOT = "/images/egg-atelier/furniture-catalog";
const CATALOG_HERO_ART = [
  `${CATALOG_ROOT}/furniture_soft_bedding_hero.png`,
  `${CATALOG_ROOT}/furniture_warming_lamp_hero.png`,
  `${CATALOG_ROOT}/furniture_lineage_ledger_desk_hero.png`,
  `${CATALOG_ROOT}/furniture_incubator_cradle_hero.png`,
] as const;

function normalizeText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/* Egg Services was added later using a structural CSS detector that looks for
   `aside.panel > div.sideList`. Furniture Catalog and Egg Registry predate that
   detector and also use the shared MarketScreen `sideList` class, so the service
   stylesheet can accidentally claim those modes. Strip only that detector class
   while those completed modes are active and reproduce the tiny base sideList
   layout inline. Their original dedicated catalog/registry CSS then renders
   exactly as it did before Egg Services was introduced. */
function isolateSidebarFromEggServices(sidebar: HTMLElement): void {
  const sideList = Array.from(sidebar.children).find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.className
        .split(/\s+/)
        .some((className) => className.toLowerCase().includes("sidelist")),
  );
  if (!sideList || sideList.dataset.atelierServiceDetectorIsolated === "true") return;

  sideList.dataset.atelierServiceDetectorIsolated = "true";
  sideList.dataset.atelierOriginalClassName = sideList.className;
  sideList.className = sideList.className
    .split(/\s+/)
    .filter((className) => !className.toLowerCase().includes("sidelist"))
    .join(" ");
  sideList.style.setProperty("display", "grid");
  sideList.style.setProperty("gap", "10px");
  sideList.style.setProperty("margin-top", "12px");
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

function decorateEggRegistry(): void {
  const shell = document.querySelector<HTMLElement>(".eggAtelierShell");
  if (!shell) return;

  const headings = Array.from(shell.querySelectorAll<HTMLHeadingElement>("h2"));
  const sidebarHeading = headings.find((heading) => normalizeText(heading) === "egg registry");
  const offersHeading = headings.find((heading) => normalizeText(heading) === "egg offers");
  const activeHeading = headings.find((heading) => normalizeText(heading) === "your active eggs");

  if (!sidebarHeading || !offersHeading || !activeHeading) {
    delete shell.dataset.atelierRegistryActive;
    return;
  }

  const root = sidebarHeading.closest<HTMLElement>("section");
  const sidebar = sidebarHeading.closest<HTMLElement>("aside");
  const mainPanel = offersHeading.closest<HTMLElement>("section");
  if (!root || !sidebar || !mainPanel || !root.contains(mainPanel)) return;

  shell.dataset.atelierRegistryActive = "true";
  root.dataset.atelierEggRegistry = "true";
  sidebar.dataset.registrySidebar = "true";
  mainPanel.dataset.registryMain = "true";
  offersHeading.dataset.registrySectionHeading = "offers";
  activeHeading.dataset.registrySectionHeading = "active";
  isolateSidebarFromEggServices(sidebar);

  if (!sidebar.querySelector('[data-registry-sidebar-crest="true"]')) {
    const crest = document.createElement("img");
    crest.src = `${REGISTRY_ROOT}/egg_registry_crest.png`;
    crest.alt = "";
    crest.dataset.registrySidebarCrest = "true";
    crest.dataset.registryInjected = "true";
    sidebar.insertBefore(crest, sidebar.firstChild);
  }

  const sidebarCopy = Array.from(sidebar.children).find(
    (child) => child.tagName === "P" && normalizeText(child).startsWith("buy documented eggs"),
  );
  if (sidebarCopy && !sidebar.querySelector('[data-registry-sidebar-quote="true"]')) {
    const quote = document.createElement("p");
    quote.textContent = "Every egg is a placement. Every note is a legacy.";
    quote.dataset.registrySidebarQuote = "true";
    quote.dataset.registryInjected = "true";
    sidebarCopy.insertAdjacentElement("afterend", quote);
  }

  const offerListings = offersHeading.nextElementSibling as HTMLElement | null;
  if (offerListings) {
    offerListings.dataset.registryOfferList = "true";
    const offerEntries = Array.from(offerListings.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    ).slice(0, 3);

    offerEntries.forEach((entry, index) => {
      entry.dataset.registryOffer = String(index + 1);
      entry.dataset.registryTier = index === 0 ? "common" : index === 1 ? "appraised" : "rare";

      const art = entry.querySelector<HTMLImageElement>('div[class*="listingArt"] img');
      if (art) {
        art.src = REGISTRY_HERO_ART[index];
        art.alt = "";
        art.dataset.registryHeroArt = "true";
      }

      const classification = entry.querySelector<HTMLElement>('span[class*="listingMeta"]');
      if (classification) classification.dataset.registryClassification = String(index + 1);

      if (index > 0 && !entry.querySelector('[data-registry-trust-stamp="true"]')) {
        const stamp = document.createElement("div");
        stamp.dataset.registryTrustStamp = "true";
        stamp.dataset.registryTrustLevel = index === 1 ? "2" : "4";
        stamp.dataset.registryInjected = "true";
        stamp.setAttribute("aria-label", `Requires Selene Trust Level ${index === 1 ? 2 : 4}`);

        const label = document.createElement("span");
        label.textContent = "Selene Trust";
        const level = document.createElement("strong");
        level.textContent = `Lv. ${index === 1 ? 2 : 4}`;
        stamp.append(label, level);
        entry.appendChild(stamp);
      }
    });
  }

  const activeListings = activeHeading.nextElementSibling as HTMLElement | null;
  if (activeListings) {
    activeListings.dataset.registryActiveList = "true";
    const records = Array.from(activeListings.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName !== "DIV",
    );
    records.forEach((record) => {
      record.dataset.registryActiveRecord = "true";
    });

    if (records.length === 0 && !activeListings.querySelector('[data-registry-empty-state="true"]')) {
      const empty = document.createElement("div");
      empty.dataset.registryEmptyState = "true";
      empty.dataset.registryInjected = "true";

      const image = document.createElement("img");
      image.src = `${REGISTRY_ROOT}/egg_registry_empty_state_emblem.png`;
      image.alt = "";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = "No active egg placements";
      const detail = document.createElement("span");
      detail.textContent = "Purchase or place an egg to create a Registry record.";
      copy.append(title, detail);
      empty.append(image, copy);
      activeListings.appendChild(empty);
    }
  }
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
  isolateSidebarFromEggServices(sidebar);

  mainPanel
    .querySelectorAll<HTMLElement>(
      '[data-catalog-tabs="true"], [data-catalog-notes="true"], nav[aria-label="Furniture catalog entries"]',
    )
    .forEach((element) => element.remove());

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
      decorateEggRegistry();
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
        .querySelectorAll<HTMLElement>('[data-atelier-service-detector-isolated="true"]')
        .forEach((element) => {
          if (element.dataset.atelierOriginalClassName !== undefined) {
            element.className = element.dataset.atelierOriginalClassName;
          }
          element.style.removeProperty("display");
          element.style.removeProperty("gap");
          element.style.removeProperty("margin-top");
          delete element.dataset.atelierServiceDetectorIsolated;
          delete element.dataset.atelierOriginalClassName;
        });

      document
        .querySelectorAll<HTMLElement>(
          '[data-catalog-injected="true"], [data-registry-injected="true"]',
        )
        .forEach((element) => element.remove());
    };
  }, []);

  return null;
}
