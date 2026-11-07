import { useEffect, useId, useRef, useState } from "react";
import { getBattleBleedDamage, getBattleSlowedPenalties, type BattleStatusApplicationPreview } from "@/data/battleEngine";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import type { BattleMove, BattleStatusStack } from "@/types/battle";
import s from "./BattleArenaB.module.css";

const trayStatuses = ["bleed", "slowed"] as const;
type TrayStatus = (typeof trayStatuses)[number];

export function getEffectTraySlots(statuses: readonly BattleStatusStack[], moves: readonly BattleMove[] = []) {
  const active = trayStatuses.filter(status => statuses.some(effect => effect.status === status && effect.duration > 0));
  return moves.reduce((count, move) => Math.max(count, trayStatuses.filter(status =>
    active.includes(status) || move.effects.some(effect => effect.type === "apply_status" && effect.status === status),
  ).length), active.length);
}

export function EffectIcon({ status }: { status: TrayStatus }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {status === "bleed"
      ? <path d="M12 2C9.5 6.6 5 11.4 5 15.6a7 7 0 1 0 14 0C19 11.4 14.5 6.6 12 2Zm-4.4 13c.4 2.1 1.3 3.5 3.1 4.5C8 19.5 6.8 17.3 7.6 15Z"/>
      : <path d="M22 3C15 4.5 9.2 6.5 6 9.6c-2 2-2.4 4.3-2 6.8l-2 3.3L3.4 21l3-4.5c3.7.7 7-1 8.8-3.2-1.7.6-3.5.8-5.3.7 3.7-1.2 6.8-2.6 8.6-5.2-1.5.5-3 .9-4.5.9C18.4 8.1 20.8 6 22 3Z"/>}
  </svg>;
}

function rounds(count: number) {
  return `${count} ${count === 1 ? "round" : "rounds"}`;
}

function effectDescription(status: TrayStatus, effect: BattleStatusStack) {
  if (status === "bleed") return `Loses ${getBattleBleedDamage(effect)} HP at the end of each round.`;
  const { speed, evasion } = getBattleSlowedPenalties(effect);
  return `Speed −${speed} and Evasion −${evasion}. Pursuit attacks deal 10% more damage to this creature.`;
}

type OpenTip = { badge: TrayStatus; trigger: "hover" | "focus" | "click" };

export function BattleEffectTray({ statuses, applications }: {
  statuses: readonly BattleStatusStack[];
  applications: readonly BattleStatusApplicationPreview[];
}) {
  const id = useId();
  const tray = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<OpenTip | null>(null);
  const badges = trayStatuses.flatMap(status => {
    const active = statuses.find(effect => effect.status === status && effect.duration > 0);
    const preview = applications.findLast(application => application.stack.status === status);
    const effect = preview?.stack ?? active;
    return effect ? [{ status, active, preview, effect }] : [];
  });
  const open = badges.some(badge => badge.status === tip?.badge);

  useEffect(() => {
    if (!open) return;
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setTip(null);
    }
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !tray.current?.contains(event.target)) setTip(null);
    }
    window.addEventListener("keydown", dismissOnEscape, true);
    window.addEventListener("pointerdown", dismissOutside);
    return () => {
      window.removeEventListener("keydown", dismissOnEscape, true);
      window.removeEventListener("pointerdown", dismissOutside);
    };
  }, [open]);

  if (!badges.length) return null;

  return <div className={s.effectTray} ref={tray} role="group" aria-label="Status effects">
    {badges.map(({ status, active, preview, effect }) => {
      const { label } = getBattleStatusGlossary(status);
      const duration = rounds(effect.duration);
      const chance = preview ? `${preview.effectChance}%${preview.requiresHit ? " if hit" : " chance"}` : null;
      const showing = tip?.badge === status;
      const tooltipId = `${id}-${status}`;
      const stacks = effect.stacks ?? 1;
      const change = preview?.mode === "stacked" ? "add a stack of" : preview?.mode === "refreshed" ? "reapply" : "apply";

      return <div className={s.effectChip} key={status} data-status={status}
        onPointerEnter={event => {
          if (event.pointerType === "mouse") {
            setTip(current => current?.trigger === "click" ? current : { badge: status, trigger: "hover" });
          }
        }}
        onPointerLeave={() => setTip(current => current?.badge === status && current.trigger === "hover" ? null : current)}>
        <button type="button" data-mode={preview ? "preview" : "active"}
          aria-describedby={showing ? tooltipId : undefined}
          onFocus={event => {
            if (event.currentTarget.matches(":focus-visible")) setTip({ badge: status, trigger: "focus" });
          }}
          onBlur={() => setTip(current => current?.badge === status && current.trigger !== "hover" ? null : current)}
          onClick={() => setTip(current => current?.badge === status && current.trigger === "click" ? null : { badge: status, trigger: "click" })}>
          <EffectIcon status={status}/>
          <span><strong>{label}</strong><small>{chance ? `${chance} · ${duration}` : `${duration} left`}</small></span>
        </button>
        {showing && <div id={tooltipId} className={s.effectTooltip} role="tooltip">
          <strong>{label}{preview ? " · Preview" : " · Active"}</strong>
          <p>{effectDescription(status, effect)}</p>
          {preview && <p>{preview.effectChance}% chance to {change} {label}{preview.requiresHit ? ` on hit (${preview.hitChance}% hit chance)` : ""}.</p>}
          <p>{duration}{preview ? " if applied" : " remaining"} · {stacks} {stacks === 1 ? "stack" : "stacks"}</p>
          {preview && active && <p>Currently active · {rounds(active.duration)} left</p>}
        </div>}
      </div>;
    })}
  </div>;
}
