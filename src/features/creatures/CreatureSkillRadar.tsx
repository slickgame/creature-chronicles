import { MAX_CHORE_SKILL_LEVEL, getChoreSkillAptitudeLabel } from "@/data/choreSkills";
import type { ChoreSkillDefinition, ChoreSkillProgress } from "@/types/choreSkills";

type SkillRadarEntry = {
  definition: ChoreSkillDefinition;
  progress: ChoreSkillProgress;
  naturalBaselineLevel: number;
};

type CreatureSkillRadarProps = {
  title: string;
  subtitle: string;
  skills: SkillRadarEntry[];
};

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 84;

function point(index: number, count: number, ratio: number, radius = RADIUS) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  return {
    x: CENTER + Math.cos(angle) * radius * ratio,
    y: CENTER + Math.sin(angle) * radius * ratio,
  };
}

function polygonPoints(count: number, ratio: number): string {
  return Array.from({ length: count }, (_, index) => {
    const next = point(index, count, ratio);
    return `${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }).join(" ");
}

export function CreatureSkillRadar({ title, subtitle, skills }: CreatureSkillRadarProps) {
  const count = Math.max(3, skills.length);
  const skillPoints = skills.map(({ progress }, index) => {
    const ratio = Math.max(0.04, Math.min(1, progress.level / MAX_CHORE_SKILL_LEVEL));
    const next = point(index, count, ratio);
    return `${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }).join(" ");

  return (
    <article
      data-ui-text-box="auto"
      style={{
        minWidth: 0,
        padding: 11,
        border: "1px solid rgba(127,219,255,.28)",
        borderRadius: 14,
        background: "linear-gradient(180deg,rgba(127,219,255,.07),rgba(0,0,0,.18))",
      }}
    >
      <div style={{ marginBottom: 5 }}>
        <h4 style={{ margin: 0, color: "#fff7dd", fontSize: ".98rem" }}>{title}</h4>
        <p style={{ margin: "3px 0 0", color: "#d8c6a8", fontSize: ".7rem", lineHeight: 1.3 }}>{subtitle}</p>
      </div>

      <svg
        role="img"
        aria-label={`${title} radar graph`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", width: "100%", maxWidth: 320, margin: "0 auto" }}
      >
        <title>{title}: {skills.map(({ definition, progress }) => `${definition.label} level ${progress.level}`).join(", ")}</title>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={polygonPoints(count, ratio)}
            fill="none"
            stroke="rgba(245,201,128,.25)"
            strokeWidth={ratio === 1 ? 1.5 : 1}
          />
        ))}
        {skills.map(({ definition }, index) => {
          const axisEnd = point(index, count, 1);
          const labelPoint = point(index, count, 1, RADIUS + 28);
          return (
            <g key={definition.skillId}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={axisEnd.x}
                y2={axisEnd.y}
                stroke="rgba(245,201,128,.2)"
                strokeWidth="1"
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f2dfbd"
                fontSize="10"
                fontWeight="800"
              >
                {definition.shortLabel}
              </text>
            </g>
          );
        })}
        <polygon
          points={skillPoints}
          fill="rgba(127,219,255,.24)"
          stroke="#7fdbff"
          strokeWidth="2.5"
        />
        {skills.map(({ progress }, index) => {
          const ratio = Math.max(0.04, Math.min(1, progress.level / MAX_CHORE_SKILL_LEVEL));
          const next = point(index, count, ratio);
          return <circle key={index} cx={next.x} cy={next.y} r="3.5" fill="#fff4cf" stroke="#7fdbff" strokeWidth="1.5" />;
        })}
        <text x={CENTER} y={CENTER + 4} textAnchor="middle" fill="#f5c980" fontSize="10" fontWeight="900">
          MAX {MAX_CHORE_SKILL_LEVEL}
        </text>
      </svg>

      <div style={{ display: "grid", gap: 5 }}>
        {skills.map(({ definition, progress, naturalBaselineLevel }) => {
          const trainedLevels = Math.max(0, progress.level - naturalBaselineLevel);
          return (
            <div
              key={definition.skillId}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(86px,.8fr) minmax(0,1.2fr) auto",
                gap: 7,
                alignItems: "center",
                padding: "6px 7px",
                border: "1px solid rgba(245,201,128,.17)",
                borderRadius: 9,
                background: "rgba(0,0,0,.16)",
              }}
            >
              <strong style={{ color: "#fff7dd", fontSize: ".72rem" }}>{definition.label}</strong>
              <span style={{ color: "#d8c6a8", fontSize: ".65rem", lineHeight: 1.2 }}>
                {progress.xpToNext > 0 ? `${progress.xp}/${progress.xpToNext} XP` : "Mastered"}
                {trainedLevels > 0 ? ` • +${trainedLevels} trained` : " • natural baseline"}
              </span>
              <span style={{ color: "#7fdbff", fontSize: ".69rem", fontWeight: 950, textAlign: "right" }}>
                Lv {progress.level}<br />{getChoreSkillAptitudeLabel(progress.level)}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}