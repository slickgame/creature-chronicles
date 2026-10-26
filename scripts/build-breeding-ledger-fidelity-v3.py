from pathlib import Path
p=Path('public/images/ui/breeding-ledger-journal-b/fidelity-v3');p.mkdir(parents=True,exist_ok=True)
src=Path('public/images/ui/breeding-ledger-journal-b/fidelity-v2')
for n in ['tab','tab-active']:
 s=(src/f'{n}.svg').read_text()
 if n=='tab':s=s.replace('fill="#f6ddb1"','fill="#f6ddb1" fill-opacity=".24"')
 (p/f'{n}.svg').write_text(s)
s=(src/'engraved-frame.svg').read_text().replace('stroke-width="1"','stroke-width="2.3"').replace('stroke-width=".8"','stroke-width="1.6"');(p/'engraved-frame.svg').write_text(s)
(p/'heading-rule.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 20" fill="none" stroke="#805329" stroke-width="1"><path d="M0 12h153q8 0 15-6m-8 6q8 2 17-1M142 12q3-8 9-8-1 7-9 8m12 0q3-5 9-5-1 6-9 5m-23 0q-5 5-10 3 3-5 10-3M0 15h102"/><path d="m163 5 4-2-1 4m7 3 4-2-1 4"/></svg>''')
(p/'search.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#42270f" stroke-width="2.2"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>')
(p/'arrow.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 14" fill="none" stroke="#42270f" stroke-width="2.4" stroke-linecap="round"><path d="m4 4 5 5 5-5"/></svg>')
