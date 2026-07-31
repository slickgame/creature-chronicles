# Scope Boundaries

This pass changes presentation and control layout only.

It does not alter:

- deterministic battle resolution;
- enemy AI planning;
- target legality;
- move power, accuracy, effects, cooldowns, or Battle Energy;
- support-item rules or inventory consumption;
- Combat XP, purses, records, progression, or save data.

The horizontal portrait stage is shared by the C2 and C4 battle renderers. The compact modal command HUD is initially wired to the active C2 authored-circuit screen used by the guided Chapter 1 battle lesson. C4 retains its existing command layout until its dedicated parity pass, while receiving the shared horizontal battlefield presentation.
