import {writeFileSync,copyFileSync} from 'node:fs';
const dir='public/images/ui/chance-journal-b/';
for(const name of ['cream','emerald','engraved-frame','nameplate'])copyFileSync(`public/images/ui/pair-options-journal-b/fidelity-v3/${name}.svg`,dir+name+'.svg');
const wrap=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
const heart='<path d="M32 54C17 43 6 34 6 21C6 7 24 4 32 18C40 4 58 7 58 21C58 34 47 43 32 54Z"/>';
const icons={
 'heart-ink':`<g fill="#80502d" stroke="#4e2d15" stroke-width="1.5">${heart}</g>`,
 'heart':`<defs><linearGradient id="h" x2=".7" y2="1"><stop stop-color="#f48474"/><stop offset=".5" stop-color="#d24c43"/><stop offset="1" stop-color="#a22f2c"/></linearGradient></defs><g fill="url(#h)" stroke="#79342a" stroke-width="1.5">${heart}</g><path d="M12 22C12 12 24 10 28 20" stroke="#ffd4a5" stroke-width="2" fill="none" opacity=".75"/>`,
 'energy':'<defs><linearGradient id="e" x2=".4" y2="1"><stop stop-color="#ffe17f"/><stop offset="1" stop-color="#d28a29"/></linearGradient></defs><path d="M30 4H51L38 25H55L18 60 26 36H10Z" fill="url(#e)" stroke="#845127" stroke-width="2" stroke-linejoin="round"/>',
 'fertility':'<g stroke="#79502d" stroke-width="4" fill="none" stroke-linecap="round"><path d="M12 4C12 20 52 22 52 38S12 48 12 60M52 4C52 20 12 22 12 38S52 48 52 60"/><path d="M16 10H48M22 20H42M15 32H49M16 45H48M22 54H42" stroke-width="2.6"/></g>',
 'star':'<path d="M32 4L40 23 61 25 45 39 50 59 32 48 14 59 19 39 3 25 24 23Z" fill="#9a6b39" stroke="#5c391c" stroke-width="1.7"/>',
 'dice':'<g stroke="#66401f" stroke-width="2" stroke-linejoin="round"><path d="M9 17L32 5 55 17 32 30Z" fill="#e6c28b"/><path d="M9 17V45L32 59V30Z" fill="#a77a49"/><path d="M32 30L55 17V45L32 59Z" fill="#d8ac70"/></g><g fill="#62401f"><ellipse cx="32" cy="17" rx="3" ry="2"/><ellipse cx="17" cy="29" rx="2.5" ry="3.3"/><ellipse cx="24" cy="44" rx="2.5" ry="3.3"/><ellipse cx="40" cy="34" rx="2.5" ry="3.3"/><ellipse cx="48" cy="29" rx="2.5" ry="3.3"/><ellipse cx="40" cy="46" rx="2.5" ry="3.3"/><ellipse cx="48" cy="42" rx="2.5" ry="3.3"/></g>',
 'ready':'<circle cx="32" cy="32" r="28" fill="#2b6941" stroke="#8a7442" stroke-width="1.5"/><path d="M17 32L27 42 48 20" fill="none" stroke="#f6e8bc" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
 'warning':'<path d="M32 5L61 57H3Z" fill="#d5a35a" stroke="#86562c" stroke-width="2" stroke-linejoin="round"/><path d="M32 21V38" stroke="#553419" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="48" r="3" fill="#553419"/>',
 'cap':'<path d="M8 16H56V23H8Z" fill="#82522d"/><path d="M32 58V30M21 41L32 30 43 41" fill="none" stroke="#82522d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
};
let gear='';for(let i=0;i<12;i++){const a=i*Math.PI/6, b=a+.16;gear+=`${i?'L':'M'}${32+29*Math.cos(a)} ${32+29*Math.sin(a)}L${32+29*Math.cos(b)} ${32+29*Math.sin(b)}L${32+23*Math.cos(b+.08)} ${32+23*Math.sin(b+.08)}L${32+23*Math.cos(a+.38)} ${32+23*Math.sin(a+.38)}`;}icons.effects=`<path d="${gear}Z M32 21A11 11 0 1 0 32 43A11 11 0 1 0 32 21Z" fill="#82522d" fill-rule="evenodd"/>`;
for(const[name,body]of Object.entries(icons))writeFileSync(dir+name+'.svg',wrap(body));
