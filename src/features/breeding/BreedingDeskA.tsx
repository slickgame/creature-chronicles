"use client";

import { useState } from "react";
import type { BreedingParticipant, BreedingPreview } from "@/types/breeding";
import { useNavigation } from "@/features/navigation/NavigationContext";
import s from "./BreedingDeskA.module.css";

const kit = "/images/ui/breeding-desk-a/";
const fidelity = `${kit}fidelity-v2/`;
function Icon({ name }: { name: string }) {
  return <img src={`${["choose.svg", "options.svg"].includes(name) ? fidelity : `${kit}icons/`}${name}`} alt="" />;
}

type Role = "giver" | "receiver";
function Parent({ role, parent, disabled, onChoose, onInspect }: {
  role: Role; parent: BreedingParticipant | null; disabled: boolean;
  onChoose: () => void; onInspect: () => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const roleLabel = role === "giver" ? "Giver" : "Receiver";
  const status = parent?.unavailableReason ?? (parent?.isInjured ? "Injured" : parent?.isPregnant
    ? `Pregnant · ${parent.pregnancyDaysRemaining ?? "—"} days` : parent?.canBreed === false ? "Unavailable" : "Ready");
  return <article className={s.parent} data-role={role} data-empty={!parent}>
    <div className={s.visual}>
      {parent ? parent.profilePath && failed !== parent.profilePath
        ? <img className={s.profile} src={parent.profilePath} alt={`${parent.displayName} full-body profile`} onError={() => setFailed(parent.profilePath ?? null)} />
        : <div className={s.fallback}><strong>{parent.displayName}</strong><p>{parent.kind === "player" ? "Rancher" : "Profile unavailable"}</p></div>
        : <button className={s.emptyChoice} disabled={disabled} onClick={onChoose}>
          <Icon name="choose.svg" /><strong>Choose {role}</strong><small>No parent selected</small>
        </button>}
    </div>
    <div className={s.nameplate}>
      {parent ? <><h2>{parent.displayName} · {roleLabel}</h2>
        <small>{parent.level !== undefined ? `Level ${parent.level} · ` : ""}{status}</small>
        <div className={s.parentActions}>
          <button className={s.primary} disabled={disabled} onClick={onChoose} aria-label={`Choose ${role}`}>Change</button>
          <button disabled={disabled} onClick={onInspect} aria-label={`Inspect ${parent.displayName}`}>Inspect</button>
        </div></> : <><h2>{roleLabel}</h2><button className={s.primary} disabled={disabled} onClick={onChoose} aria-label={`Choose ${role}`}>Choose</button></>}
    </div>
  </article>;
}

type DeskProps = {
  giver: BreedingParticipant | null; receiver: BreedingParticipant | null;
  preview: BreedingPreview | null; disabled: boolean; status: string;
  onChoose: (role: Role) => void; onInspect: (parent: BreedingParticipant) => void;
  onBack: () => void; onNursery: () => void; onOptions: () => void;
  onDetails: () => void; onReview: () => void;
};
export function BreedingDeskA({ giver, receiver, preview, disabled, status, onChoose, onInspect, onBack, onNursery, onOptions, onDetails, onReview }: DeskProps) {
  const [view, setView] = useState("pair");
  const [more, setMore] = useState(false);
  const nav = useNavigation();
  const complete = Boolean(giver && receiver && preview);
  const values = [
    { icon: "heart.webp", value: complete ? `${preview!.pregnancyChance}%` : "—", label: "Pregnancy chance" },
    { icon: "energy.webp", value: complete ? preview!.energyCost : "—", label: "Energy each" },
    { icon: "heart.webp", value: complete ? preview!.heartCost : "—", label: `${complete && preview!.heartCost === 1 ? "Heart" : "Hearts"} each` },
  ];
  const review = <button className={s.primary} disabled={!complete || !preview?.canAttempt || disabled} onClick={onReview}>{disabled ? "Processing…" : "Review attempt"}</button>;
  const ledger = () => { setMore(false); window.dispatchEvent(new Event("creature-chronicles:open-breeding-ledger")); };
  const guidance = complete ? status : !giver && !receiver ? "Choose a giver and receiver to review the pair." : `Choose a ${giver ? "receiver" : "giver"} to review the pair.`;
  return <div className={s.desk} data-breeding-desk="a" data-fidelity="v2" data-view={view}>
    <header className={s.header}>
      <button className={s.back} onClick={onBack} disabled={disabled}><Icon name="back.svg" />Back</button>
      <h1>Breeding Pen</h1>
      <nav aria-label="Screen navigation">
        <button className={s.navLink} onClick={ledger}>Breeding Ledger</button>
        <button className={s.navLink} onClick={onNursery}>Nursery</button>
        <button className={`${s.menu} ${s.primary}`} onClick={() => nav.open("menu")}><Icon name="menu.svg" />Menu</button>
        <button className={s.moreToggle} aria-label="Menu" aria-expanded={more} onClick={() => setMore(!more)}><Icon name="menu.svg" /></button>
        {more && <div className={s.more}><button onClick={ledger}>Breeding Ledger</button><button onClick={onNursery}>Nursery</button><button onClick={() => { setMore(false); nav.open("menu"); }}>Main menu</button></div>}
      </nav>
    </header>
    <nav className={s.focusTabs} aria-label="Pen view">{["pair", "readiness"].map(v => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{v === "pair" ? "Pair" : "Readiness"}</button>)}</nav>
    <section className={s.workspace} data-scenic aria-label="Breeding pairing desk">
      <div className={s.pairs} aria-label="Selected parents">{(["giver", "receiver"] as const).map(role => {
        const parent = role === "giver" ? giver : receiver;
        return <Parent key={role} role={role} parent={parent} disabled={disabled} onChoose={() => onChoose(role)} onInspect={() => parent && onInspect(parent)} />;
      })}</div>
      <section className={`${s.readiness} ${s.panel}`} aria-label="Pair readiness">
        <h2>{complete ? "Pair readiness" : !giver && !receiver ? "Select two parents" : `Choose a ${giver ? "receiver" : "giver"}`}</h2>
        <p className={s.pairNames}>{giver?.displayName ?? "Choose giver"} / {receiver?.displayName ?? "Choose receiver"}</p>
        <dl className={s.costs}>{values.map(v => <div key={v.label}><Icon name={v.icon} /><dd>{v.value}</dd><dt>{v.label}</dt></div>)}</dl>
        {(!complete || !preview?.canAttempt || preview.pregnancyBlockedReason || status.startsWith("The pair or costs changed")) && <p className={s.guidance}>{guidance}</p>}
        {complete && <button onClick={onDetails}>Chance details</button>}{review}
        {!complete && <button className={s.readinessLink} onClick={onDetails}>Readiness details</button>}
      </section>
    </section>
    <section className={`${s.mobileSummary} ${s.panel}`} aria-label="Pair summary">
      {complete ? <div className={s.summaryCosts}>{values.map(v => <span key={v.label}><Icon name={v.icon} /><b>{v.value}</b><small>{v.label}</small></span>)}</div> : <p className={s.summaryGuidance}>{guidance}</p>}
      {complete && !preview?.canAttempt && <p className={s.summaryGuidance}>{guidance}</p>}{review}
    </section>
    <aside className={s.footer} aria-label="Breeding preview details"><button onClick={onOptions}><Icon name="options.svg" /><span data-full-label>Pair Options</span><span data-short-label>Options</span></button></aside>
  </div>;
}
