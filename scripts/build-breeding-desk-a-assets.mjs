import {mkdirSync,readFileSync,writeFileSync,copyFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='public/images/ui/breeding-desk-a';
for(const dir of ['surfaces','icons','art','fonts','references'])mkdirSync(root+'/'+dir,{recursive:true});
const reuse={panel:'panel',window:'window',button:'button','button-hover':'hover','button-primary':'primary','button-disabled':'disabled',field:'field',divider:'divider',portrait:'portrait'};
for(const[name,file]of Object.entries(reuse))copyFileSync(`public/images/ui/day-cycle-v1/${file}.svg`,`${root}/surfaces/${name}.svg`);
const panel=readFileSync(`${root}/surfaces/panel.svg`,'utf8');
writeFileSync(`${root}/surfaces/nameplate.svg`,panel.replaceAll('#0e2b3b','#fff0c7').replaceAll('#061d2c','#efddb2').replaceAll('#03121e','#d7bd86'));
writeFileSync(`${root}/surfaces/empty-slot.svg`,panel.replace('fill="url(#navy)"','fill="url(#navy)" fill-opacity=".66"'));
writeFileSync(`${root}/surfaces/slot-selected.svg`,panel.replace('stroke="url(#gold)"','stroke="#66d49c"'));
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gold" x2=".5" y2="1"><stop stop-color="#fff1ba"/><stop offset=".4" stop-color="#d9a74f"/><stop offset=".7" stop-color="#ffebba"/><stop offset="1" stop-color="#a56e2e"/></linearGradient></defs>${body}</svg>`;
const ring='<circle cx="32" cy="32" r="27" fill="#062130" stroke="#35210e" stroke-width="6"/><circle cx="32" cy="32" r="27" stroke="url(#gold)" stroke-width="2.5"/>';
const symbols={choose:svg(ring+'<path d="M32 18v28M18 32h28" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>'),back:svg('<path d="M53 32H12m15-15L12 32l15 15" stroke="url(#gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),inspect:svg('<circle cx="27" cy="27" r="17" stroke="url(#gold)" stroke-width="3"/><path d="m40 40 13 13" stroke="url(#gold)" stroke-width="5" stroke-linecap="round"/>'),options:svg('<path d="m27 7 10 0 2 8 7 4 8-2 5 9-6 6v8l6 6-5 9-8-2-7 4-2 7H27l-2-7-7-4-8 2-5-9 6-6v-8l-6-6 5-9 8 2 7-4Z" transform="translate(0 -3) scale(1 .95)" fill="#0a2735" stroke="url(#gold)" stroke-width="2"/><circle cx="32" cy="32" r="10" stroke="url(#gold)" stroke-width="3"/>'),information:svg(ring+'<circle cx="32" cy="20" r="2.5" fill="#fff0be"/><path d="M32 29v16" stroke="#fff0be" stroke-width="4" stroke-linecap="round"/>'),close:svg('<path d="m19 19 26 26m0-26L19 45" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>'),selected:svg(ring+'<path d="m18 32 10 10 18-21" stroke="url(#gold)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')};
for(const[name,source]of Object.entries(symbols))writeFileSync(`${root}/icons/${name}.svg`,source);
for(const name of ['heart','energy'])copyFileSync(`public/images/ui/creature-overview-a-v2/sculpted/${name}.webp`,`${root}/icons/${name}.webp`);
for(const[name,source]of Object.entries({support:'inventory',inheritance:'lineage'}))copyFileSync(`public/images/ui/creature-overview-a-v2/painted-r4/${source}.webp`,`${root}/icons/${name}.webp`);
copyFileSync('public/images/ui/ranch-house-a/menu.svg',root+'/icons/menu.svg');
for(const[name,path]of Object.entries({pavilion:'public/images/ui/interiors-v1/breeding.webp',wood:'public/images/ui/ranch-v2/wood.webp',parchment:'public/images/ui/ranch-v2/parchment.webp'}))copyFileSync(path,`${root}/art/${name}.webp`);
const canonical={canine:'public/images/creatures/canine/daisy/daisy_01.webp',feline:'public/images/creatures/feline/nyla/nyla_01_full_body.png'};
for(const[name,path]of Object.entries(canonical)){const data=execFileSync('git',['show','HEAD:'+path],{maxBuffer:16*1024*1024});const ext=path.endsWith('.png')?'png':'webp';writeFileSync(`${root}/art/${name}-profile.${ext}`,data);if(!(await sharp(data).metadata()).hasAlpha)throw Error(name+' must retain alpha');}
for(const name of ['Tinos-Regular.woff','Tinos-Bold.woff','OFL.txt'])copyFileSync('public/images/ui/forge-slate-v2/fonts/'+name,root+'/fonts/'+name);
if(process.argv[2])copyFileSync(process.argv[2],root+'/references/approved-a.png');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):[dir+'/'+e.name]);}
const list=files(root).filter(p=>!p.endsWith('manifest.json'));writeFileSync(root+'/manifest.json',JSON.stringify({runtimeIntegrated:true,approvedDirection:'A, full-body profiles, persistent Back, empty/partial/selected states',canonicalArt:canonical,provenance:'Native vector derivatives extend day-cycle-v1; existing painted/sculpted icons and canonical scenery/art reused unchanged. No replacement characters or paid service.',assets:list.map(path=>({path:path.slice(root.length+1),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}))},null,2));
console.log('Prepared '+list.length+' assets, preview sources and references.');

// Apply the approved concept-fidelity finish after preparing the base kit.
await import('./build-breeding-desk-fidelity.mjs');
