import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {getGameplayArtSet,getCreatureCombatArt} from '@/data/baseGameplayArt';
import {gameplayArt} from '@/data/creatureGameplayArt';
import {normalizeApprovedCreaturePortraits} from '@/data/approvedCreaturePortraits';
import {getVariantDefinition} from '@/data/creatures';
import {createNewGameSave} from '@/lib/save/localSave';
const variants=['variant_base_feline','variant_horse','variant_base_canine','variant_bunny'] as const;
const idle={fainted:false,actor:false,target:false,specialAttack:false};
const identity=(variantId:string)=>({variantId} as Parameters<typeof getGameplayArtSet>[0]);
test('four common species have complete independent battle poses, with KO and hit priority',()=>{
 for(const variant of variants){const c=identity(variant),art=getGameplayArtSet(c)!;assert.ok(art);assert.equal(new Set([art.combatIdle,art.combatBasic,art.combatSpecial,art.combatGuard,art.combatHit,art.combatKO]).size,6);
  assert.equal(getCreatureCombatArt(c,idle),art.combatIdle);
  assert.equal(getCreatureCombatArt(c,{...idle,actor:true,eventKind:'attack'}),art.combatBasic);
  assert.equal(getCreatureCombatArt(c,{...idle,actor:true,eventKind:'attack',specialAttack:true}),art.combatSpecial);
  assert.equal(getCreatureCombatArt(c,{...idle,actor:true,effectPreset:'shield'}),art.combatGuard);
  assert.equal(getCreatureCombatArt(c,{...idle,target:true,eventKind:'damage',actor:true}),art.combatHit);
  assert.equal(getCreatureCombatArt(c,{...idle,target:true,eventKind:'knockout'}),art.combatKO);
  assert.equal(getCreatureCombatArt(c,{...idle,fainted:true,target:true,eventKind:'damage'}),art.combatKO);
  assert.equal(gameplayArt(c!),art.profile);assert.equal(gameplayArt(c!,true),art.card);
 }
 for(const variant of ['variant_hellhound','variant_direwolf','variant_antlerhare','variant_dream_lop','variant_unicorn','variant_sphinx']){const c=identity(variant);assert.equal(getGameplayArtSet(c),null);assert.equal(getCreatureCombatArt(c,idle),null);assert.equal(gameplayArt(c!),getVariantDefinition(variant as never).profilePath);}
});
test('twenty optimized canine/lapine assets exist and match their approved source manifest',async()=>{
 const root=new URL('../',import.meta.url);const manifest=JSON.parse(await readFile(new URL('docs/CANINE_LAPINE_ART_MANIFEST_2026-10-15.json',root),'utf8'));
 assert.equal(manifest.length,20);const {createHash}=await import('node:crypto');
 for(const row of manifest){await access(new URL('public'+row.path,root));const bytes=await readFile(new URL('public'+row.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),row.webpSha256);assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.match(row.url,/drive.google.com/);}
});
test('obsolete saved canine/lapine URLs migrate in snapshots without changing scenes or custom art',async()=>{
 const s=createNewGameSave('Art',0);s.flags.artArchive=JSON.stringify({old:'/images/creatures/canine/base_canine_portrait.png'}); // opaque strings are intentionally not rewritten
 const snapshot={...s,creatures:[{...s.creatures[0],portraitPath:'/images/creatures/canine/base_canine_portrait.png',profilePath:'/images/creatures/lapine/bunny_profile.png'}]};
 const migrated=normalizeApprovedCreaturePortraits(snapshot);assert.equal(migrated.creatures[0].portraitPath,getGameplayArtSet(identity('variant_base_canine'))!.card);assert.equal(migrated.creatures[0].profilePath,getGameplayArtSet(identity('variant_bunny'))!.profile);assert.equal(migrated.flags.artArchive,s.flags.artArchive);assert.deepEqual(normalizeApprovedCreaturePortraits(migrated),migrated);
 assert.equal(snapshot.creatures[0].portraitPath,'/images/creatures/canine/base_canine_portrait.png');
 const text=await readFile(new URL('../src/data/breedingSceneImages.ts',import.meta.url),'utf8');assert.doesNotMatch(text,/daisy_\d|lapine_\d/);
});
