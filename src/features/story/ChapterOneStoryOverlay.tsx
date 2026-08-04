"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getNextChapterOneStoryScene, type StoryScene } from "@/data/chapterOneStory";
import { STORY_IMAGE_FALLBACK_PATH } from "@/data/storyImages";
import { useGameContext } from "@/state/GameProvider";

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  display: "grid",
  placeItems: "center",
  padding:
    "max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))",
  overflow: "hidden",
  background: "rgba(0,0,0,.78)",
  backdropFilter: "blur(5px)",
  pointerEvents: "auto",
};

const panelStyle: CSSProperties = {
  width: "min(980px, 100%)",
  maxWidth: "100%",
  maxHeight:
    "calc(100dvh - max(16px, env(safe-area-inset-top)) - max(16px, env(safe-area-inset-bottom)))",
  minWidth: 0,
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  display: "grid",
  gap: "clamp(10px, 2vw, 14px)",
  padding: "clamp(12px, 3vw, 22px)",
  border: "3px solid rgba(245,201,128,.88)",
  borderRadius: "clamp(16px, 4vw, 22px)",
  background: "linear-gradient(rgba(62,31,22,.98),rgba(15,9,8,.98))",
  color: "#fff7dd",
  boxShadow: "0 28px 70px rgba(0,0,0,.7)",
};

const headerStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "clamp(52px, 14vw, 64px) minmax(0, 1fr)",
  gap: "clamp(10px, 3vw, 14px)",
  alignItems: "center",
};

const storyBodyStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: "clamp(10px, 2.5vw, 14px)",
  alignItems: "stretch",
};

const imagePanelStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "clamp(180px, 32dvh, 260px)",
  display: "grid",
  placeItems: "center",
  border: "2px solid rgba(127,219,255,.38)",
  borderRadius: "clamp(14px, 3vw, 18px)",
  background:
    "radial-gradient(circle at 50% 20%, rgba(127,219,255,.16), rgba(0,0,0,.28) 55%)",
  overflow: "hidden",
};

const portraitStyle: CSSProperties = {
  width: "clamp(52px, 14vw, 64px)",
  height: "clamp(52px, 14vw, 64px)",
  objectFit: "contain",
  border: "2px solid rgba(127,219,255,.58)",
  borderRadius: 16,
  background: "rgba(255,247,221,.08)",
  padding: 5,
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#f5c980",
  fontSize: ".68rem",
  fontWeight: 950,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  textShadow: "0 2px 2px rgba(0,0,0,.72)",
  overflowWrap: "anywhere",
};

const bodyStyle: CSSProperties = {
  margin: 0,
  color: "#f2dfbd",
  fontSize: "clamp(.92rem, 3.5vw, 1.02rem)",
  fontWeight: 820,
  lineHeight: 1.48,
  textShadow: "0 2px 2px rgba(0,0,0,.72)",
  overflowWrap: "anywhere",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "2px solid rgba(45,25,13,.92)",
  borderRadius: 12,
  background: "linear-gradient(#fff4cf,#d6a25b)",
  color: "#1f1108",
  fontWeight: 950,
  padding: "9px 12px",
  boxShadow: "0 3px 0 rgba(0,0,0,.34)",
  whiteSpace: "normal",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "rgba(0,0,0,.28)",
  color: "#fff7dd",
  borderColor: "rgba(245,201,128,.42)",
};

export function ChapterOneStoryOverlay() {
  const { appScreen, currentSave, saveCurrentGame, goToRanchJobs, goToTown } =
    useGameContext();
  const scene = useMemo(
    () => (currentSave ? getNextChapterOneStoryScene(currentSave) : null),
    [currentSave],
  );
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [scene?.id]);

  if (!currentSave || appScreen !== "ranch-hub" || !scene) return null;

  const pages = scene.pages?.length
    ? scene.pages
    : scene.lines.map((line) => ({
        speaker: scene.speaker,
        portraitPath: scene.portraitPath,
        imageId: scene.imageId,
        imagePath: scene.imagePath,
        text: line,
      }));
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const isFirst = pageIndex <= 0;
  const isLast = pageIndex >= pages.length - 1;

  function closeScene(nextAction?: "chores" | "town") {
    if (!currentSave || !scene) return;
    saveCurrentGame({
      ...currentSave,
      updatedAt: new Date().toISOString(),
      flags: {
        ...currentSave.flags,
        [scene.flag]: true,
        m24ChapterOneStoryBeats: true,
        m26PagedStoryScenes: true,
        m27StoryImageManifest: true,
        chapterOneLastStoryScene: scene.id,
      },
    });
    if (nextAction === "chores") goToRanchJobs();
    if (nextAction === "town") goToTown();
  }

  return (
    <div
      data-chapter-one-story-backdrop="true"
      style={backdropStyle}
      role="presentation"
    >
      <section
        data-chapter-one-story-panel="true"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-one-story-title"
      >
        <header style={headerStyle}>
          <img src={page.portraitPath} alt="" style={portraitStyle} />
          <div style={{ minWidth: 0 }}>
            <p style={kickerStyle}>
              {getSceneKicker(scene)} • Page {pageIndex + 1}/{pages.length}
            </p>
            <h2
              id="chapter-one-story-title"
              style={{
                margin: "4px 0",
                color: "#fff",
                fontSize: "clamp(1.35rem, 7vw, 3rem)",
                lineHeight: 1,
                textShadow: "0 3px 3px rgba(0,0,0,.72)",
                overflowWrap: "anywhere",
              }}
            >
              {scene.title}
            </h2>
            <span style={{ color: "#7fdbff", fontWeight: 950 }}>
              {page.speaker}
            </span>
          </div>
        </header>

        <section data-chapter-one-story-body="true" style={storyBodyStyle}>
          <div style={imagePanelStyle}>
            <img
              src={page.imagePath}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "clamp(210px, 36dvh, 360px)",
                objectFit: "contain",
                padding: "clamp(10px, 3vw, 18px)",
              }}
              onError={(event) => {
                event.currentTarget.src = STORY_IMAGE_FALLBACK_PATH;
              }}
            />
          </div>
          <article
            style={{
              minWidth: 0,
              display: "grid",
              gap: 10,
              alignContent: "center",
              padding: "clamp(11px, 3vw, 14px)",
              border: "1px solid rgba(245,201,128,.26)",
              borderRadius: 16,
              background: "rgba(0,0,0,.24)",
            }}
          >
            <p style={bodyStyle}>{page.text}</p>
            {"caption" in page && page.caption ? (
              <p style={{ ...kickerStyle, color: "#7fdbff" }}>
                {String(page.caption)}
              </p>
            ) : null}
          </article>
        </section>

        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {pages.map((_, index) => (
            <span
              key={`${scene.id}-dot-${index}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background:
                  index === pageIndex ? "#f5c980" : "rgba(255,247,221,.26)",
                border: "1px solid rgba(0,0,0,.42)",
              }}
            />
          ))}
        </div>

        <footer
          style={{
            minWidth: 0,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#e7c991",
              fontSize: ".78rem",
              fontWeight: 850,
              lineHeight: 1.35,
              overflowWrap: "anywhere",
            }}
          >
            {getFooterHint(scene)}
          </span>
          <div
            data-chapter-one-story-actions="true"
            style={{
              width: "100%",
              maxWidth: 520,
              justifySelf: "end",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 8,
            }}
          >
            <button
              type="button"
              style={secondaryButtonStyle}
              disabled={isFirst}
              onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            >
              Back
            </button>
            {!isLast ? (
              <button
                type="button"
                style={buttonStyle}
                onClick={() =>
                  setPageIndex((value) => Math.min(pages.length - 1, value + 1))
                }
              >
                Next
              </button>
            ) : null}
            {isLast && scene.kind === "intro" ? (
              <button
                type="button"
                style={buttonStyle}
                onClick={() => closeScene("chores")}
              >
                Open Chore Board
              </button>
            ) : null}
            {isLast && scene.kind === "completion" ? (
              <button
                type="button"
                style={buttonStyle}
                onClick={() => closeScene("town")}
              >
                Visit Town
              </button>
            ) : null}
            {isLast ? (
              <button type="button" style={buttonStyle} onClick={() => closeScene()}>
                {scene.actionLabel}
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}

function getSceneKicker(scene: StoryScene): string {
  if (scene.kind === "intro") return "Chapter 1 Opening";
  if (scene.kind === "completion") return "Chapter 1 Complete";
  return "Chapter 1 Beat";
}

function getFooterHint(scene: StoryScene): string {
  if (scene.kind === "intro") {
    return "Story art uses the image manifest and placeholder art until final files are added.";
  }
  if (scene.kind === "completion") return "Chapter 1 onboarding is complete.";
  return "Goal dialogue appears once per completed tutorial goal.";
}
