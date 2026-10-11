# Ingredient feeding and weekly supplies

- Resources & recipes now includes Feeding. Ingredient feeding is opt-in and persists through saves.
- Each ingredient covers one nightly food unit; unreserved ingredients are consumed before generic Feed. Cooked meals remain manual bonus items.
- Food priorities: feline meat/eggs/milk; canine meat/eggs/vegetables/wheat/milk; bovine, equine and lapine vegetables/wheat. This is an initial game balance rule, not a real-animal nutrition model.
- Training absences are excluded. Existing shared shortage/recovery behavior remains. Daily reports list exact ingredients and generic Feed used.
- Weekly deliveries request wheat, wood, vegetables or hearty breakfasts. Sawmills add plank requests; forges add nail requests.
- Deliveries count and consume only unreserved stock and pay once. Existing weekly seeds, reroll prices and Monday rotation remain intact.
- Board version 3 replaces only available old delivery notices. Accepted and completed notices retain their terms.
- Remaining work: replace generic Materials consistently across building projects, repairs, equipment, training upgrades, quest requirements and rewards. Then revisit production yields and first-week affordability.

Validation: 36 focused tests covering resources, feeding, commissions, weekly rerolls, overnight processing and first-week economy; production TypeScript build; feeding panel browser persistence and responsive checks.
