"use client";

type Tone = "stone" | "emerald" | "rose" | "sky" | "amber" | "fuchsia" | "teal" | "indigo";

const toneCardClasses: Record<Tone, string> = {
  stone: "border-stone-200 bg-stone-50 text-stone-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  rose: "border-rose-200 bg-rose-50 text-rose-950",
  sky: "border-sky-200 bg-sky-50 text-sky-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  fuchsia: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950",
  teal: "border-teal-200 bg-teal-50 text-teal-950",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-950",
};

const toneButtonClasses: Record<Tone, string> = {
  stone: "bg-stone-800",
  emerald: "bg-emerald-700",
  rose: "bg-rose-700",
  sky: "bg-sky-700",
  amber: "bg-amber-700",
  fuchsia: "bg-fuchsia-700",
  teal: "bg-teal-700",
  indigo: "bg-indigo-800",
};

export function GameModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
  height = "h-[88vh]",
  borderClassName = "border-stone-900",
  titleClassName = "text-stone-900",
  zClassName = "z-[90]",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  height?: string;
  borderClassName?: string;
  titleClassName?: string;
  zClassName?: string;
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center bg-black/50 p-3 sm:p-4`}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex max-h-[92vh] ${height} w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 ${borderClassName} bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <h2 className={`min-w-0 truncate text-lg font-bold sm:text-2xl ${titleClassName}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function GameSectionHeader({
  eyebrow,
  title,
  description,
  children,
  tone = "emerald",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-4 shadow lg:flex-row lg:items-center lg:justify-between ${toneCardClasses[tone]}`}>
      <div>
        <p className="text-xs font-bold uppercase">{eyebrow}</p>
        <h3 className="text-2xl font-bold text-stone-950">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm text-stone-600">{description}</p>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

export function GameCard({
  children,
  tone = "stone",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 shadow ${toneCardClasses[tone]} ${className}`}>
      {children}
    </div>
  );
}

export function GameActionCard({
  title,
  performer,
  targetLabel = "Helper",
  cost,
  outcome,
  disabledReason,
  buttonLabel,
  onAction,
  tone = "emerald",
}: {
  title: string;
  performer: string;
  targetLabel?: string;
  cost: string;
  outcome: string;
  disabledReason?: string;
  buttonLabel: string;
  onAction: () => void;
  tone?: Tone;
}) {
  const enabled = !disabledReason;

  return (
    <div className={`flex min-h-44 flex-col rounded-2xl border-2 p-4 shadow-sm ${enabled ? toneCardClasses[tone] : "border-stone-300 bg-stone-100 text-stone-600"}`}>
      <div className="flex-1">
        <p className="text-lg font-bold">{title}</p>
        <div className="mt-3 space-y-1 text-sm">
          <p><strong>{targetLabel}:</strong> {performer}</p>
          <p><strong>Cost:</strong> {cost}</p>
          <p><strong>Outcome:</strong> {outcome}</p>
          {disabledReason ? (
            <p className="font-semibold text-red-800"><strong>Disabled:</strong> {disabledReason}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={!enabled}
        onClick={onAction}
        className={`mt-4 min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${enabled ? toneButtonClasses[tone] : "bg-stone-400"}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export function GameStatCard({
  label,
  value,
  accentClasses = "border-stone-200 bg-stone-50 text-stone-700",
}: {
  label: string;
  value: string | number;
  accentClasses?: string;
}) {
  return (
    <div className={`rounded-2xl border p-3 text-sm ${accentClasses}`}>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 font-bold text-stone-950">{value}</p>
    </div>
  );
}

export function GameStatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
      {label}: {value}
    </div>
  );
}

export function GameTabButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left shadow-sm ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-white text-stone-900"
      }`}
    >
      <p className="font-bold">{label}</p>
      {description ? (
        <p className={`mt-1 text-xs ${active ? "text-stone-200" : "text-stone-600"}`}>
          {description}
        </p>
      ) : null}
    </button>
  );
}

export function GameTabGroup<TId extends string>({
  items,
  activeId,
  onSelect,
  className = "grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
}: {
  items: Array<{ id: TId; label: string; description?: string }>;
  activeId: TId;
  onSelect: (id: TId) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <GameTabButton
          key={item.id}
          label={item.label}
          description={item.description}
          active={activeId === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

export function GameEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
      {children}
    </div>
  );
}

export function GameFeedbackBox({
  message,
  tone = "emerald",
}: {
  message: string;
  tone?: Tone;
}) {
  if (!message) return null;

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${toneCardClasses[tone]}`}>
      {message}
    </div>
  );
}

export function GameStatusBadge({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={`w-fit rounded-full border bg-white px-3 py-1 text-xs font-bold ${toneCardClasses[tone]}`}>
      {children}
    </span>
  );
}

export function GameActionResultCard({
  result,
  compact = false,
}: {
  result: {
    title?: string;
    summary?: string;
    sourceType?: string;
    creatureNames?: string[];
    statUsed?: string;
    skillUsed?: string;
    traitUsed?: string;
    timeCostMinutes?: number;
    staminaCost?: number;
    rewards?: string[];
    questProgress?: string[];
    storyProgress?: string[];
    locationLabel?: string;
    systemNote?: string;
    tone?: Tone;
    day?: number;
    hour?: number;
    minute?: number;
  } | null;
  compact?: boolean;
}) {
  if (!result) {
    return <GameEmptyState>No recent result recorded yet.</GameEmptyState>;
  }

  const tone = result.tone ?? "stone";
  const rewards = result.rewards ?? [];
  const questProgress = result.questProgress ?? [];
  const storyProgress = result.storyProgress ?? [];
  const creatureNames = result.creatureNames ?? [];

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${toneCardClasses[tone]}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase">{result.sourceType ?? "Result"}</p>
          <h3 className="text-lg font-bold text-stone-950">{result.title ?? "Action Result"}</h3>
        </div>
        {typeof result.day === "number" ? (
          <GameStatusBadge tone={tone}>
            Day {result.day}
            {typeof result.hour === "number" && typeof result.minute === "number"
              ? ` ${result.hour.toString().padStart(2, "0")}:${result.minute.toString().padStart(2, "0")}`
              : ""}
          </GameStatusBadge>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-stone-700">{result.summary ?? "Result recorded."}</p>
      <div className={`mt-3 grid gap-2 text-xs text-stone-700 ${compact ? "" : "sm:grid-cols-2"}`}>
        {result.locationLabel ? <p><strong>Where:</strong> {result.locationLabel}</p> : null}
        {creatureNames.length > 0 ? <p><strong>Creature:</strong> {creatureNames.join(", ")}</p> : null}
        {result.statUsed ? <p><strong>Stat:</strong> {result.statUsed}</p> : null}
        {result.skillUsed ? <p><strong>Skill:</strong> {result.skillUsed}</p> : null}
        {result.traitUsed ? <p><strong>Trait:</strong> {result.traitUsed}</p> : null}
        {typeof result.timeCostMinutes === "number" ? <p><strong>Time:</strong> {result.timeCostMinutes}m</p> : null}
        {typeof result.staminaCost === "number" ? <p><strong>Stamina:</strong> -{result.staminaCost}</p> : null}
      </div>
      {!compact || rewards.length > 0 ? (
        <div className="mt-3 rounded-xl border border-white bg-white/75 px-3 py-2 text-xs text-stone-700">
          <p><strong>Rewards:</strong> {rewards.length > 0 ? rewards.join(", ") : "No direct reward recorded."}</p>
          {questProgress.length > 0 ? <p className="mt-1"><strong>Quest:</strong> {questProgress.join(", ")}</p> : null}
          {storyProgress.length > 0 ? <p className="mt-1"><strong>Story:</strong> {storyProgress.join(", ")}</p> : null}
          {result.systemNote ? <p className="mt-1"><strong>Note:</strong> {result.systemNote}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
