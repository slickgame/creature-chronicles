from pathlib import Path
import shutil,json,hashlib
out=Path('public/images/ui/breeding-ledger-journal-b');(out/'source').mkdir(parents=True,exist_ok=True)
# Approved reference and generated masters are retained separately.
icons={
'overview':'<path d="M7 2h12l5 5v23H7zM19 2v7h6M11 14h10M11 19h10M11 24h8" fill="none" stroke="currentColor" stroke-width="2.3"/>',
'attempts':'<ellipse cx="16" cy="23" rx="8" ry="6"/><ellipse cx="6" cy="14" rx="3.5" ry="4.5" transform="rotate(-25 6 14)"/><ellipse cx="13" cy="8" rx="3.3" ry="4.5"/><ellipse cx="21" cy="9" rx="3.3" ry="4.5"/><ellipse cx="27" cy="16" rx="3.3" ry="4.5" transform="rotate(25 27 16)"/>',
'pairs':'<path d="M3 11C3 3 13 3 16 10C20 3 29 4 29 12C29 19 16 28 16 28S3 20 3 11Z"/>',
'creatures':'<path d="M4 5l7 5q5-3 10 0l7-5-1 14q0 11-11 11T5 19z"/><path d="M10 18h3m7 0h3m-10 6 3 2 3-2" fill="none" stroke="#f5d6a1" stroke-width="2"/>',
'tree':'<path d="M16 3v26M16 11 7 7m9 10 10-7M16 22 6 17m10 9 10-7" fill="none" stroke="currentColor" stroke-width="2"/><g><circle cx="16" cy="3" r="3"/><circle cx="6" cy="7" r="3"/><circle cx="27" cy="9" r="3"/><circle cx="5" cy="17" r="3"/><circle cx="27" cy="19" r="3"/></g>',
'calendar':'<path d="M4 7h24v22H4zM4 13h24M10 3v8m12-8v8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9 17h4v4H9zm9 0h4v4h-4zM9 23h4v3H9zm9 0h4v3h-4z"/>',
'blocked':'<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="3"/><path d="m8 7 17 18" stroke="currentColor" stroke-width="3"/>',
'energy':'<path d="M17 1 5 19h9l-1 12L28 12H17l5-11Z" fill="#edac20" stroke="#9b5b0c" stroke-width=".8"/>',
'heart':'<path d="M3 11C3 3 13 3 16 10C20 3 29 4 29 12C29 19 16 28 16 28S3 20 3 11Z" fill="#d44c3f" stroke="#923326"/>'}
for name,body in icons.items():(out/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" color="#51300e" fill="currentColor">{body}</svg>')
for name,face,stroke in [('tab','#f5d6a1','#99703e'),('tab-active','#75401b','#b58d4d')]:
 (out/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><defs><linearGradient id="p" x2="0" y2="1"><stop stop-color="{face}"/><stop offset="1" stop-color="{face}" stop-opacity=".8"/></linearGradient></defs><path d="M9 2h102l7 7v62l-7 7H9l-7-7V9z" fill="url(#p)" stroke="{stroke}" stroke-width="2"/><path d="M11 5h98l6 6v58l-6 6H11l-6-6V11z" fill="none" stroke="{stroke}" stroke-width=".8"/><path d="m7 15 4-6 5-1M104 8l6 2 3 6M7 64l4 7 5 1M104 72l6-3 3-5" fill="none" stroke="{stroke}" stroke-width="1"/></svg>')
(out/'filter-margin.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 110" preserveAspectRatio="none"><g fill="none" stroke="#795226" stroke-width="1" opacity=".7"><path d="M9 105Q2 72 9 12M9 95Q-2 87 5 80Q15 82 9 95M8 72Q-2 63 4 57Q14 59 8 72M8 49Q-2 40 5 34Q15 36 8 49M451 105Q458 72 451 12M451 95Q462 87 455 80Q445 82 451 95M452 72Q462 63 456 57Q446 59 452 72M452 49Q462 40 455 34Q445 36 452 49"/><circle cx="9" cy="12" r="4"/><circle cx="451" cy="12" r="4"/></g></svg>''')
# Confined ink ornament: reserved margins only, never over live text.
barn='<path d="M8 55h111M18 52V26L41 9l23 18v27M13 27 41 5 69 27M25 52V31h32v21M34 52V33m12 19V33M25 33l32 18M57 33 25 51M67 52V30h34v22M65 30l18-15 24 16M77 52V36h14v16M31 21h17M85 23h6M110 53V24m-8 13 8-13 9 13m-20 2h23M6 48l19-1m65 10 30-1M5 60l85-2m-65 5h38"/><path d="M11 56V39m-7 5h15m-15 8h15M111 51l9-4M119 55V40m-6 4h13"/>'
flower='<path d="M18 105Q8 76 16 25M16 88Q1 77 6 68q15 3 10 20M14 65Q27 53 25 45q-13 1-11 20M15 48Q4 41 7 35q10 0 8 13"/><circle cx="16" cy="22" r="4"/>'+''.join(f'<ellipse cx="16" cy="13" rx="2.8" ry="6" transform="rotate({i*45} 16 22)"/>' for i in range(8))
windmill='<path d="m14 105 5-62h7l8 62M16 97h16M17 85h13M18 72h10M17 100l14-15-12-13 10-11M22 42V3M3 22h39M8 8l28 28M8 36 36 8"/><circle cx="22" cy="22" r="4"/><path d="M24 5v12l8-11M38 20H27l10-9M25 39V28l9 11M5 25h12L6 34M8 11l9 8M31 34l-6-9"/>'
for name,body,view in [('barn',barn,'0 0 130 68'),('flower',flower,'0 0 35 110'),('windmill',windmill,'0 0 45 110')]:
 (out/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" fill="none" stroke="#76502c" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">{body}</svg>')
(out/'cream.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><defs><linearGradient id="p" x2="0" y2="1"><stop stop-color="#fff0cd"/><stop offset=".45" stop-color="#f8dfb0"/><stop offset="1" stop-color="#dfb374"/></linearGradient></defs><path d="M12 2h216l10 10v56l-10 10H12L2 68V12Z" fill="#73451d" stroke="#e8c48b" stroke-width="2"/><path d="M14 6h212l8 8v52l-8 8H14l-8-8V14Z" fill="url(#p)" stroke="#b2874f" stroke-width="2"/><path d="M16 10h208l6 6v48l-6 6H16l-6-6V16Z" fill="none" stroke="#fff1cd" stroke-width="1.5"/></svg>''')
