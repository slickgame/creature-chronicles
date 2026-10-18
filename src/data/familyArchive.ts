import type { FamilyArchive, FamilyRecord } from '@/types/family';
import type { GameSave, ParentSnapshot } from '@/types/save';

export const creatureFamilyId = (id: string) => `creature:${id}`;
const blank = (id: string, name: string, kind: FamilyRecord['kind']): FamilyRecord => ({ id, name, kind, parents: [], parentageRecorded: false, markers: [], notes: [] });

/** Compact identity/link archive, independent of the capped recent birth log. Never mutates inputs. */
export function buildFamilyArchive(save: GameSave, previous?: GameSave): FamilyArchive {
  const records: Record<string, FamilyRecord> = Object.create(null);
  const compatible = previous?.saveId === save.saveId ? previous : undefined;
  for (const archive of [compatible?.familyArchive, save.familyArchive]) {
    if (archive?.version !== 1) continue;
    for (const [id, r] of Object.entries(archive.records ?? {})) {
      if (!r || r.id !== id || typeof r.name !== 'string' || !Array.isArray(r.parents)) continue;
      records[id] = { ...r, kind: ['creature','player','unknown'].includes(r.kind) ? r.kind : 'unknown', parents: r.parents.filter(p => typeof p === 'string' && p !== id), notes: Array.isArray(r.notes) ? r.notes.filter(n => typeof n === 'string') : [], markers: Array.isArray(r.markers) ? r.markers.filter(n => typeof n === 'string') : [] };
    }
  }
  const put = (id: string, name: string, kind: FamilyRecord['kind'], values: Partial<FamilyRecord> = {}) => {
    records[id] = { ...(records[id] ?? blank(id, name, kind)), ...values, id, name, kind };
    return id;
  };
  const parent = (p: ParentSnapshot) => {
    const id = p.kind === 'player' ? `player:${p.participantId}` : creatureFamilyId(p.creatureId ?? p.participantId);
    return put(id, p.displayName, p.kind, { creatureId: p.creatureId, speciesId: p.speciesId, variantId: p.variantId });
  };
  for (const source of [compatible, save]) {
    if (!source) continue;
    // Parent snapshots retain paired identities, including player contributors.
    for (const birth of source.birthHistory ?? []) {
      const id = creatureFamilyId(birth.creatureId);
      const parents = [parent(birth.parents.giver), parent(birth.parents.receiver)].filter(p => p !== id);
      put(id, birth.nickname, 'creature', { creatureId: birth.creatureId, speciesId: birth.speciesId, variantId: birth.variantId, parents: [...new Set(parents)], parentageRecorded: true, origin: 'Hatched', assessment: birth.lineageRiskLabel, markers: [...(birth.lineageTraits ?? [])] });
    }
    // Retained hatched eggs can restore links even when a birth has left the recent log.
    for (const egg of source.eggs ?? []) {
      if (egg.status !== 'hatched') continue;
      parent(egg.parents.giver); parent(egg.parents.receiver);
    }
    for (const c of source.creatures ?? []) {
      const id = creatureFamilyId(c.creatureId), old = records[id];
      let parents = old?.parents ?? [];
      const lineage = c.lineage;
      if (!old?.parentageRecorded && lineage) {
        const ids = lineage.parentCreatureIds ?? [], names = lineage.parentNames ?? [];
        parents = ids.map((pid, i) => {
          const name = source.creatures?.find(other => other.creatureId === pid)?.nickname ?? records[creatureFamilyId(pid)]?.name ?? (ids.length === names.length ? names[i] : 'Name not recorded');
          return put(creatureFamilyId(pid), name, 'creature', { creatureId: pid });
        });
        const unmatched = names.filter(name => !parents.some(pid => records[pid].name === name));
        while (parents.length < names.length) {
          const i = parents.length, safeName = ids.length === 0 ? names[i] : unmatched.length === names.length - ids.length ? unmatched[i - ids.length] : 'Parent not identified';
          parents.push(put(`unknown:${c.creatureId}:${i}`, safeName || 'Parent not recorded', 'unknown'));
        }
      }
      put(id, c.nickname, 'creature', { creatureId: c.creatureId, speciesId: c.speciesId, variantId: c.variantId, generation: c.generation, parents: [...new Set(parents)].filter(p => p !== id), parentageRecorded: Boolean(old?.parentageRecorded || parents.length), origin: c.originLabel, assessment: lineage ? lineage.label : old?.assessment, markers: [...(lineage?.traits ?? old?.markers ?? [])], notes: [...new Set([...(lineage?.notes ?? []), ...(lineage?.parentNames?.length ? [`Recorded parent names: ${lineage.parentNames.join(' × ')}.`] : []), ...(c.notes ? [c.notes] : [])])] });
    }
  }
  for (const record of Object.values(records)) for (const id of record.parents) if (!records[id]) put(id,'Parent not recorded','unknown');
  return { version: 1, records: { ...records } };
}

export function preserveFamilyArchive(save: GameSave, previous?: GameSave): GameSave {
  const familyArchive = buildFamilyArchive(save, previous);
  return JSON.stringify(save.familyArchive) === JSON.stringify(familyArchive) ? save : { ...save, familyArchive };
}

export function familyChildren(records: Record<string, FamilyRecord>) {
  const children = new Map<string, string[]>();
  for (const r of Object.values(records)) for (const p of r.parents) {
    const list = children.get(p) ?? []; list.push(r.id); children.set(p, list);
  }
  return children;
}
