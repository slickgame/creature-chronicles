import type { CreatureRecord } from '@/types/creature';

export type CareTone = 'ready' | 'warning' | 'danger' | 'recovery' | 'occupied' | 'pregnant';
export function careStatusTone(status: string): CareTone {
  if (['Injured', 'Bruised', 'Wounded', 'Badly Hurt', 'Exhausted'].includes(status)) return 'danger';
  if (status === 'Hurt' || status === 'Tired') return 'warning';
  if (status === 'Recovering') return 'recovery';
  if (status.startsWith('Pregnant')) return 'pregnant';
  if (status === 'Ready') return 'ready';
  return 'occupied';
}

/** Presentation only. Never infer illness, service absences or new action restrictions. */
export function getCarePresentation(creature: CreatureRecord, injured: boolean, statusNote?: string) {
  const energyPercent = creature.maxEnergy > 0 ? Math.round(creature.energy / creature.maxEnergy * 100) : 0;
  const status = statusNote || (injured ? creature.injuryLabel ?? 'Injured' : creature.hearts < creature.maxHearts ? 'Hurt' : energyPercent <= 25 ? 'Exhausted' : energyPercent <= 60 ? 'Tired' : 'Ready');
  let icon = 'healthy', title = 'Healthy', description = 'No injury recorded.';
  if (status === 'Training') { icon = 'training'; title = 'Training'; description = 'Currently in training.'; }
  else if (['Injured', 'Bruised', 'Wounded', 'Badly Hurt'].includes(status)) { icon = 'injured'; title = status; description = 'An injury is recorded.'; }
  else if (status === 'Recovering') { icon = 'recovering'; title = status; description = 'Recovery status is recorded.'; }
  else if (status.startsWith('Pregnant')) { icon = 'pregnant'; title = 'Pregnant'; description = 'Expecting offspring.'; }
  else if (status === 'Hurt') { icon = 'hurt'; title = status; description = 'Hearts below maximum.'; }
  else if (status === 'Exhausted') { icon = 'exhausted'; title = status; description = 'Energy is very low.'; }
  else if (status === 'Tired') { icon = 'tired'; title = status; description = 'Energy is running low.'; }
  else if (status.startsWith('Bred ')) { title = 'Recently bred'; description = 'Recent breeding is recorded.'; }
  else if (status !== 'Ready') { title = status; description = 'Current status is recorded.'; }
  return { status, icon, title, description, tone: careStatusTone(status) };
}

export function careMeterPercent(value: number, max: number) {
  return max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
}

export function careDetailPages(lines: string[]) {
  const text = lines.join('\n');
  const pages: string[][] = [];
  let remaining = text;
  while (remaining.length > 280) {
    const boundary = remaining.lastIndexOf(' ', 280);
    const end = boundary > 100 ? boundary : 280;
    pages.push([remaining.slice(0, end)]);
    remaining = remaining.slice(end).trimStart();
  }
  if (remaining) pages.push(remaining.split('\n'));
  return pages;
}
