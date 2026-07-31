"use client";

import { useMemo, useState } from "react";
import {
  BUILDER_PROJECT_ASSETS,
  BUILDER_PROJECTS,
  commissionBuilderProject,
  getBuilderProjectProgress,
  type BuilderProjectCategory,
  type BuilderProjectId,
} from "@/data/builderProjects";
import { getPredatorFailurePenaltyPreview, getPredatorThreatAssessment } from "@/data/predatorThreat";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./BuilderYardPanel.module.css";

const CATEGORY_LABELS: Record<BuilderProjectCategory, string> = {
  land: "Land Deeds",
  habitat: "Future Habitats",
  security: "Ranch Security",
};

export function BuilderYardPanel({ onClose }: { onClose: () => void }) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("Petra can expand the ranch, reserve future habitats, and strengthen the perimeter.");
  const [selectedProjectId, setSelectedProjectId] = useState<BuilderProjectId | null>(null);
  const threat = useMemo(() => currentSave ? getPredatorThreatAssessment(currentSave) : null, [currentSave]);

  if (!currentSave) return null;

  const selected = selectedProjectId ? getBuilderProjectProgress(currentSave, selectedProjectId) : null;
  const materials = Number(currentSave.flags.ranchMaterialsStock ?? 0);

  function build(projectId: BuilderProjectId) {
    if (!currentSave) return;
    const result = commissionBuilderProject(currentSave, projectId);
    setMessage(result.message);
    if (result.ok) {
      saveCurrentGame(result.save);
      setSelectedProjectId(null);
    }
  }

  return (
    <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="builder-yard-title">
      <header className={styles.header}>
        <div className={styles.npcIdentity}>
          <img src={BUILDER_PROJECT_ASSETS.builder} alt="Petra Hale, the town builder" />
          <div>
            <span>Master Builder</span>
            <h2 id="builder-yard-title">Petra Hale's Builder's Yard</h2>
            <p>“Give me solid materials, a clear plan, and enough Gold to keep my crew fed.”</p>
          </div>
        </div>
        <button type="button" onClick={onClose}>Return to Town</button>
      </header>

      <div className={styles.resourceStrip}>
        <div><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div>
        <div><span>Materials</span><strong>{materials}</strong></div>
        <div><span>Completed Projects</span><strong>{Number(currentSave.flags.builderProjectsCompleted ?? 0)}</strong></div>
        <div data-tier={threat?.tier ?? "none"}><span>Predator Threat</span><strong>{threat?.tier ?? "none"}</strong></div>
      </div>

      <p className={styles.message} aria-live="polite">{message}</p>

      <div className={styles.contentGrid}>
        <div className={styles.catalog}>
          {(Object.keys(CATEGORY_LABELS) as BuilderProjectCategory[]).map((category) => (
            <section key={category} className={styles.categorySection}>
              <div className={styles.categoryHeading}>
                <span>{CATEGORY_LABELS[category]}</span>
                <small>{category === "habitat" ? "Structures are usable reservations until those species are implemented." : category === "security" ? "Permanent bonuses support future nightly predator checks." : "Land deeds unlock connected projects."}</small>
              </div>
              <div className={styles.projectGrid}>
                {BUILDER_PROJECTS.filter((project) => project.category === category).map((project) => {
                  const progress = getBuilderProjectProgress(currentSave, project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      className={styles.projectCard}
                      data-status={progress.status}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <img src={project.iconPath} alt="" />
                      <span>{progress.status === "built" ? "Built" : progress.status === "locked" ? "Locked" : "Available"}</span>
                      <strong>{project.title}</strong>
                      <p>{project.description}</p>
                      <small>{project.costGold} Gold · {project.costMaterials} Materials</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className={styles.threatPanel}>
          <span>Future Predator System</span>
          <h3>Condition-Gated Night Threats</h3>
          <p>Predators will only become possible after the story gate and when livestock, stored feed, damage, or expansion habitats create enough pressure.</p>
          <dl>
            <div><dt>Current Pressure</dt><dd>{threat?.pressure ?? 0}</dd></div>
            <div><dt>Current Security</dt><dd>{threat?.security ?? 0}</dd></div>
            <div><dt>Required Security</dt><dd>{threat?.requiredSecurity ?? 18}</dd></div>
            <div><dt>Event Chance</dt><dd>{threat?.eventChance ?? 0}%</dd></div>
          </dl>
          <h4>{threat?.eligible ? "Why the ranch is exposed" : "Current safeguards"}</h4>
          <ul>
            {(threat?.eligible ? threat.reasons : threat?.blockers)?.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h4>Failure penalties at this tier</h4>
          <ul>{getPredatorFailurePenaltyPreview(threat ?? { eligible: false, tier: "none", eventChance: 0, pressure: 0, security: 0, requiredSecurity: 18, reasons: [], blockers: [], likelyPredator: "foxes" }).map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      </div>

      {selected ? (
        <div className={styles.detailBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedProjectId(null); }}>
          <section className={styles.detailPanel} role="dialog" aria-modal="true" aria-labelledby="builder-project-title">
            <img src={selected.definition.iconPath} alt="" />
            <div>
              <span>{CATEGORY_LABELS[selected.definition.category]}</span>
              <h3 id="builder-project-title">{selected.definition.title}</h3>
              <p>{selected.definition.flavor}</p>
              <dl>
                <div><dt>Gold</dt><dd>{selected.definition.costGold}</dd></div>
                <div><dt>Materials</dt><dd>{selected.definition.costMaterials}</dd></div>
                {selected.definition.securityBonus ? <div><dt>Security</dt><dd>+{selected.definition.securityBonus}</dd></div> : null}
                {selected.definition.predatorPressure ? <div><dt>Pressure</dt><dd>+{selected.definition.predatorPressure}</dd></div> : null}
              </dl>
              {selected.missingPrerequisites.length ? <p className={styles.lockReason}>Requires: {selected.missingPrerequisites.map((item) => item.title).join(", ")}</p> : null}
              <div className={styles.detailActions}>
                <button type="button" onClick={() => setSelectedProjectId(null)}>Cancel</button>
                <button type="button" className={styles.primaryAction} disabled={!selected.affordable || selected.built} onClick={() => build(selected.definition.id)}>
                  {selected.built ? "Already Built" : selected.status === "locked" ? "Locked" : selected.affordable ? "Commission Project" : "Cannot Afford"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
