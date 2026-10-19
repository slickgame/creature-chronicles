from pathlib import Path
root=Path('public/images/ui/creature-profile-a');root.mkdir(parents=True,exist_ok=True)
for dest,source in [('window','window-ornate'),('button','secondary-ornate'),('primary','primary-ornate')]:
 text=Path(f'public/images/ui/creature-removal-c/{source}.svg').read_text()
 if dest=='primary':text=text.replace('stroke="url(#gold)" stroke-width="2.4"','stroke="#8beac0" stroke-width="2.4"',1)
 (root/f'{dest}.svg').write_text(text)
card=Path('public/images/ui/roster-filters-c/panel.svg').read_text().replace('#031b27','#031725')
(root/'vital.svg').write_text(card)
(root/'heart-empty.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 28C11 23 3 18 3 10 3 2 13 1 16 8 19 1 29 2 29 10 29 18 21 23 16 28Z" fill="#071b27" stroke="#c5a56c" stroke-width="1.5"/></svg>')
