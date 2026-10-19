from pathlib import Path
root=Path('public/images/ui/habitat-a');root.mkdir(parents=True,exist_ok=True)
for dest,source in [('window','window-ornate'),('button','secondary-ornate'),('primary','primary-ornate')]:
    text=Path(f'public/images/ui/creature-removal-c/{source}.svg').read_text()
    if dest=='primary':text=text.replace('stroke="url(#gold)" stroke-width="2.4"','stroke="#8beac0" stroke-width="2.4"',1)
    (root/f'{dest}.svg').write_text(text)
(root/'panel.svg').write_text(Path('public/images/ui/roster-filters-c/panel.svg').read_text().replace('#031b27','#031725'))
(root/'heart-empty.svg').write_text(Path('public/images/ui/creature-profile-a/heart-empty.svg').read_text())
(root/'resident-selected.svg').write_text((root/'primary.svg').read_text())
# Buttons use a shallow native master and a 16-unit slice for a crisp 1px double rim.
for name,face in [('button','#062130'),('primary','#006052'),('resident-selected','#00463d')]:
    (root/f'{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><defs><linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#ffedb0"/><stop offset=".3" stop-color="#d2a04e"/><stop offset=".6" stop-color="#8c6028"/><stop offset="1" stop-color="#f3d48b"/></linearGradient><linearGradient id="face" x2="0" y2="1"><stop stop-color="{face}"/><stop offset="1" stop-color="{'#00352f' if name!='button' else '#031522'}"/></linearGradient></defs><path d="M10 3H310L317 10V70L310 77H10L3 70V10Z" fill="url(#face)" stroke="#312413" stroke-width="5"/><path d="M10 3H310L317 10V70L310 77H10L3 70V10Z" fill="none" stroke="url(#gold)" stroke-width="2"/><path d="M11 7H309L313 11V69L309 73H11L7 69V11Z" fill="none" stroke="{'#8ce6b7' if name!='button' else '#d9b978'}" stroke-opacity=".65"/><g stroke="#f4d892" fill="none"><path d="M3 18V10L10 3H18M302 3H310L317 10V18M317 62V70L310 77H302M18 77H10L3 70V62" stroke-width="1.5"/></g></svg>''')
