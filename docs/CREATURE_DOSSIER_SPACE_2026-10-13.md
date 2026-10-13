# Creature dossier — compact inventory/equipment menus

- Header controls independently hide/show the roster and selected creature artwork. Remaining columns reclaim the space; selected creature and active tab are preserved.
- Compact inventory overview shows item cards. Select an item to open its effect and exact-use review in a modal.
- Equipment overview shows five slots. Select a slot to open a paginated gear picker (four entries per page), then open item details/comparison and confirmation.
- Categories use Weapons, Armor, Head, Hands / Feet and Accessories. Remove "copies" from dossier labels and actions; enhancement levels and short item numbers distinguish otherwise identical equipment.
- Battle-stat breakdowns and transaction receipts use popups. Existing copy-specific ownership, upgrade data, comparisons, confirmations and restrictions remain.
- Narrow displays use a smaller art panel; compact landscape layouts reduce decorative spacing. Long detail/confirmation dialogs retain their existing accessible modal behavior.
- No new artwork or gameplay/save changes. Reuses approved parchment, scenic art and item images.

Validation: production build/TypeScript passed; scoped lint zero errors (four existing-style image warnings). At 1440×900, 1280×720, 390×844 and 844×390 both main Inventory and Equipment panels have scrollHeight equal to clientHeight and no horizontal overflow. Collapse/expand controls preserve selection. Browser checks passed the six-weapon paginated picker, removed “copies” labels, canceled/confirmed equipment assignment with +3 preserved, and exact item stock/affection changes. Screenshots reviewed. PR #21 remains draft/unmerged.
