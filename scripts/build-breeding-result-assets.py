from pathlib import Path
p=Path('public/images/ui/breeding-result-journal-b');p.mkdir(parents=True,exist_ok=True)
for name,fill in [('cream','#f4d7a2'),('emerald','#095c36')]:
 stops=('#fff0cf','#e7bb7e') if name=='cream' else ('#27834b','#034627')
 (p/f'{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="{stops[0]}"/><stop offset="1" stop-color="{stops[1]}"/></linearGradient></defs><path d="M15 2H225Q230 2 234 8L238 14V66L230 78H10L2 67V13L10 3Z" fill="#85572a" stroke="#f4d69d" stroke-width="2"/><path d="M16 6H223L234 16V63L226 73H14L6 64V17Z" fill="url(#f)" stroke="#a4753b" stroke-width="1.5"/><path d="M18 10H221L230 18V61L223 69H17L10 62V19Z" fill="none" stroke="#ffebbf" stroke-opacity=".85"/></svg>''')
for name,colors in [('success',('#1e6c38','#0a442a')),('failed',('#72532e','#49321b')),('blocked',('#90532b','#61371c'))]:
 (p/f'banner-{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 76" preserveAspectRatio="none"><defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient></defs><path d="M3 3H374L397 38 374 73H3Z" fill="#805629" stroke="#e1b965" stroke-width="3"/><path d="M8 8H370L389 38 370 68H8Z" fill="url(#f)" stroke="#f2daa1" stroke-width="1.5"/><path d="M14 12H366" stroke="#e7d192" opacity=".55"/></svg>''')
(p/'ornament.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 26" fill="none" stroke="#80512a" stroke-width="1.5"><path d="M0 13h105m90 0h105M117 13q15-13 25 0t25 0t22 0m-59-4q-9-12-17-6 2 8 11 8m46-2q9-12 17-6-2 8-11 8M144 13l6-6 6 6-6 6Z"/><circle cx="150" cy="24" r="1" fill="#80512a"/></svg>''')
icons={
 'film':'<rect x="3" y="4" width="22" height="20" rx="1"/><path d="M8 4v20M3 9h5M3 15h5M3 20h5m10-11 5 5-5 5Z"/>',
 'record':'<path d="M7 3h12l5 5v17H7Z M18 3v6h6M11 13h9m-9 4h9m-9 4h7M3 7v17q0 2 4 2"/>',
 'book':'<path d="M14 6q-7-6-12 0v18q6-5 12 0 6-5 12 0V6q-6-6-12 0Zm0 0v18"/>',
 'nursery':'<path d="M3 17q11-5 22 0v7H3Zm4 1C0 3 13 3 12 17m3 0C9-1 23 0 21 17m1-5q7-2 4 7"/>',
 'heart':'<path d="M14 24 3 13C-3 3 9-1 14 7 20-1 32 4 25 14Z"/>',
 'star':'<path d="m14 2 4 8 9 1-7 6 2 10-8-5-9 5 2-10-6-6 9-1Z"/>'}
for name,paths in icons.items():(p/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="#492b13" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">{paths}</svg>')
