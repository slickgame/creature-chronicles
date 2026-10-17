"""Rebuild text-free SVG production surfaces and silhouette symbols for locked Forge B3."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];root=R/'public/images/ui/forge-slate-v2'
for d in ['frames','icons','categories','ornaments']: (root/d).mkdir(parents=True,exist_ok=True)
GOLD='#d5ad5c';IVORY='#fff0cf';NAVY='#0b1823'
def write(folder,name,body,box='0 0 64 64'):
 dims=box.split(); attrs=f' width="{dims[2]}" height="{dims[3]}" preserveAspectRatio="none"' if folder=='frames' else ''
 (root/folder/(name+'.svg')).write_text(f'<svg{attrs} xmlns="http://www.w3.org/2000/svg" viewBox="{box}">{body}</svg>')
# Original curve-based filled silhouettes, derived from the approved design language.
shapes={
'weapon':'M45 7 59 3 55 17 29 42 24 37ZM23 35 31 43Q33 46 30 48L17 35Q15 32 18 31ZM21 42 25 46 13 58 9 54ZM7 54a5 5 0 1 0 7 7 5 5 0 0 0-7-7Z M48 12 29 35 31 37 52 11Z',
'armor':'M22 10Q32 15 42 10L46 20 43 37 40 48 32 54 24 48 21 37 18 20ZM16 9Q10 12 6 21L3 29Q10 33 18 27L21 14ZM48 9Q54 12 58 21L61 29Q54 33 46 27L43 14ZM24 51 32 57 40 51 46 55 32 63 18 55Z M24 11Q32 14 40 11L39 8Q32 11 25 8Z',
'head':'M11 41Q9 22 25 13L45 5 43 12Q31 14 22 24L16 42ZM20 40Q17 25 32 19 43 16 48 23L55 32 38 31 37 34 55 39 50 56 36 52 25 44 24 38ZM11 43 24 47 34 56 23 60 6 51ZM39 40 42 41 41 49 38 48ZM46 42 49 43 47 51 44 50Z',
'hands':'M36 5 55 10 60 22 43 28 28 20ZM27 23 43 31 40 43 30 49 17 44 13 34ZM13 36 19 38 15 49Q12 53 9 50L8 46ZM21 39 27 42 22 55Q19 60 16 55ZM29 44 35 46 31 58Q28 62 25 58ZM38 41 43 37Q50 42 44 49L37 54 34 50ZM12 31 17 28 23 33 19 37Z',
'feet':'M22 5Q33 8 43 5L45 18Q34 23 21 19ZM23 23 43 22 40 37Q42 42 50 45L57 49Q61 53 56 57L30 58Q16 57 6 52L8 46 20 42 23 37ZM32 59 42 58 42 63 32 63Z M24 32Q30 30 37 34L37 37Q29 33 24 35Z',
'accessory':'M9 5Q1 17 10 30L27 43 29 39 15 28Q7 17 13 7ZM55 5Q63 17 54 30L37 43 35 39 49 28Q57 17 51 7ZM29 39Q32 37 35 39L36 44Q48 55 42 61 32 67 22 61 16 55 28 44ZM32 49Q24 57 27 60 32 63 37 60 40 57 32 49Z'}
for k,path in shapes.items():
 glyph=f'<path fill="{IVORY}" fill-rule="evenodd" d="{path}"/>'
 write('categories',k,glyph)
 if k=='weapon':write('icons',k,glyph)
 write('categories',k+'-badge',f'<defs><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#ffe6a1"/><stop offset=".5" stop-color="#c59a4c"/><stop offset="1" stop-color="#8b642c"/></linearGradient></defs><circle cx="40" cy="40" r="38" fill="#0c1822" stroke="url(#g)" stroke-width="2"/><g transform="translate(9 8) scale(.72)">{glyph}</g>','0 0 80 80')
# Surface border art; nine-slice these rather than stretching corner ornament.
def frame(name,color=GOLD,bg='#0b1823',ornate=False,w=240,h=160):
 fill='none' if bg is None else bg
 corners=''
 if ornate:
  for x,y,r in [(4,4,0),(w-4,4,90),(w-4,h-4,180),(4,h-4,270)]:
   corners+=f'<g transform="translate({x} {y}) rotate({r})" fill="none" stroke="{color}" stroke-width="1"><path d="M0 25V0H25M3 20Q5 5 20 3M0 0l10 10M5 2l3 6-6-3"/><path d="m12 4 3 3-3 3-3-3Z"/></g>'
 body=f'<defs><linearGradient id="g" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffe3a0"/><stop offset=".3" stop-color="{color}"/><stop offset=".65" stop-color="#805c28"/><stop offset="1" stop-color="{color}"/></linearGradient></defs><path d="M8 2H{w-8}L{w-2} 8V{h-8}L{w-8} {h-2}H8L2 {h-8}V8Z" fill="{fill}" stroke="url(#g)" stroke-width="1.7"/><path d="M10 5H{w-10}L{w-5} 10V{h-10}L{w-10} {h-5}H10L5 {h-10}V10Z" fill="none" stroke="{color}" opacity=".45"/>{corners}'
 
 if name.startswith('item-'):
  body=body.replace('#ffe3a0',color).replace('#805c28',color)
 write('frames',name,body,f'0 0 {w} {h}')
for n in ['screen','recipes','details','tooltip','dialog','receipt','source','dialogue','host-plaque']:frame(n,ornate=True,bg=None)
for n in ['material-row','labor-row','stat-row','substat-row','stock-row','field','notice','pager','grade-plate','enhancement-plate']:frame(n,color='#6d756e',bg='#10202c',w=240,h=72)
for n,c in [('success','#6dab85'),('warning','#d5ad5c'),('error','#da8c7c'),('focus','#fff6dc')]:frame(n,c,bg=None)
for base,c,bg in [('button-primary','#d5c57a','#006b5e'),('button-secondary',GOLD,'#14232e'),('tab',GOLD,'#10202b'),('tab-active','#ffd783','#603d1c')]:
 for state in ['', '-hover','-pressed','-disabled']:
  
  shade=bg
  if state=='-hover': shade={'#006b5e':'#008576','#14232e':'#203744','#10202b':'#20333f','#603d1c':'#805223'}[bg]
  elif state=='-pressed': shade={'#006b5e':'#00463e','#14232e':'#08151f','#10202b':'#09151e','#603d1c':'#44280e'}[bg]
  elif state=='-disabled': shade='#26323a'
  frame(base+state,c if state!='-disabled' else '#647079',shade,w=240,h=72)
rarities={'common':'#66d999','uncommon':'#b4c1cd','rare':'#4fb7ff','heroic':'#cd75f6','legendary':'#f0b841'}
for n,c in rarities.items():
 for state in ['', '-hover','-disabled']:
  frame('item-'+n+state,c if state!='-disabled' else '#68737d',bg=None,w=128,h=128)
write('frames','selection','<path d="M4 23V7Q4 4 7 4H23M105 4h16q3 0 3 3v16M124 105v16q0 3-3 3h-16M23 124H7q-3 0-3-3v-16" fill="none" stroke="#fff8df" stroke-width="5" stroke-linecap="round"/>','0 0 128 128')
write('frames','tooltip-pointer',f'<path d="M0 16 16 1 32 16" fill="{NAVY}" stroke="{GOLD}" stroke-width="1.5"/>','0 0 32 16')
# Action icons extend existing vector family with matching warm-ivory color.
old=R/'public/images/ui/forge-gallery-v1/icons'
for src in old.glob('*.svg'):
 if src.stem not in ['weapon','head','hands','armor','accessory']:(root/'icons'/src.name).write_text(src.read_text().replace('#60401f',IVORY))
write('icons','home',f'<g fill="none" stroke="{IVORY}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8M6 10v11h5v-7h3v7h4V10"/></g>','0 0 24 24')
write('icons','info',f'<circle cx="12" cy="12" r="10" fill="none" stroke="{GOLD}" stroke-width="1.5"/><path d="M12 10v7M12 6v1" stroke="{IVORY}" stroke-width="2.3" stroke-linecap="round"/>','0 0 24 24')
write('icons','gold-coin','<defs><radialGradient id="c"><stop stop-color="#ffe599"/><stop offset=".7" stop-color="#d58e24"/><stop offset="1" stop-color="#805016"/></radialGradient></defs><circle cx="32" cy="32" r="29" fill="url(#c)" stroke="#ffe2a0" stroke-width="2"/><circle cx="32" cy="32" r="23" fill="none" stroke="#ffe2a0"/><path d="M39 20H28q-8 0-8 7t9 7h6q9 0 9 7t-8 7H25M32 15v38" fill="none" stroke="#fff4c6" stroke-width="3"/>')
write('ornaments','item-plinth',f'<g fill="none" stroke="{GOLD}" opacity=".35"><circle cx="100" cy="100" r="81"/><circle cx="100" cy="100" r="65"/><path d="M100 8v184M8 100h184M42 42l116 116M158 42 42 158"/><path d="m100 5 4 8-4 8-4-8Zm0 174 4 8-4 8-4-8ZM5 100l8-4 8 4-8 4Zm174 0 8-4 8 4-8 4Z"/></g>','0 0 200 200')
write('ornaments','divider',f'<path d="M0 8H135M165 8H300m-157 0 7-5 7 5-7 5Z" fill="none" stroke="{GOLD}" opacity=".65"/>','0 0 300 16')
write('ornaments','corner',f'<path d="M2 32V2h30M5 25Q8 7 25 5M2 2l13 13m-3-8 4 1-1 4-4-1Z" fill="none" stroke="{GOLD}" stroke-width="1.3"/>','0 0 36 36')
print('Built',len(list(root.rglob('*.svg'))),'SVG surfaces/icons/ornaments')
