"""Editable, nine-slice UI surfaces for the approved connected Feeding Station."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/images/ui/feeding-station-connected/polish-v2'
OUT.mkdir(parents=True,exist_ok=True)

def svg(w,h,body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" preserveAspectRatio="none"><defs>
<linearGradient id="gold" x2=".65" y2="1"><stop stop-color="#fff1b4"/><stop offset=".2" stop-color="#e3b75d"/><stop offset=".43" stop-color="#98632a"/><stop offset=".65" stop-color="#f8d98b"/><stop offset="1" stop-color="#b9873e"/></linearGradient>
<linearGradient id="navy" x2=".2" y2="1"><stop stop-color="#0e2b3b"/><stop offset=".42" stop-color="#061d2c"/><stop offset="1" stop-color="#03121e"/></linearGradient>
<linearGradient id="emerald" x2=".2" y2="1"><stop stop-color="#127b69"/><stop offset=".42" stop-color="#075447"/><stop offset="1" stop-color="#03352f"/></linearGradient>
<linearGradient id="disabled" x2=".2" y2="1"><stop stop-color="#23343d"/><stop offset="1" stop-color="#12212a"/></linearGradient>
<radialGradient id="light"><stop stop-color="#d3c694" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>{body}</svg>'''

def corner(x,y,angle,rich=True):
    leaf='''<path d="M8 31Q24 25 26 9Q12 11 8 31Z" fill="url(#gold)" fill-opacity=".3" stroke="url(#gold)" stroke-width="1"/><path d="m9 29 15-17M4 23q12-1 12-14M23 4q-1 12-14 12"/>''' if rich else ''
    return f'''<g transform="translate({x} {y}) rotate({angle})" fill="none" stroke="url(#gold)" stroke-linecap="round" stroke-linejoin="round"><path d="M0 38V10Q0 0 10 0H38M4 35V11Q4 4 11 4H35M0 29Q2 2 29 0M7 24Q9 9 24 7" stroke-width="1.8"/>{leaf}<path d="m7 7 5 2-3 3Z" fill="#fff0bd" stroke-width=".8"/></g>'''

files={}
for key,w,h,cut,rich in [('window',320,220,44,True),('panel',240,180,38,True),('portrait',120,140,32,False)]:
    body=f'<rect x="2" y="2" width="{w-4}" height="{h-4}" rx="9" fill="url(#navy)" stroke="#241608" stroke-width="4"/><rect x="3" y="3" width="{w-6}" height="{h-6}" rx="8" fill="none" stroke="url(#gold)" stroke-width="2.5"/><rect x="8" y="8" width="{w-16}" height="{h-16}" rx="5" fill="url(#light)" stroke="#e2c58c" stroke-opacity=".48" stroke-width=".75"/>'
    for x,y,a in [(4,4,0),(w-4,4,90),(w-4,h-4,180),(4,h-4,270)]:body+=corner(x,y,a,rich)
    if key=='window':body+=f'<path d="m{w/2-7} 3 7 4 7-4-7 7Z" fill="url(#gold)"/><path d="m{w/2-7} {h-3} 7-4 7 4-7-7Z" fill="url(#gold)"/>'
    filename=f'{key}.svg';(OUT/filename).write_text(svg(w,h,body));files[filename]={'slice':cut,'purpose':key}

for key in ['action','button','primary','selected','hover','disabled','field','stat']:
    w,h=(240,100) if key in ['action','selected','hover'] else (180,70)
    face='emerald' if key in ['primary','selected'] else 'disabled' if key=='disabled' else 'navy'
    body=f'<path d="M11 2H{w-11}L{w-2} 11V{h-11}L{w-11} {h-2}H11L2 {h-11}V11Z" fill="url(#{face})" stroke="#30200e" stroke-width="3"/><path d="M11 3H{w-11}L{w-3} 11V{h-11}L{w-11} {h-3}H11L3 {h-11}V11Z" fill="none" stroke="url(#gold)" stroke-width="1.9"/><path d="M12 7H{w-12}L{w-7} 12V{h-12}L{w-12} {h-7}H12L7 {h-12}V12Z" fill="url(#light)" stroke="#f8dca1" stroke-opacity=".27" stroke-width=".7"/>'
    if key in ['action','selected','hover']:
        body+='<path d="M8 22V11H22M8 17l9-9M8 78v11h14" fill="none" stroke="url(#gold)" stroke-width="1.2"/>'
    if key in ['selected','primary','hover']:body+=f'<path d="M13 10H{w-13}" stroke="#d8ffdf" stroke-opacity=".65" stroke-width="1"/>'
    filename=f'{key}.svg';(OUT/filename).write_text(svg(w,h,body));files[filename]={'slice':24 if w==240 else 20,'purpose':key}

(OUT/'divider.svg').write_text(svg(320,16,'<path d="M0 8h139m42 0h139" stroke="url(#gold)" stroke-width="1"/><path d="m150 8 10-5 10 5-10 5Z" fill="none" stroke="url(#gold)"/><path d="m157 8 3-2 3 2-3 2Z" fill="#e7c477"/>'))
(OUT/'badge-fed.svg').write_text(svg(180,44,'<rect x="2" y="2" width="176" height="40" rx="5" fill="url(#emerald)" stroke="url(#gold)" stroke-width="1.3"/>'))
(OUT/'badge-warning.svg').write_text(svg(180,44,'<rect x="2" y="2" width="176" height="40" rx="5" fill="#412818" stroke="url(#gold)" stroke-width="1.3"/>'))
files.update({'divider.svg':{'purpose':'header ornament'},'badge-fed.svg':{'slice':8,'purpose':'fed state'},'badge-warning.svg':{'slice':8,'purpose':'shortage state'}})
(OUT/'manifest.json').write_text(json.dumps({'version':2,'generator':'scripts/build-feeding-polish-assets.py','surfaces':files,'icons':['meals.webp','supplies.webp','cooking.webp'],'fonts':'Tinos Regular 400 / Bold 700 from forge-slate-v2/fonts'},indent=2)+'\n')
print(f'Generated {len(list(OUT.glob("*.svg")))} editable SVG surfaces')
