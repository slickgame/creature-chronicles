"use client";

import { useState } from "react";
import {
  getPlayerGradeDescription,
  getPlayerGradeMultiplierLabel,
  getPlayerTraitClasses,
  getPlayerTraitDescription,
  getPlayerTraitGradeEffectText,
  getPlayerTraitLabel,
  getPlayerTraitSpeciesNote,
  type PlayerFacingTrait,
  type PlayerFacingTraitGrade,
} from "@/lib/traits/playerTraitInfo";

type CreatureTrait = PlayerFacingTrait;
type TraitGrade = PlayerFacingTraitGrade;

function TraitBadgeItem({
  trait,
  grade,
}: {
  trait: CreatureTrait;
  grade: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-amber-200 bg-white/80 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex w-full flex-wrap items-center gap-1 text-left"
      >
        <div
          className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getPlayerTraitClasses(
            trait
          )}`}
        >
          {getPlayerTraitLabel(trait)} {grade}
        </div>

        <div className="ml-auto rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
          {open ? "Hide Info" : "Show Info"}
        </div>
      </button>

      {open ? (
        <div className="mt-2 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-sm">
          <p className="font-semibold text-stone-900">
            {getPlayerTraitLabel(trait)} ({grade})
          </p>
          <p className="mt-1 text-stone-500">{getPlayerTraitSpeciesNote(trait)}</p>
          <p className="mt-2">{getPlayerTraitDescription(trait)}</p>
          <p className="mt-2 font-medium text-stone-800">
            Grade Effect: {getPlayerTraitGradeEffectText(trait, grade as TraitGrade)}
          </p>
          <p className="mt-1 text-stone-500">
            Grade: {getPlayerGradeDescription(grade as TraitGrade)} • {getPlayerGradeMultiplierLabel(grade as TraitGrade)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TraitBadgeRow({
  traits,
}: {
  traits: { trait: CreatureTrait; grade: string }[];
}) {
  if (!traits || traits.length === 0) {
    return (
      <div className="mt-2">
        <div className="inline-block rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
          No Traits
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {traits.map((traitEntry, index) => (
        <TraitBadgeItem
          key={`${traitEntry.trait}-${traitEntry.grade}-${index}`}
          trait={traitEntry.trait}
          grade={traitEntry.grade}
        />
      ))}
    </div>
  );
}

export function SellerStockList({
  stock,
  playerGold,
  onPurchase,
  emptyMessage,
}: {
  stock: {
    id: number;
    price: number;
    creature: {
      nickname: string;
      name: string;
      level: number;
      theme: string;
      traits: { trait: CreatureTrait; grade: string }[];
      stats: {
        strength: number;
        endurance: number;
        intelligence: number;
        speed: number;
        fertility: number;
        vitality: number;
      };
    };
  }[];
  playerGold: number;
  onPurchase: (stockId: number) => void;
  emptyMessage?: string;
}) {
  if (stock.length === 0) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 text-stone-700">
        {emptyMessage ?? "The seller is sold out for today."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stock.map((entry) => (
        <div
          key={entry.id}
          className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-stone-900">
                {entry.creature.nickname}
              </h3>
              <p className="text-stone-700">
                {entry.creature.name} • Lv {entry.creature.level}
              </p>
              <p className="text-sm text-stone-500">
                Theme: {entry.creature.theme}
              </p>
              <TraitBadgeRow traits={entry.creature.traits} />
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-amber-900">
                {entry.price} Gold
              </p>
            </div>
          </div>

          <div className="mb-3 grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
            <p><strong>STR:</strong> {entry.creature.stats.strength}</p>
            <p><strong>END:</strong> {entry.creature.stats.endurance}</p>
            <p><strong>INT:</strong> {entry.creature.stats.intelligence}</p>
            <p><strong>SPD:</strong> {entry.creature.stats.speed}</p>
            <p><strong>FER:</strong> {entry.creature.stats.fertility}</p>
            <p><strong>VIT:</strong> {entry.creature.stats.vitality}</p>
          </div>

          <button
            onClick={() => onPurchase(entry.id)}
            disabled={playerGold < entry.price}
            className={`w-full rounded-2xl px-4 py-3 font-semibold text-white shadow ${
              playerGold >= entry.price ? "bg-amber-700" : "bg-gray-500"
            }`}
          >
            {playerGold >= entry.price ? "Buy Creature" : "Not Enough Gold"}
          </button>
        </div>
      ))}
    </div>
  );
}
