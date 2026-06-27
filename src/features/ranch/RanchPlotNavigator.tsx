"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./RanchPlotNavigator.module.css";

type RanchPlotId = "homestead" | "habitats" | "services";

type RanchPlot = {
  id: RanchPlotId;
  label: string;
  shortLabel: string;
  description: string;
};

const RANCH_PLOTS: RanchPlot[] = [
  { id: "homestead", label: "Homestead Yard", shortLabel: "Homestead", description: "House, breeding pen, egg nursery, and town road." },
  { id: "habitats", label: "Habitat Fields", shortLabel: "Habitats", description: "Feline, canine, bovine, lapine, and equine habitats." },
  { id: "services", label: "Service Yard", shortLabel: "Services", description: "Ranch office, chores board, guild board, house, and town road." },
];

function getNextPlotId(currentId: RanchPlotId, direction: -1 | 1): RanchPlotId {
  const currentIndex = RANCH_PLOTS.findIndex((plot) => plot.id === currentId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + RANCH_PLOTS.length) % RANCH_PLOTS.length;
  return RANCH_PLOTS[nextIndex].id;
}

export function RanchPlotNavigator() {
  const [activePlotId, setActivePlotId] = useState<RanchPlotId>("homestead");
  const activePlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === activePlotId) ?? RANCH_PLOTS[0], [activePlotId]);
  const previousPlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === getNextPlotId(activePlotId, -1)) ?? RANCH_PLOTS[0], [activePlotId]);
  const nextPlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === getNextPlotId(activePlotId, 1)) ?? RANCH_PLOTS[0], [activePlotId]);

  useEffect(() => {
    document.documentElement.dataset.ranchPlot = activePlotId;
    return () => {
      delete document.documentElement.dataset.ranchPlot;
    };
  }, [activePlotId]);

  function shiftPlot(direction: -1 | 1) {
    setActivePlotId((currentId) => getNextPlotId(currentId, direction));
  }

  return (
    <nav className={styles.plotNavigator} aria-label="Ranch plot navigation">
      <button type="button" className={`${styles.plotArrow} ${styles.leftArrow}`} onClick={() => shiftPlot(-1)} aria-label={`Go to ${previousPlot.label}`}>
        <span aria-hidden="true">‹</span>
        <em>{previousPlot.shortLabel}</em>
      </button>
      <div className={styles.plotBadge} aria-live="polite">
        <span>Ranch Plot</span>
        <strong>{activePlot.label}</strong>
        <em>{activePlot.description}</em>
      </div>
      <button type="button" className={`${styles.plotArrow} ${styles.rightArrow}`} onClick={() => shiftPlot(1)} aria-label={`Go to ${nextPlot.label}`}>
        <span aria-hidden="true">›</span>
        <em>{nextPlot.shortLabel}</em>
      </button>
    </nav>
  );
}
