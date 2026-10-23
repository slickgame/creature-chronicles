import {mkdirSync,readFileSync,writeFileSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='public/images/ui/nursery-scenic-a/polish-v1';
for(const p of ['surfaces','symbols','effects','source','references'])mkdirSync(`${root}/${p}`,{recursive:true});
const reused={window:'window',panel:'panel',portrait:'portrait',field:'field',button:'button','button-hover':'hover','button-primary':'primary','button-disabled':'disabled','card-selected':'selected',divider:'divider',timer:'timer'};
for(const [name,source]of Object.entries(reused))copyFileSync(`public/images/ui/day-cycle-v1/${source}.svg`,`${root}/surfaces/${name}.svg`);
writeFileSync(`${root}/surfaces/card-selected.svg`,readFileSync('public/images/ui/day-cycle-v1/panel.svg','utf8').replace('stroke="url(#gold)"','stroke="#55ce91"'));
const svg=(body,size=64)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none"><defs><linearGradient id="gold" x2=".5" y2="1"><stop stop-color="#fff3c0"/><stop offset=".45" stop-color="#d6a54c"/><stop offset=".7" stop-color="#fff0bb"/><stop offset="1" stop-color="#9e682b"/></linearGradient></defs>${body}</svg>`;
const icons={
 'selection-medallion':svg('<circle cx="32" cy="32" r="27" fill="#041d2c" stroke="#35210b" stroke-width="6"/><circle cx="32" cy="32" r="27" stroke="url(#gold)" stroke-width="3"/><path d="m18 32 9 10 19-21" stroke="url(#gold)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'),
 'status-recorded':svg('<circle cx="32" cy="32" r="25" fill="#143d32" stroke="#a7cf9b" stroke-width="2"/><path d="m19 32 9 10 18-21" stroke="#c5e4ae" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
 'information':svg('<circle cx="32" cy="32" r="25" fill="#062132" stroke="url(#gold)" stroke-width="2"/><path d="M32 29v16" stroke="#f5e6bc" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="20" r="2.6" fill="#f5e6bc"/>'),
 'previous':svg('<circle cx="32" cy="32" r="28" fill="#061f2e" stroke="url(#gold)" stroke-width="2"/><path d="m37 20-12 12 12 12" stroke="#f8edcd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
 'next':svg('<circle cx="32" cy="32" r="28" fill="#061f2e" stroke="url(#gold)" stroke-width="2"/><path d="m27 20 12 12-12 12" stroke="#f8edcd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
 'skip':svg('<path d="m17 17 22 15-22 15V17Z" fill="#f6e6be"/><path d="M46 18v28" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>'),
 'close':svg('<path d="m20 20 24 24m0-24L20 44" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>'),
 'incubation':svg('<path d="M20 12h24M20 52h24M23 12c0 12 0 12 9 20-9 8-9 8-9 20m18-40c0 12 0 12-9 20 9 8 9 8 9 20" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/><path d="m27 46 5-7 5 7Z" fill="#f1dca1"/>'),
};
for(const [name,body]of Object.entries(icons))writeFileSync(`${root}/symbols/${name}.svg`,body);
const cracks='M32 9 30 15 31 18 28 22 33 28 31 31 34 34 28 39 30 44 29 48 32 53 30 58M33 28 38 27 41 24 46 25 49 22M28 39 24 37 22 33 18 34 15 31M30 44 35 43 38 39 42 40M31 18 35 16 36 13';
writeFileSync(`${root}/effects/cracks.svg`,svg(`<path d="${cracks}" stroke="#48200e" stroke-width="1.8" stroke-linejoin="miter"/><path d="${cracks}" stroke="#eda83c" stroke-width="1.05" stroke-linejoin="miter"/><path d="${cracks}" stroke="#fff7df" stroke-width=".45" stroke-linejoin="miter"/>`));
if(!process.argv[2])throw Error('Pass the original hatch halo PNG');
copyFileSync(process.argv[2],`${root}/source/hatch-halo.png`);
const halo=sharp(process.argv[2]);const metadata=await halo.metadata();if(!metadata.hasAlpha)throw Error('Halo must have alpha');
const stats=await halo.stats();if(stats.channels[3].min!==0||stats.channels[3].max<128)throw Error('Expected transparent edges and visible halo pixels');
await halo.resize({width:800,withoutEnlargement:true}).webp({quality:94,alphaQuality:100}).toFile(`${root}/effects/hatch-halo.webp`);
if(!existsSync(`${root}/references/approved-layout.png`))copyFileSync('../upload/5205c691-8fb8-479d-89b7-e50c3fed74b6.png',`${root}/references/approved-layout.png`);
if(!existsSync(`${root}/references/approved-windows.png`))copyFileSync('../upload/ff1b2c7f-2a60-4ce3-a56e-41f30f87b797.png',`${root}/references/approved-windows.png`);
const css=`/* Standalone kit; import explicitly during runtime integration. */
.nursery-polish{--np-root:url('./surfaces/panel.svg');--np-gold:#d5b36b;--np-ink:#f5e7c5;color:var(--np-ink);font-family:Georgia,serif}
.np-panel{border:18px solid transparent;border-image:url('./surfaces/panel.svg') 44 fill / 18px / 0 stretch;background:#061d2c;padding:12px}
.np-button{color:inherit;font:inherit;border:7px solid transparent;border-image:url('./surfaces/button.svg') 16 fill / 7px / 0 stretch;background:#061d2c;padding:8px 16px;min-height:44px;cursor:pointer}
.np-button:hover{border-image-source:url('./surfaces/button-hover.svg')}.np-button:focus-visible{outline:2px solid #fff0b9;outline-offset:3px}
.np-button.primary{border-image-source:url('./surfaces/button-primary.svg')}.np-button:disabled{border-image-source:url('./surfaces/button-disabled.svg');color:#a4a9a7;cursor:default}
.np-card{position:relative;display:grid;gap:8px;text-align:center;align-content:start;min-width:0}.np-card[aria-pressed=true]{border-image-source:url('./surfaces/card-selected.svg');box-shadow:0 0 12px #58bd7e66}.np-selected{position:absolute;right:0;top:0;width:32px;height:32px}
.np-progress{height:10px;border:1px solid var(--np-gold);border-radius:99px;background:#03131f;padding:2px;box-shadow:inset 0 1px 3px #000}.np-progress>span{display:block;height:100%;border-radius:99px;background:linear-gradient(#7ddca3,#0c8a60);max-width:100%}
.np-stage{position:relative;isolation:isolate}.np-halo{position:absolute;inset:-9%;width:118%;height:118%;object-fit:contain;opacity:.28;pointer-events:none;z-index:0}.np-egg{position:relative;z-index:1;width:100%;height:100%;object-fit:contain}.np-cracks{position:absolute;inset:0;z-index:2;background:center/contain no-repeat url('./effects/cracks.svg');mask:var(--egg-mask) center/contain no-repeat;pointer-events:none;opacity:.9}
.np-hatching .np-halo{animation:np-glow 1.1s ease-in-out both}.np-hatching .np-cracks{animation:np-crack 1.1s ease-in both}.np-egg-enter{animation:np-enter .16s ease-out both}
@keyframes np-glow{0%{opacity:0;transform:scale(.95)}60%{opacity:.38}100%{opacity:0;transform:scale(1.04)}}@keyframes np-crack{0%,35%{opacity:0}75%{opacity:.95}100%{opacity:0}}@keyframes np-enter{from{opacity:.35}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.np-hatching .np-halo,.np-hatching .np-cracks{display:none}.np-egg-enter{animation:none}}
`;
writeFileSync(`${root}/nursery-polish.css`,css);
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
const all=files(root).filter(p=>!p.endsWith('manifest.json'));writeFileSync(`${root}/manifest.json`,JSON.stringify({version:1,runtimeIntegrated:true,haloPrompt:'Transparent warm gold oval hatch halo; open center, restrained particles; no egg, cradle, text or background.',assets:all.map(path=>({path:path.slice(root.length+1),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})),reusedFrom:'day-cycle-v1 native SVG family; no new font or creature artwork'},null,2));
console.log(`Prepared ${all.length} assets and references; halo alpha verified.`);
