"""Deterministic scalable UI assets matching approved portrait-led Overview A."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
R=ROOT/'public/images/ui/creature-overview-a-v2'
for d in ['frames','icons','ornaments','meters','sculpted','source']: (R/d).mkdir(parents=True,exist_ok=True)
def svg(path,body,w=64,h=64):
 aspect=' preserveAspectRatio="none"' if str(path).startswith(('frames/','meters/')) or str(path).endswith('slate.svg') else ''
 (R/path).write_text(f'<svg{aspect} xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>')
metal='''<linearGradient id="gold" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#fff0b5"/><stop offset=".19" stop-color="#e9c578"/><stop offset=".48" stop-color="#a36e2d"/><stop offset=".68" stop-color="#f1d390"/><stop offset="1" stop-color="#8c632b"/></linearGradient>'''
def corner(x,y,rot):
 return f'''<g transform="translate({x} {y}) rotate({rot})" fill="none" stroke="url(#gold)" stroke-linejoin="round"><path stroke-width="1.9" d="M0 34V0H34M3 30V3H30M0 0l18 18M4 24Q5 5 24 4M10 3 8 10 3 8M14 5l4 5-5 4-4-5Z"/><path d="M7 22Q9 10 22 7M1 12l5-5 6-1" stroke="#fff0b8" stroke-width=".65"/></g>'''
# Frames have fixed 40px corner zones. Use CSS border-image, never stretch corners.
for name,ornate,filled,w,h in [('screen',True,False,240,160),('portrait',True,False,240,240),('header',True,True,320,96),('tab-group',False,True,240,160),('vitals-group',False,True,240,160),('phone-footer',False,True,240,96),('dialog',True,True,240,160),('picker',True,True,240,160)]:
 body=f'<defs>{metal}<linearGradient id="slate" x2=".8" y2="1"><stop stop-color="#102e3d"/><stop offset=".7" stop-color="#041824"/><stop offset="1" stop-color="#071c28"/></linearGradient></defs>'
 body+=f'<path d="M8 3H{w-8}L{w-3} 8V{h-8}L{w-8} {h-3}H8L3 {h-8}V8Z" fill="{"url(#slate)" if filled else "none"}" stroke="url(#gold)" stroke-width="2.6"/>'
 body+=f'<path d="M10 7H{w-10}L{w-7} 10V{h-10}L{w-10} {h-7}H10L7 {h-10}V10Z" fill="none" stroke="#d8b66a" stroke-opacity=".8" stroke-width="1"/>'
 if ornate:
  body+=f'<rect x="1" y="1" width="{w-2}" height="{h-2}" fill="none" stroke="#d8b66a" stroke-width=".7"/>'
  for x,y,rot in [(3,3,0),(w-3,3,90),(w-3,h-3,180),(3,h-3,270)]:body+=corner(x,y,rot)
 svg(f'frames/{name}.svg',body,w,h)
# Complete button state family, tiny clipped corners and enamel depth.
for family in ['primary','secondary','tab','tab-active','dropdown','square','vital-card','record-card']:
 for state in ['normal','hover','pressed','disabled','focus']:
  w,h=(80,80) if family=='square' else (320,104) if family=='vital-card' else (320,84) if family=='record-card' else (240,72)
  active=family in ['primary','tab-active'];disabled=state=='disabled'
  top,bottom=('#16816d','#004c45') if active else ('#15313f','#041925')
  if state=='hover':top,bottom=('#249b83','#075b51') if active else ('#244957','#0a2937')
  if state=='pressed':top,bottom=('#004b43','#096255') if active else ('#04151e','#183541')
  if disabled:top,bottom='#26343b','#1a2931'
  line='#6e786e' if disabled else '#f2d185' if state in ['hover','focus'] or active else '#c49d55'
  body=f'<defs>{metal}<linearGradient id="face" x2=".3" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient><linearGradient id="shine" x2="0" y2="1"><stop stop-color="#fff8ce" stop-opacity=".13"/><stop offset=".5" stop-color="#fff8ce" stop-opacity="0"/></linearGradient></defs>'
  path=f'M10 4H{w-10}L{w-4} 10V{h-10}L{w-10} {h-4}H10L4 {h-10}V10Z'
  if state=='focus':body+=f'<rect x="1" y="1" width="{w-2}" height="{h-2}" rx="7" fill="none" stroke="#fff6cf" stroke-width="2"/>'
  body+=f'<path d="{path}" fill="url(#face)" stroke="{line}" stroke-width="1.6"/><path d="M12 7H{w-12}L{w-7} 12V{h-12}L{w-12} {h-7}H12L7 {h-12}V12Z" fill="url(#shine)" stroke="url(#gold)" stroke-opacity="{.25 if disabled else .65}" stroke-width=".7"/>'
  if family in ['primary','tab-active','secondary','square','dropdown']:
   for x,y,rot in [(8,8,0),(w-8,8,90),(w-8,h-8,180),(8,h-8,270)]:body+=f'<g transform="translate({x} {y}) rotate({rot})"><path d="M0 9V0H9L6 3H3V6Z" fill="url(#gold)"/><path d="M1 7V1H7" stroke="#ffe9a1" stroke-width=".6" fill="none"/></g>'
  if active and not disabled:body+=f'<path d="M13 5H{w-13}" stroke="#c8e3a5" stroke-width="1.2"/><path d="M9 10V{h-10}" stroke="#73bf9a" stroke-width=".6"/>'
  svg(f'frames/{family}-{state}.svg',body,w,h)
# Ready/protection/status and metadata plaques.
for name,fill,line in [('ready','#235b3e','#e3c47b'),('attention','#6c302c','#edb0a1'),('busy','#3b4550','#c7b88b'),('common','#e9d5a1','#83612c'),('uncommon','#c9dfb5','#68884e'),('rare','#b5d6eb','#497ba0'),('heroic','#dcc4ea','#8867a3'),('legendary','#f5d48b','#aa7937')]:
 svg(f'frames/badge-{name}.svg',f'<defs>{metal}</defs><path d="M6 2H154L158 6V34L154 38H6L2 34V6Z" fill="{fill}" stroke="{line}" stroke-width="1.6"/><path d="M7 5H153L155 7V33L153 35H7L5 33V7Z" fill="none" stroke="#fff1bc" stroke-opacity=".5"/>',160,40)
# Solid silhouettes with the concept's ivory/gold finish. All symbols are editable.
shapes={
'overview':'<circle cx="32" cy="17" r="10"/><path d="M12 56V47Q12 31 32 31T52 47V56Z"/>',
'growth':'<path d="M5 56V35H17V56ZM25 56V22H37V56ZM45 56V8H57V56Z"/>',
'work':'<path d="m11 7 9-4 26 24-8 10-12-9-18 24Q4 57 1 53L0 48 20 23 8 13ZM43 24l12 11-10 12-12-12Z" transform="translate(4 2)"/>',
 'talents':'<path d="m32 3 8 19 21 2-16 14 5 22-18-11-18 11 5-22L3 24l21-2Z"/>',
'lineage':'<g fill="none" stroke="url(#ivory)" stroke-width="5"><circle cx="32" cy="12" r="7"/><circle cx="12" cy="50" r="7"/><circle cx="52" cy="50" r="7"/><path d="M32 19V29L12 43M32 29l20 14"/></g>',
'inventory':'<path fill-rule="evenodd" d="M20 6H44V17L40 25H24L20 17ZM16 24Q32 32 48 24L55 51Q55 59 47 60H17Q9 59 9 51ZM27 9v7h10V9Z"/>',
'equipment':'<path d="M47 3 60 1 57 14 27 45 20 38ZM17 34 32 49 27 54 12 39ZM15 43l7 7-11 12-7-7Z"/>',
'care':'<path d="M32 57 8 34C-9 16 16-3 32 14 48-3 73 16 56 34Z"/>',
'identity':'<g fill="none" stroke="url(#ivory)" stroke-width="5" stroke-linejoin="round"><rect x="6" y="6" width="19" height="19" rx="2"/><rect x="39" y="6" width="19" height="19" rx="2"/><rect x="6" y="39" width="19" height="19" rx="2"/><rect x="39" y="39" width="19" height="19" rx="2"/></g>',
'health':'<path fill-rule="evenodd" d="M32 2Q45 11 58 10V34Q55 50 32 62 9 50 6 34V10Q19 11 32 2ZM28 16v12H17v9h11v12h9V37h11v-9H37V16Z"/>',
'roles':'<circle cx="32" cy="15" r="9"/><circle cx="11" cy="24" r="7"/><circle cx="53" cy="24" r="7"/><path d="M18 58V42Q18 29 32 29T46 42V58ZM2 53V41Q2 32 12 32L20 35Q13 43 14 53ZM50 53Q51 43 44 35L52 32Q62 32 62 41V53Z"/>',
'creatures':'<ellipse cx="14" cy="20" rx="6" ry="9" transform="rotate(-22 14 20)"/><ellipse cx="28" cy="12" rx="6" ry="9"/><ellipse cx="43" cy="15" rx="6" ry="9" transform="rotate(15 43 15)"/><ellipse cx="54" cy="28" rx="6" ry="9" transform="rotate(35 54 28)"/><path d="M12 48Q13 37 23 31T42 35Q55 43 48 53 43 60 32 55 22 61 15 56Z"/>',
'profile':'<g fill="none" stroke="url(#ivory)" stroke-width="4"><circle cx="32" cy="17" r="10"/><path d="M13 58V46Q13 32 32 32T51 46V58Z"/></g>',
'habitat':'<g fill="none" stroke="url(#ivory)" stroke-width="4" stroke-linejoin="round"><path d="m4 28 28-24 28 24M12 25V59H52V25M26 58V37H39V58"/></g>',
'case':'<g fill="none" stroke="url(#ivory)" stroke-width="4" stroke-linejoin="round"><path d="M6 23H58V57H6ZM22 23V12H42V23M7 36H57M27 32H37V42H27Z"/></g>',
'more':'<g><circle cx="8" cy="14" r="3"/><circle cx="8" cy="32" r="3"/><circle cx="8" cy="50" r="3"/><path d="M19 11H59V17H19ZM19 29H59V35H19ZM19 47H59V53H19Z"/></g>',
'menu':'<path d="M9 13H55V19H9ZM9 29H55V35H9ZM9 45H55V51H9Z"/>',
'back':'<path d="m27 9 4 4-16 16H60V35H15L31 51l-4 4L4 32Z"/>',
'chevron-down':'<path d="m9 22 5-5 18 18 18-18 5 5-23 23Z"/>',
'chevron-right':'<path d="m22 9 5-5 23 28-23 28-5-5 18-23Z"/>',
'expand':'<path d="M36 5H59V28H53V15L37 31 33 27 49 11H36ZM28 59H5V36H11V49L27 33 31 37 15 53H28Z"/>',
'close':'<path d="m13 8 19 19 19-19 5 5-19 19 19 19-5 5-19-19-19 19-5-5 19-19L8 13Z"/>',
'lock':'<path fill-rule="evenodd" d="M13 26H51V59H13ZM19 26V16a13 13 0 0 1 26 0v10H39V16a7 7 0 0 0-14 0V26ZM29 40v10h6V40Z"/>',
'filter':'<path d="M3 11H61V17H3ZM3 29H61V35H3ZM3 47H61V53H3Z"/><rect x="14" y="5" width="9" height="18" rx="2"/><rect x="40" y="23" width="9" height="18" rx="2"/><rect x="23" y="41" width="9" height="18" rx="2"/>',
'search':'<g fill="none" stroke="url(#ivory)" stroke-width="6"><circle cx="26" cy="26" r="18"/><path d="m40 40 19 19"/></g>',
'favorite':'<path d="m32 3 8 19 21 2-16 14 5 22-18-11-18 11 5-22L3 24l21-2Z"/>'}
for name,body in shapes.items():
 svg(f'icons/{name}.svg',f'<defs><linearGradient id="ivory" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#fff2cf"/><stop offset=".45" stop-color="#eace8f"/><stop offset="1" stop-color="#b58c40"/></linearGradient></defs><g fill="url(#ivory)">{body}</g>')
svg('ornaments/corner.svg',f'<defs>{metal}</defs>'+corner(2,2,0),40,40)
svg('ornaments/divider.svg',f'<defs>{metal}</defs><path d="M0 10H180M220 10H400M187 10l13-6 13 6-13 6Z" fill="none" stroke="url(#gold)" stroke-width="1"/><path d="m197 10 3-3 3 3-3 3Z" fill="#e8c679"/>',400,20)
svg('ornaments/slate.svg','<defs><radialGradient id="s" cx=".2" cy="0" r="1"><stop stop-color="#102d3b"/><stop offset=".65" stop-color="#041823"/><stop offset="1" stop-color="#071923"/></radialGradient></defs><rect width="512" height="512" fill="url(#s)"/>',512,512)
for name,top,bottom in [('energy','#7be9a4','#32b875'),('affection','#ffa49a','#ee6c68'),('hearts','#ffe68b','#edb640'),('experience','#f8d87e','#c49a40')]:
 svg(f'meters/{name}-fill.svg',f'<defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs><rect x="0" y="0" width="240" height="16" rx="8" fill="url(#f)"/>',240,16)
svg('meters/track.svg','<rect x="1" y="1" width="238" height="14" rx="7" fill="#273743" stroke="#a59067" stroke-width="1"/><path d="M10 3H230" stroke="#fff1c3" stroke-opacity=".1"/>',240,16)
tokens={'colors':{'navy':'#041823','slate':'#102d3b','ivory':'#fff2d4','gold':'#d5ad61','emerald':'#08675b','heart':'#ef7371'},'fonts':{'family':'OverviewA Tinos','regular':'../forge-slate-v2/fonts/Tinos-Regular.woff','bold':'../forge-slate-v2/fonts/Tinos-Bold.woff'},'type':{'titleDesktop':42,'titlePhone':29,'sectionDesktop':34,'bodyDesktop':20,'secondaryDesktop':18,'tabDesktop':18,'phoneBody':15},'nineSlice':{'ornate':{'slice':40,'renderedBorder':24},'simple':{'slice':16,'renderedBorder':8}},'iconSizes':[20,24,32,40,48,64],'reference':'Image 2: image(20261017-210340).png','scope':'Asset kit and read-only assembly; not a live gameplay capture.'}
(R/'tokens.json').write_text(json.dumps(tokens,indent=2))
(R/'icon-map.json').write_text(json.dumps({'nav':{'Overview':'overview','Stats & Growth':'growth','Work Skills':'work','Talents':'talents','Lineage':'lineage','Inventory':'inventory','Equipment':'equipment','Care':'care'},'records':{'Identity':'identity','Health & protection':'health','Lineage':'lineage','Role strengths':'roles'},'actions':{'Choose creature':'creatures','Profile & Care':'profile','Habitat':'habitat','Inventory':'case','More overview':'more','Previous screen':'back','Menu':'menu','Expand artwork':'expand'}},indent=2))
print('Generated',len(list(R.rglob('*.svg'))),'scalable assets')
