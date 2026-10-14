import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from "./helpers/establishedSave.ts";
import { normalizeApprovedCreaturePortraits } from '@/data/approvedCreaturePortraits';
import { getVariantDefinition } from '@/data/creatures';
test('old saved card and profile URLs migrate without changing rare art or scene URLs',()=>{
 const s=createNewGameSave('Art migration',0);
 s.creatures![0].portraitPath='/images/creatures/feline/base_feline_portrait.png';
 s.creatures![4].profilePath='/images/creatures/equine/horse_profile.png';
 s.flags.testScene='/images/breeding/feline/scene.png';
 const migrated=normalizeApprovedCreaturePortraits(s);
 assert.equal(migrated.creatures![0].portraitPath,getVariantDefinition(s.creatures![0].variantId).portraitPath);
 assert.equal(migrated.creatures![4].profilePath,getVariantDefinition(s.creatures![4].variantId).profilePath);
 assert.equal(migrated.flags.testScene,s.flags.testScene);
 assert.ok(s.creatures![0].portraitPath.includes('base_feline_portrait'));
 assert.deepEqual(normalizeApprovedCreaturePortraits(migrated),migrated);
 assert.ok(getVariantDefinition('variant_unicorn' as never).portraitPath.includes('unicorn'));
});
