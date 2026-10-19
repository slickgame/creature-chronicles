from pathlib import Path

root = Path('public/images/ui/roster-filters-c')
root.mkdir(parents=True, exist_ok=True)
paths = {
    'diamond': '<path d="M16 3 29 16 16 29 3 16Z"/><path d="m16 9 7 7-7 7-7-7Z"/>',
    'pin': '<path d="M16 29S6 18 6 11a10 10 0 0 1 20 0c0 7-10 18-10 18Z"/><circle cx="16" cy="11" r="4"/>',
    'spark': '<path d="m12 2 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="url(#gold)"/><path d="m25 17 2 5 4 2-4 2-2 5-2-5-4-2 4-2Z" fill="url(#gold)"/>',
    'sort': '<path d="M12 7h17M12 16h13M12 25h9"/><path d="M4 7h2M4 16h2M4 25h2" stroke-width="4"/>',
    'direction': '<path d="M9 27V5m-5 5 5-5 5 5M23 5v22m-5-5 5 5 5-5"/>',
    'chevron': '<path d="m12 6 10 10-10 10"/>',
    'down': '<path d="m6 11 10 10 10-10"/>',
    'reset': '<path d="M7 10A11 11 0 1 1 5 20M7 3v8H0"/>',
}
for name, shape in paths.items():
    (root / f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff1bd"/><stop offset=".55" stop-color="#ebc778"/><stop offset="1" stop-color="#a87527"/></linearGradient></defs><g fill="none" stroke="url(#gold)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">{shape}</g></svg>\n')
(root / 'panel.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="1" y="1" width="118" height="118" rx="5" fill="#031b27" stroke="#c4a05c"/><rect x="4" y="4" width="112" height="112" rx="3" fill="none" stroke="#80662f" opacity=".6"/><g fill="none" stroke="#e1bd76" stroke-width="1"><path id="c" d="M3 19 7 9 19 3M4 13 13 4M7 5 9 12 5 9M12 5l-3 4"/><use href="#c" transform="translate(120 0) scale(-1 1)"/><use href="#c" transform="translate(0 120) scale(1 -1)"/><use href="#c" transform="translate(120 120) scale(-1 -1)"/></g></svg>\n')
