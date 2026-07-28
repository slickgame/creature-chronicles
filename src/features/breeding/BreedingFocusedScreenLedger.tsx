"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CREATURE_PLACEHOLDER_IMAGE } from "@/data/creatures";
import { BreedingRecordsScreen } from "@/features/breeding-records/BreedingRecordsScreen";
import { BreedingFocusedScreen as QualityOfLifeBreedingScreen } from "./BreedingFocusedScreenQoL";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";
const OPEN_LEDGER_EVENT = "creature-chronicles:open-breeding-ledger";

type ArtworkTarget = {
  host: HTMLElement;
  path: string;
  name: string;
  role: string;
};

function sameArtworkTargets(
  previous: ArtworkTarget[],
  next: ArtworkTarget[],
): boolean {
  return (
    previous.length === next.length &&
    previous.every(
      (item, index) =>
        item.host === next[index]?.host &&
        item.path === next[index]?.path &&
        item.name === next[index]?.name &&
        item.role === next[index]?.role,
    )
  );
}

function readArtworkTargets(preview: Element): ArtworkTarget[] {
  const pairGrid = preview.firstElementChild;
  if (!(pairGrid instanceof HTMLElement)) return [];

  return Array.from(pairGrid.children).flatMap((child, index) => {
    if (!(child instanceof HTMLElement) || child.tagName !== "ARTICLE") return [];
    const host = child.children.item(1);
    const image = host?.querySelector("img");
    if (!(host instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
      return [];
    }

    const name =
      child.querySelector("strong")?.textContent?.trim() ||
      `Participant ${index + 1}`;
    const role =
      child.querySelector("p")?.textContent?.trim() ||
      (index === 0 ? "Giver" : "Receiver");

    return [
      {
        host,
        path: image.currentSrc || image.src || CREATURE_PLACEHOLDER_IMAGE,
        name,
        role,
      },
    ];
  });
}

export function BreedingFocusedScreen() {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [artworkTargets, setArtworkTargets] = useState<ArtworkTarget[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const collapsedBreakdownRef = useRef(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(OPEN_LEDGER_KEY) === "1") {
      window.sessionStorage.removeItem(OPEN_LEDGER_KEY);
      setLedgerOpen(true);
    }

    const openLedger = () => setLedgerOpen(true);
    window.addEventListener(OPEN_LEDGER_EVENT, openLedger);
    return () => window.removeEventListener(OPEN_LEDGER_EVENT, openLedger);
  }, []);

  useEffect(() => {
    if (ledgerOpen) {
      setToolbarHost(null);
      setArtworkTargets([]);
      setViewerIndex(null);
      return;
    }

    collapsedBreakdownRef.current = false;
    let frameId = 0;

    const syncLayoutTargets = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const preview = document.querySelector(
          'section[aria-label="Focused breeding pair preview"]',
        );
        if (!preview) {
          setToolbarHost(null);
          setArtworkTargets((previous) =>
            previous.length ? [] : previous,
          );
          return;
        }

        const header = preview.parentElement?.querySelector("header");
        const nextToolbar = header?.lastElementChild;
        setToolbarHost(
          nextToolbar instanceof HTMLElement ? nextToolbar : null,
        );

        const nextTargets = readArtworkTargets(preview);
        setArtworkTargets((previous) =>
          sameArtworkTargets(previous, nextTargets) ? previous : nextTargets,
        );

        if (!collapsedBreakdownRef.current) {
          const breakdownButton = Array.from(
            preview.querySelectorAll<HTMLButtonElement>("button"),
          ).find(
            (button) => button.textContent?.trim() === "Hide Breakdown",
          );
          if (breakdownButton) {
            collapsedBreakdownRef.current = true;
            breakdownButton.click();
          }
        }
      });
    };

    syncLayoutTargets();
    const observer = new MutationObserver(syncLayoutTargets);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
      characterData: true,
    });
    window.addEventListener("resize", syncLayoutTargets);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayoutTargets);
      window.cancelAnimationFrame(frameId);
    };
  }, [ledgerOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || viewerIndex === null) return;
      event.preventDefault();
      event.stopPropagation();
      setViewerIndex(null);
    }
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [viewerIndex]);

  const activeArtwork = useMemo(
    () =>
      viewerIndex === null
        ? null
        : artworkTargets[viewerIndex] ?? null,
    [artworkTargets, viewerIndex],
  );

  if (ledgerOpen) {
    return <BreedingRecordsScreen onClose={() => setLedgerOpen(false)} />;
  }

  return (
    <>
      <QualityOfLifeBreedingScreen />

      {toolbarHost
        ? createPortal(
            <button
              type="button"
              className="breedingLedgerToolbarButton"
              onClick={() => setLedgerOpen(true)}
            >
              Breeding Ledger
            </button>,
            toolbarHost,
          )
        : null}

      {artworkTargets.map((target, index) =>
        createPortal(
          <button
            key={`${target.role}-${index}`}
            type="button"
            className="breedingArtExpandButton"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setViewerIndex(index);
            }}
            aria-label={`View full image of ${target.name}`}
            title={`View full image of ${target.name}`}
          >
            ⛶ <span>Full Image</span>
          </button>,
          target.host,
        ),
      )}

      {activeArtwork ? (
        <div
          className="breedingArtViewerBackdrop"
          role="presentation"
          onClick={() => setViewerIndex(null)}
        >
          <section
            className="breedingArtViewer"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeArtwork.name} full artwork`}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>{activeArtwork.role}</p>
                <h2>{activeArtwork.name}</h2>
              </div>
              <button type="button" onClick={() => setViewerIndex(null)}>
                Close
              </button>
            </header>
            <div className="breedingArtViewerStage">
              <img
                src={activeArtwork.path}
                alt={`${activeArtwork.name} full artwork`}
                onError={(event) => {
                  event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                }}
              />
            </div>
            {artworkTargets.length > 1 ? (
              <footer>
                <button
                  type="button"
                  onClick={() =>
                    setViewerIndex((current) =>
                      current === null
                        ? 0
                        : (current - 1 + artworkTargets.length) %
                          artworkTargets.length,
                    )
                  }
                >
                  Previous Participant
                </button>
                <span>
                  {(viewerIndex ?? 0) + 1} of {artworkTargets.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setViewerIndex((current) =>
                      current === null
                        ? 0
                        : (current + 1) % artworkTargets.length,
                    )
                  }
                >
                  Next Participant
                </button>
              </footer>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
