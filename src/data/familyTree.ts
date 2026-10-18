import type { FamilyRecord } from '@/types/family';
import { familyChildren } from './familyArchive';

export function familyNeighborhood(records: Record<string, FamilyRecord>, root: string, expanded: ReadonlySet<string>) {
  const children = familyChildren(records), visible = new Set<string>([root]), visited = new Set<string>(), queue = [root];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]; if (visited.has(id)) continue; visited.add(id);
    if (id !== root && !expanded.has(id)) continue;
    const related = [...(records[id]?.parents ?? []), ...(children.get(id) ?? [])];
    for (const child of children.get(id) ?? []) related.push(...records[child].parents);
    for (const next of related) if (records[next]) { visible.add(next); if (expanded.has(next)) queue.push(next); }
  }
  return visible;
}

/** One node per identity; one union per actual parent set, never a partner-permutation atlas. */
export function layoutFamilyTree(records: Record<string, FamilyRecord>, visible: ReadonlySet<string>) {
  const ids = [...visible].filter(id => records[id]).sort(), depth = new Map<string, number>(), active = new Set<string>(), ignored = new Set<string>();
  const parents = (id: string) => records[id].parents.filter(p => visible.has(p) && records[p] && !ignored.has(`${id}\0${p}`));
  // Iterative DFS avoids recursion limits on long-running saves. Cyclic imported edges are omitted only in this view.
  for (const start of ids) {
    if (depth.has(start)) continue;
    const stack: { id: string; finish: boolean }[] = [{ id: start, finish: false }];
    while (stack.length) {
      const item = stack.pop()!;
      if (item.finish) { depth.set(item.id, Math.max(0, ...parents(item.id).map(p => (depth.get(p) ?? -1) + 1))); active.delete(item.id); continue; }
      if (depth.has(item.id)) continue;
      active.add(item.id); stack.push({ id: item.id, finish: true });
      for (const p of parents(item.id)) {
        if (active.has(p)) ignored.add(`${item.id}\0${p}`);
        else if (!depth.has(p)) stack.push({ id: p, finish: false });
      }
    }
  }
  const unions = new Map<string, { id: string; parents: string[]; children: string[] }>();
  for (const id of ids) {
    const ps = [...new Set(parents(id))].sort(); if (!ps.length) continue;
    const key = JSON.stringify(ps), union = unions.get(key) ?? { id: key, parents: ps, children: [] }; union.children.push(id); unions.set(key, union);
  }
  // Align partners without visible ancestry, without forcing cross-generation relatives onto one layer.
  for (let pass = 0; pass < ids.length; pass++) {
    let changed = false;
    for (const union of unions.values()) {
      const level = Math.max(...union.parents.map(p => depth.get(p)!));
      for (const p of union.parents) if (!parents(p).length && depth.get(p)! < level) { depth.set(p, level); changed = true; }
      for (const c of union.children) if (depth.get(c)! <= level) { depth.set(c, level + 1); changed = true; }
    }
    if (!changed) break;
  }
  const rows = new Map<number, string[]>();
  for (const id of ids) { const level = depth.get(id) ?? 0, row = rows.get(level) ?? []; row.push(id); rows.set(level, row); }
  const levels = [...rows.keys()].sort((a,b) => a-b);
  const ranks = new Map<string, number>(), childMap = new Map<string, string[]>(), partnerMap = new Map<string, string[]>();
  const updateRanks = (row: string[]) => row.forEach((id,i) => ranks.set(id,(i+.5)/row.length));
  for (const row of rows.values()) updateRanks(row);
  for (const union of unions.values()) for (const p of union.parents) {
    childMap.set(p,[...(childMap.get(p) ?? []),...union.children]);
    partnerMap.set(p,[...(partnerMap.get(p) ?? []),...union.parents.filter(other => other !== p)]);
  }
  const rank = (id: string) => ranks.get(id) ?? .5;
  const average = (values: number[]) => values.reduce((sum,n) => sum+n,0) / values.length;
  // Barycentric sweeps keep parent pairs and their children adjacent; IDs break ties deterministically.
  for (let sweep = 0; sweep < 3; sweep++) {
    for (const level of levels) {
      const row = rows.get(level)!;
      const score = (id: string) => {
        const ps = parents(id); if (ps.length) return average(ps.map(rank));
        const partners = (partnerMap.get(id) ?? []).filter(p => parents(p).length);
        return partners.length ? average(partners.flatMap(p => parents(p).map(rank))) + .04 : rank(id);
      };
      const scores = new Map(row.map(id => [id,score(id)])); row.sort((a,b) => scores.get(a)! - scores.get(b)! || a.localeCompare(b)); updateRanks(row);
    }
    for (const level of [...levels].reverse()) {
      const row = rows.get(level)!, scores = new Map(row.map(id => {
        const cs = childMap.get(id) ?? [];
        return [id, cs.length ? average(cs.map(rank)) : rank(id)];
      }));
      row.sort((a,b) => scores.get(a)! - scores.get(b)! || a.localeCompare(b)); updateRanks(row);
    }
  }
  const maxColumns = Math.max(1, ...[...rows.values()].map(row => row.length)), width = Math.max(640, maxColumns * 220 + 80);
  const nodes = [...rows.entries()].sort((a,b) => a[0]-b[0]).flatMap(([level,row]) => row.map((id,i) => ({ id, x: (width - row.length * 220) / 2 + i * 220 + 20, y: level * 166 + 70, width: 180, height: 88 })));
  const nodeMap = new Map(nodes.map(n => [n.id,n]));
  const paths = [...unions.values()].map((union, i) => {
    const ps = union.parents.map(p => nodeMap.get(p)!), cs = union.children.map(c => nodeMap.get(c)!);
    const xs = ps.map(p => p.x + 90), cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const py = Math.max(...ps.map(p => p.y + 88)) + 12 + i % 3 * 4, cy = Math.min(...cs.map(c => c.y)) - 20;
    const segments = ps.map(p => `M ${p.x+90} ${p.y+88} V ${py} H ${cx}`);
    segments.push(`M ${cx} ${py} V ${cy}`);
    for (const c of cs) segments.push(`M ${cx} ${cy} H ${c.x+90} V ${c.y}`);
    return { ...union, path: segments.join(' ') };
  });
  return { nodes, paths, width, height: Math.max(350, ...nodes.map(n => n.y + 150)), omittedCycles: ignored.size };
}
