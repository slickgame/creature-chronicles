from pathlib import Path
out=Path('public/images/ui/breeding-ledger-journal-b/fidelity-v2');out.mkdir(parents=True,exist_ok=True)
# Deliberately irregular parallel rules and corner hatching reproduce the etched reference.
for name,face,edge in [('tab','#f6ddb1','#79502a'),('tab-active','#74401c','#c4964e')]:
 body=f'<path d="M7 2 111 3l7 6-1 62-7 7L8 77l-6-6 1-62Z" fill="{face}" stroke="{edge}" stroke-width="1.5"/><path d="M10 5h98l7 6-1 58-6 6H10l-5-6 1-58Z" fill="none" stroke="{edge}" stroke-width=".7"/>'
 body+=f'<g fill="none" stroke="{edge}" stroke-width=".9"><path d="m7 17 1-8 8-2-4 7-5-3m98-4 8 2 2 8-7-5 3-5M7 63l1 8 8 2-4-7-5 3m98 4 8-2 2-8-7 5 3 5"/><path d="m4 25 2 3m108-1 2-3M5 55l1 3m108-3 2 3"/></g>'
 (out/f'{name}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">'+body+'</svg>')
# Thin florid corner frame with a genuinely transparent center, suitable for native content.
corner='<path d="M2 31V2h29M5 26V5h21M8 17q-5-9 3-9t8 9q0 7-7 4t1-7q8-3 11-9M6 30q9-1 14-10M25 3q-6 9-2 16m-8-3q-5-12-8-9M3 24q7 1 11-4"/>'
body='<path d="M31 3h338M397 31v178M369 237H31M3 209V31" stroke-width=".8"/>'
for trans in ['', 'translate(400 0) scale(-1 1)','translate(0 240) scale(1 -1)','translate(400 240) scale(-1 -1)']:body+=f'<g transform="{trans}">{corner}</g>'
(out/'engraved-frame.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" fill="none" stroke="#80532a" stroke-width="1">'+body+'</svg>')
