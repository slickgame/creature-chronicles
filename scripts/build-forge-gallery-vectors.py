"""Editable, text-free Forge A surfaces and icons; existing C2 stroke language."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/images/ui/forge-gallery-v1'
(root/'frames').mkdir(parents=True,exist_ok=True);(root/'icons').mkdir(exist_ok=True)

def panel(name,colors=('#fff8e8','#f0dfb8'),stroke='#ae894a',w=600,h=360,leaf=False):
    flourish=''
    if leaf:
        # Tiny original botanical vector strokes; painted ornament remains a separate image.
        for x,y,rotate in [(10,10,0),(w-10,10,90),(w-10,h-10,180),(10,h-10,270)]:
            flourish+=f'<g transform="translate({x} {y}) rotate({rotate})" fill="none" stroke="#a38039" stroke-width="1.4"><path d="M0 45Q0 0 45 0 M4 26Q23 9 26 4"/><path d="M4 24Q-1 10 11 6Q16 21 4 24M21 5Q21 -4 34 1Q29 12 21 5" fill="#a6ac70"/></g>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none"><defs><linearGradient id="p" x2="0" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient></defs><path d="M10 2H{w-10}L{w-2} 10V{h-10}L{w-10} {h-2}H10L2 {h-10}V10Z" fill="url(#p)" stroke="{stroke}" stroke-width="2"/><path d="M14 8H{w-14}L{w-8} 14V{h-14}L{w-14} {h-8}H14L8 {h-14}V14Z" fill="none" stroke="{stroke}" opacity=".55"/>{flourish}</svg>'
    (root/'frames'/f'{name}.svg').write_text(svg)

for name in ['gallery-frame','detail-frame','dialog-frame','receipt-frame','source-frame','dialogue-frame']:
    panel(name,leaf=True)
for name,colors,stroke in [
 ('recipe-card',('#fff9eb','#f4e6ca'),'#b18e55'),('recipe-card-hover',('#fffceb','#f6e6b8'),'#947136'),
 ('recipe-card-selected',('#f1f4d6','#e8ecc7'),'#3d7049'),('recipe-card-unavailable',('#eeeadf','#e3ddce'),'#9e9581'),
 ('title-plate',('#426b45','#2d5138'),'#d6b773'),('host-plaque',('#fff7e6','#ead6ab'),'#b18d4f'),
 ('material-row',('#fff7e4','#f1e3c3'),'#c2a46c'),('material-row-warning',('#fff0d5','#f5dcc1'),'#b97a4f'),
 ('cost-row',('#faedcf','#edddb7'),'#ba9757'),('stat-row',('#fbefd2','#f1dfb7'),'#b89859'),
 ('substat-row',('#fff9ec','#f5ebd5'),'#c3ac7b'),('field',('#fff9eb','#fbf1dd'),'#ac8a52'),
 ('tooltip',('#fff9eb','#f2e5cb'),'#a68955'),('stock-row',('#fff8e9','#f2e7ce'),'#baa273'),
 ('success-panel',('#f1f4d9','#e5edce'),'#88a078'),('warning-panel',('#fff0d7','#f3dfc2'),'#ba8153'),
 ('notice-panel',('#f6f0e0','#e9e2cd'),'#a59b77'),('source-tile',('#fff9ec','#f0e3c6'),'#b49b66'),
 ('toast',('#eef3db','#dce8c6'),'#6f8d61'),('pager',('#faf0d8','#ecdfbc'),'#b39760')]:
    panel(name,colors,stroke,w=600,h=600 if name.startswith("recipe-card") else 120)
for name,colors,stroke in [
 ('button-primary',('#557e4d','#31583b'),'#d9bd7c'),('button-primary-hover',('#648e59','#3b6745'),'#f1d49a'),
 ('button-primary-pressed',('#2c5135','#42643d'),'#bda068'),('button-primary-disabled',('#939c83','#788573'),'#bdba9d'),
 ('button-secondary',('#fff9e9','#eddfbd'),'#af8b50'),('button-secondary-hover',('#fffcee','#f6e4b7'),'#96713d'),
 ('button-secondary-pressed',('#e4d0a5','#f0e0bc'),'#96713d'),('button-secondary-disabled',('#e7e0cf','#d9d2c3'),'#aaa18a'),
 ('tab',('#fff9ea','#eddfbe'),'#ae8d56'),('tab-active',('#54774b','#31583b'),'#ceb27c'),('tab-disabled',('#e8e2d4','#d8d1c1'),'#a89d86'),
 ('badge-common',('#edf0dc','#e4e9d1'),'#9aa981'),('badge-uncommon',('#e1edd8','#d5e6c9'),'#6e9462'),
 ('badge-rare',('#e2edf8','#cfdfed'),'#6d96ba'),('badge-heroic',('#efe4f7','#e2d4ef'),'#9b7abb'),
 ('badge-legendary',('#fff0b7','#efd68c'),'#ad8532'),('reserved-pill',('#ede9d8','#ded8bd'),'#a09672')]:
    panel(name,colors,stroke,w=300,h=70)
(root/'frames/divider.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 20" preserveAspectRatio="none"><path d="M2 10H270M330 10H598M285 10l15-7 15 7-15 7Z" fill="none" stroke="#b69a59" stroke-width="1.5"/><path d="M295 10q-12-10-16-4q4 10 16 4m10 0q12-10 16-4q-4 10-16 4" fill="#8c9b60"/></svg>')
icons={
 'recipes':'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
 'forge':'M3 10h18l-4 4h-3v5h3v2H7v-2h3v-5H7zM4 4l5 3m2-5 3 4',
 'craft':'m5 4 4-2 9 9-4 4-9-9zM13 13l-8 8m0-3-3 3',
 'output':'m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',
 'materials':'m3 15 4-7h10l4 7-4 4H7zM7 8l4 7-4 4M11 15h10',
 'labor':'M4 11h16l-4 4h-3v5H9v-5H7zM8 3l7 5m-3-6 4 4',
 'coin':'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM15 7h-5a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9M12 5v14',
 'compare':'M3 7h18M6 4v3l-4 8h8L6 7M18 7l-4 8h8l-4-8M12 7v13M8 21h8',
 'source':'M5 21V9l7-6 7 6v12M2 10l10-8 10 8M9 21v-7h6v7',
 'check':'m4 12 5 5L20 6', 'close':'m5 5 14 14M5 19 19 5', 'back':'m15 4-8 8 8 8', 'next':'m9 4 8 8-8 8',
 'collapse':'m5 15 7-7 7 7','expand':'m5 9 7 7 7-7','menu':'M4 6h16M4 12h16M4 18h16',
 'talk':'M3 4h18v12H9l-5 5v-5H3zM7 8h10M7 12h7', 'upgrade':'m5 11 7-8 7 8h-4v10H9V11z',
 'inventory':'M4 8h16v13H4zM3 3h18v5H3zM9 12h6', 'lock':'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v3',
 'info':'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 10v7M12 6v1',
 'warning':'m12 3 10 18H2zM12 9v5M12 17v1', 'search':'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM15 15l6 6',
 'filter':'M3 4h18l-7 8v7l-4 2v-9z', 'sort':'M5 3v18m-3-3 3 3 3-3M11 5h10M11 10h7M11 15h4',
 'minus':'M4 12h16','plus':'M4 12h16M12 4v16', 'weapon':'m5 3 14 14-2 2L3 5zM13 18l5-5M17 19l3 3',
 'armor':'m7 3 5 3 5-3 5 5-4 3v10H6V11L2 8z', 'head':'M4 14a8 8 0 0 1 16 0v6H4zM4 15h16M9 14V6M15 14V6',
 'hands':'M6 21 3 12l3-1 2 4V5h3v6-8h3v8-6h3v8-5h3v11l-3 3z',
 'accessory':'M6 3l6 8 6-8M12 11l6 5-6 6-6-6z', 'accuracy':'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM12 1v4M12 19v4M1 12h4M19 12h4',
 'shield':'m12 2 8 4v7c0 4-8 9-8 9s-8-5-8-9V6z', 'spark':'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z'
}
for name,d in icons.items():
    (root/'icons'/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#60401f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="{d}"/></svg>')
print(f'{len(list((root/"frames").glob("*.svg")))} surfaces, {len(icons)} icons')
