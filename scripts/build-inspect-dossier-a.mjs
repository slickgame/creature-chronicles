import {mkdirSync,writeFileSync} from 'node:fs';
const dir='public/images/ui/inspect-dossier-a';mkdirSync(dir+'/icons',{recursive:true});
const shapes={
 overview:'<circle cx="32" cy="19" r="10"/><path d="M12 55v-9c0-12 8-17 20-17s20 5 20 17v9Z"/>',
 stats:'<path d="M10 35h10v21H10zm17-17h10v38H27zm17-11h10v49H44Z"/>',
 work:'<path d="m9 48 25-25 8 8-25 25Z"/><path d="m23 14 10-10 23 23-10 10Z"/><path d="m12 13 5-5 10 10-5 5Z"/>',
 talents:'<path d="m32 4 8 18 20 2-15 14 4 21-17-11-18 11 5-21L4 24l20-2Z"/>',
 lineage:'<rect x="24" y="5" width="16" height="14" rx="4"/><rect x="3" y="43" width="16" height="14" rx="4"/><rect x="45" y="43" width="16" height="14" rx="4"/><path d="M29 17h6v11h19v17h-6V34H16v11h-6V28h19Z"/>',
 shield:'<path d="M32 4 55 14v17c0 15-10 24-23 30C19 55 9 46 9 31V14Zm0 8v40c9-5 15-12 15-22V19Z"/>',
 heart:'<path fill="#dd6268" d="M32 56 8 33C-9 14 17-4 32 15 47-4 73 14 56 33Z"/>',
 affection:'<path fill="#ee73b7" d="M32 56 8 33C-9 14 17-4 32 15 47-4 73 14 56 33Z"/><path fill="#913065" d="m32 45-17-17c-9-10 4-19 12-10l5 6 5-6c8-9 21 0 12 10Z"/>',
 paw:'<ellipse cx="32" cy="44" rx="16" ry="13"/><ellipse cx="10" cy="27" rx="7" ry="10" transform="rotate(-25 10 27)"/><ellipse cx="25" cy="15" rx="7" ry="10"/><ellipse cx="42" cy="15" rx="7" ry="10"/><ellipse cx="56" cy="29" rx="7" ry="10" transform="rotate(25 56 29)"/>',
 pickaxe:'<path d="m11 52 32-35 7 6-32 35Z"/><path d="M5 17Q29-5 59 20L48 25Q31 11 5 17Z"/>',
 mug:'<path d="M10 12h33v39H10Z"/><path fill="none" stroke="url(#metal)" stroke-width="7" d="M44 20h7c14 0 14 21 0 21h-7"/>',
 leaf:'<path fill="#88aa6b" d="M57 5Q7 3 7 35q1 21 22 20Q55 47 57 5Z"/><path fill="none" stroke="#7d5c23" stroke-width="3" d="m12 51 35-35M28 35l-3-14m15 2 10-2"/>',
 lock:'<path d="M11 27h42v30H11Z"/><path fill="none" stroke="url(#metal)" stroke-width="7" d="M20 28V17c0-18 24-18 24 0v11"/><circle cx="32" cy="41" r="5" fill="#173344"/>',
 check:'<path d="m7 31 15 14L56 10l5 8-39 40L2 38Z"/>',
 level:'<path d="m32 5 7 18 20 1-15 13 5 21-17-11-18 11 5-21L4 24l20-1Z"/>',
 egg:'<path d="M51 39c0 27-38 27-38 0C13 22 25 4 32 4s19 18 19 35Z"/>',
 scroll:'<path d="M12 7h39v44c0 10-32 11-32 0V16h-7Zm12 9h21v4H24zm0 10h21v4H24zm0 10h17v4H24Z"/>',
 info:'<circle cx="32" cy="32" r="26" fill="none" stroke="url(#metal)" stroke-width="4"/><circle cx="32" cy="18" r="3"/><path d="M29 27h6v22h-6Z"/>',
};
for(const [name,shape] of Object.entries(shapes))writeFileSync(`${dir}/icons/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="metal" x2=".7" y2="1"><stop stop-color="#fff9dc"/><stop offset=".45" stop-color="#f5d792"/><stop offset="1" stop-color="#b27c30"/></linearGradient></defs><g fill="url(#metal)" stroke="#6c471d" stroke-width=".7" stroke-linejoin="round">${shape}</g></svg>`);
writeFileSync(dir+'/vital.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110" preserveAspectRatio="none"><defs><linearGradient id="n" x2="0" y2="1"><stop stop-color="#123c4b"/><stop offset="1" stop-color="#03121d"/></linearGradient><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#f9e8b5"/><stop offset=".5" stop-color="#88652e"/><stop offset="1" stop-color="#ead596"/></linearGradient></defs><rect x="1" y="1" width="178" height="108" rx="9" fill="url(#n)" stroke="url(#g)" stroke-width="2"/><path d="M9 25V9h21M150 101h21V85" fill="none" stroke="#e8ce8b" stroke-opacity=".3"/></svg>');
console.log('Built',Object.keys(shapes).length,'editable dossier symbols and vital surface.');
