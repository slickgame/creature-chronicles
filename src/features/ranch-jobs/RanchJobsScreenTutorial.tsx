"use client";

import { useEffect } from "react";
import { RanchJobsScreen as BaseRanchJobsScreen } from "./RanchJobsScreen";

function label(element: Element): string {
  return element.textContent?.trim() ?? "";
}

export function RanchJobsScreen() {
  useEffect(() => {
    let frame = 0;
    const tagControls = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const jobHeadings = Array.from(document.querySelectorAll<HTMLHeadingElement>("article h2"));
        const jobCards = jobHeadings
          .map((heading) => heading.closest<HTMLElement>("article"))
          .filter((card): card is HTMLElement => Boolean(card));
        const securityCard = jobCards.find((card) =>
          Array.from(card.querySelectorAll("h2")).some((heading) => label(heading) === "Security Patrol"),
        );
        const securityBestFit = securityCard
          ? Array.from(securityCard.querySelectorAll<HTMLButtonElement>("button")).find((button) => label(button) === "Best Fit")
          : null;
        if (securityBestFit) securityBestFit.dataset.tutorialId = "chore-security";
        else if (securityCard) securityCard.dataset.tutorialId = "chore-security";

        const grid = jobCards[0]?.parentElement;
        if (grid) grid.dataset.tutorialId = "chore-second-priority";
      });
    };
    tagControls();
    const observer = new MutationObserver(tagControls);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <BaseRanchJobsScreen />;
}
