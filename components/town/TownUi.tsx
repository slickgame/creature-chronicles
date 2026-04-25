"use client";

import { GameModal } from "@/components/ui/GameUi";

export function PopupWindow({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <GameModal open={open} title={title} onClose={onClose} maxWidth={maxWidth}>
      {children}
    </GameModal>
  );
}

export function HubCard({
  icon,
  title,
  subtitle,
  meta,
  accentClasses,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  meta: string;
  accentClasses: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border-2 p-5 text-left shadow transition hover:-translate-y-0.5 hover:shadow-xl ${accentClasses}`}
    >
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-2xl font-bold text-stone-900">{title}</p>
      <p className="mt-1 text-sm text-stone-700">{subtitle}</p>
      <p className="mt-3 text-xs font-semibold text-stone-600">{meta}</p>
    </button>
  );
}
