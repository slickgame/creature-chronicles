import {getBreedingParticipants} from '@/data/breeding';
import {getTalentInheritanceOdds} from '@/data/genetics';
import {getBattleMoveInheritancePreview} from '@/data/battleMoveInheritance';
import type {BreedingParticipant,BreedingRole} from '@/types/breeding';
import type {GameSave} from '@/types/save';

/** Same role/availability checks as the original selector, with a visible reason. */
export function getBreedingSelectionBlocker(participant:BreedingParticipant|undefined,role:BreedingRole,oppositeId:string|null):string|null{
 if(!participant)return 'No candidate matches these filters.';
 if(participant.participantId===oppositeId)return 'Already selected in the other role. Choose a different participant.';
 if(!participant.roleTags.includes(role))return `This participant cannot take the ${role} role.`;
 if(!participant.canBreed)return participant.unavailableReason||'This participant is currently unavailable.';
 return null;
}
/** Reads existing probability helpers only; never samples or saves offspring rolls. */
export function getBreedingInheritancePreview(save:GameSave,giverId:string|null,receiverId:string|null){
 const participants=getBreedingParticipants(save),giver=participants.find(p=>p.participantId===giverId),receiver=participants.find(p=>p.participantId===receiverId);
 const valid=Boolean(giver&&receiver&&giver.kind==='creature'&&receiver.kind==='creature'&&giverId!==receiverId);
 return {giver,receiver,valid,odds:valid&&giver&&receiver?getTalentInheritanceOdds(save,giver,receiver):null,moves:getBattleMoveInheritancePreview(save,giverId,receiverId)};
}
