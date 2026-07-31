# Chapter 3 Act II — The Patron Circuit

## Purpose

The Patron Circuit follows the Guild Exhibition by converting public recognition into one permanent town relationship. It connects three existing systems instead of introducing another battle:

- weekly Guild contracts;
- Petra Hale's Builder's Yard;
- the Rose Lantern's optional adult hospitality and information systems.

The selected patron changes a persistent economic or social bonus. It does not remove access to the other two locations.

## Eligibility

Act II begins only after **Chapter 3 Act I — The Guild Exhibition** reaches `complete`.

The state is stored in `chapterThreePatronCircuitV1`. Old saves require no schema migration because the state and bonuses use the existing flexible save flags.

## Progression

1. Review three formal invitations.
2. Choose Registry Sponsorship, Petra's Works Charter, or the Rose Lantern Hospitality Charter.
3. Complete one route-specific public assignment.
4. Advance to the next Ranch Day.
5. Read and sign the permanent charter.

The assignment cannot fail and never removes, transfers, donates, or injures a creature. The final result cannot be rerolled by reloading.

## Patron routes

### Registry Sponsorship

Host: Registrar Elowen Vale  
Location: Regional Guild Registry

Assignment:

- review exhibition placement records;
- audit one season of contract classifications;
- no creature donation or transfer.

Permanent bonus:

- +4% Gold on unfinished current-week and future weekly Guild contracts;
- +1 Guild Point on those contracts;
- applied once per week through a separate patron-reputation marker.

This stacks after the Act I exhibition placement bonus. Completed and expired contracts are never modified.

### Petra's Works Charter

Host: Petra Hale  
Location: Builder's Yard

Assignment:

- survey future habitat pads;
- verify crew access routes;
- approve a reusable expansion plan.

Permanent bonus:

- 10% lower Gold cost on every future unbuilt Builder's Yard project;
- 10% lower Materials cost on every future unbuilt project;
- costs round upward to whole resources;
- +4 Materials when the charter is signed.

Already built projects remain unchanged. Prerequisites, pressure, security, and completed-project flags are preserved.

### Rose Lantern Hospitality Charter

Host: Madam Selene Vale  
Location: The Rose Lantern

Assignment:

- explicitly acknowledge the adult, optional, consent-first house rules;
- coordinate a public non-intimate reception;
- romantic or sexual participation is never required.

Permanent bonus:

- +10 Gold from every future hospitality shift;
- +1 additional House Trust per shift;
- +1 additional Rumor Token per shift;
- +5 House Trust and +2 Rumor Tokens when the charter is signed.

The route does not change salon costs or rumor-token spending.

## Shared reward

Signing any charter grants once:

- 175 Gold;
- 3 Guild Points;
- 15 XP to the Act I exhibition representative;
- 2 Affection to that representative.

The representative bonus is skipped safely if the creature is no longer present.

## Persistence and idempotency

Persisted state includes:

- stage;
- start day;
- invitation review;
- patron choice;
- assignment completion and day;
- report state;
- reward claim;
- bounded history.

Separate weekly markers prevent Guild bonuses from applying more than once. Builder and hospitality bonuses are read from stable flags at action time. Final rewards cannot be claimed twice.

## Active story routing

The Ranch Hub shows one active story panel:

1. Chapter 2 Act I;
2. Chapter 2 Act II;
3. Chapter 2 Act III;
4. Chapter 3 Act I;
5. Chapter 3 Act II.

Chapter 3 Act II replaces the Act I launcher only after the exhibition is complete.
