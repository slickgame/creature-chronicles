"use client";

export default function StaminaStatusBar({
  current,
  max,
  reserved = 0,
  label,
  compact = false,
}: {
  current: number;
  max: number;
  reserved?: number;
  label?: string;
  compact?: boolean;
}) {
  const safeMax = Math.max(1, max);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));
  const safeReserved = Math.max(0, reserved);
  const remaining = Math.max(0, safeCurrent - safeReserved);

  const currentWidth = `${Math.round((safeCurrent / safeMax) * 100)}%`;
  const remainingWidth = `${Math.round((remaining / safeMax) * 100)}%`;

  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex items-center justify-between text-xs text-stone-600">
          <span>{label}</span>
          <span>
            {remaining}/{safeMax}
            {safeReserved > 0 ? ` after ${safeReserved} reserved` : ""}
          </span>
        </div>
      ) : null}

      <div
        className={`relative overflow-hidden rounded-full bg-stone-300 ${
          compact ? "h-2.5" : "h-3"
        }`}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-emerald-200"
          style={{ width: currentWidth }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-emerald-600"
          style={{ width: remainingWidth }}
        />
      </div>
    </div>
  );
}
