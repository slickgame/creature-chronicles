"use client";

import Image from "next/image";
import React, { useState } from "react";
import {
  CreatureTraitEntry,
  SortDirection,
} from "@/lib/breeding/types";
import {
  getGradeClasses,
  getGradeDescription,
  getGradeMultiplierLabel,
  getTraitClasses,
  getTraitDescription,
  getTraitGradeEffectText,
  getTraitLabel,
  getTraitSpeciesNote,
} from "@/lib/breeding/uiHelpers";

export function InfoButton({
  onClick,
  label,
  small = false,
}: {
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center justify-center rounded-full border border-rose-300 bg-white font-bold text-rose-900 shadow-sm hover:bg-rose-50 ${
        small ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm"
      }`}
      aria-label={label}
      title={label}
      type="button"
    >
      ?
    </button>
  );
}

export function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-rose-700 bg-rose-700 text-white"
          : "border-rose-300 bg-white text-stone-700 hover:border-rose-400"
      }`}
    >
      {label}
    </button>
  );
}

export function SortDirectionButtons({
  direction,
  setDirection,
}: {
  direction: SortDirection;
  setDirection: (direction: SortDirection) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setDirection("asc")}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow ${
          direction === "asc"
            ? "bg-rose-700 text-white"
            : "border border-rose-300 bg-white text-stone-800"
        }`}
      >
        Asc
      </button>
      <button
        type="button"
        onClick={() => setDirection("desc")}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow ${
          direction === "desc"
            ? "bg-rose-700 text-white"
            : "border border-rose-300 bg-white text-stone-800"
        }`}
      >
        Desc
      </button>
    </div>
  );
}

export function StarButton({
  isFavorited,
  onClick,
}: {
  isFavorited: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold shadow-sm ${
        isFavorited
          ? "border-amber-400 bg-amber-100 text-amber-800"
          : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
      }`}
      aria-label={isFavorited ? "Unfavorite candidate" : "Favorite candidate"}
      title={isFavorited ? "Unfavorite candidate" : "Favorite candidate"}
    >
      ★
    </button>
  );
}

export function HelpModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-rose-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-300"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5 text-stone-800">{children}</div>

        <div className="border-t border-rose-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TraitBadgeItem({ entry }: { entry: CreatureTraitEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-rose-200 bg-white/80 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex w-full flex-wrap items-center gap-1 text-left"
      >
        <div
          className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(
            entry.trait
          )}`}
        >
          {getTraitLabel(entry.trait)}
        </div>
        <div
          className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold ${getGradeClasses(
            entry.grade
          )}`}
        >
          {entry.grade}
        </div>
        <div className="ml-auto rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-900">
          {open ? "Hide Info" : "Show Info"}
        </div>
      </button>

      {open ? (
        <div className="mt-2 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-sm">
          <p className="font-semibold text-stone-900">
            {getTraitLabel(entry.trait)} ({entry.grade})
          </p>
          <p className="mt-1 text-stone-500">{getTraitSpeciesNote(entry.trait)}</p>
          <p className="mt-2">{getTraitDescription(entry.trait)}</p>
          <p className="mt-2 font-medium text-stone-800">
            Grade Effect: {getTraitGradeEffectText(entry.trait, entry.grade)}
          </p>
          <p className="mt-1 text-stone-500">
            Grade: {getGradeDescription(entry.grade)} • {getGradeMultiplierLabel(entry.grade)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TraitBadgeRow({ traits }: { traits: CreatureTraitEntry[] }) {
  if (!traits || traits.length === 0) {
    return (
      <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
        No Traits
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {traits.map((entry, index) => (
        <TraitBadgeItem
          key={`${entry.trait}-${entry.grade}-${index}`}
          entry={entry}
        />
      ))}
    </div>
  );
}

export function CompactParticipantCard({
  selected,
  title,
  subtitle,
  meta,
  traits,
  imageSrc,
  staminaCostLabel,
  isFavorited = false,
  onToggleFavorite,
  onSelect,
  onOpenDetails,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  meta: string;
  traits: CreatureTraitEntry[];
  imageSrc: string;
  staminaCostLabel?: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onSelect: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      type="button"
      className={`w-full rounded-2xl border-2 p-3 text-left shadow transition ${
        selected
          ? "border-rose-700 bg-rose-100"
          : "border-rose-200 bg-white hover:border-rose-400"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
          <Image
            src={imageSrc}
            alt={title}
            width={160}
            height={160}
            className="max-h-full w-auto object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-stone-900">{title}</p>
              <p className="truncate text-xs text-stone-600">{subtitle}</p>
            </div>

            <div className="flex items-center gap-1">
              {onToggleFavorite && (
                <StarButton
                  isFavorited={isFavorited}
                  onClick={onToggleFavorite}
                />
              )}
              <InfoButton
                onClick={onOpenDetails}
                label={`View full details for ${title}`}
                small
              />
            </div>
          </div>

          <p className="mt-1 text-xs text-stone-600">{meta}</p>

          {staminaCostLabel && (
            <p className="mt-1 text-[11px] font-semibold text-stone-700">
              {staminaCostLabel}
            </p>
          )}

          <div className="mt-2">
            <TraitBadgeRow traits={traits} />
          </div>
        </div>
      </div>
    </button>
  );
}
