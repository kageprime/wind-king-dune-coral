# Veilspire — Design Bible

> Unranked. Unforgiven. Climb.
>
> A stick-figure roguelike inspired by Solo Leveling and Tower of God.
> Original world, original names. One Mixamo stick rig for every body.

This file is the portable stamp of the living bible in the app. Use **Download** in the app for a generated copy from the same data.

## Pitch

A run-based climb through a tower of dead worlds, fought by stick-figure **Ashwalkers** who share one skeleton and differ by wear, color, and the seal above their head.

You are the **Unsealed** — the weakest licensed body in a city of ranked killers. A rift goes wrong. The Ledger notices you. Each failed climb still writes Ash into your record.

## Title workshop

- **Veilspire** (working) — the tower is a spire of stacked rifts; the veil is the wound between worlds
- Ashrank — rank-climb + the ash dead floors leave
- The Unsealed — names the player; strong as a subtitle
- Nullfloor — colder, more system-like
- Cinder Ledger — puts the HUD in the title

## Glossary

| Ours | Instead of | Meaning |
| --- | --- | --- |
| Ashwalkers | Hunters / Regulars | Licensed to enter rifts |
| The Spire | The Tower | Vertical stack of sealed worlds |
| Rifts | Gates | Tears that open a Floor into the living world |
| Hollows | Dungeons / tests | Rooms inside a Floor |
| The Ledger | The System / Administrators | Cold interface that ranks and bargains |
| Ash | Mana / Shinsu | Residue of collapsed Floors |
| The Unsealed | Irregular + weakest hunter | Entered from outside the rules |
| Cinder Host | Shadow army | Ash pressed into loyal silhouettes |
| Seals | Rank badges | Floating rank/role mark |
| Floor Voice | Administrator | Sets the test; not a person |

## Ranks

- **— Unsealed** — no brand
- **I Ember** — spark / fodder
- **II Coal** — street-level
- **III Iron** — can hold a Hollow
- **IV Steel** — named closers
- **V Glass** — national-level, sharp
- **VI Crown** — floors speak back
- **Ø Null** — a hole the Ledger cannot close

## Roles

- **Breaker** — occupy and survive (tank / fisherman)
- **Lance** — kill through the gap (spear bearer)
- **Weaver** — change the room (wave controller)
- **Beacon** — call the true map (light bearer)
- **Shade** — find and cut (scout)
- **Warden** — refuse the wipe (support)

## Visual law

Every character uses the Mixamo Simple Stick skeleton. Personality is tone, thickness, cosmetics, weapons, and aura — not a new mesh.

Slots: helm (`spine.006`), chest (`spine.003`), legs, back (`spine.002`), main hand (`hand.R`), off hand (`hand.L`), aura (root), seal (above head).

Cinder Host = same spec, matte black tone, pin-light joints, ash aura.

## Mixamo files

- `public/rigs/simple-stick/tpose.fbx`
- `public/rigs/simple-stick/simple-stick.fbx`

Bones: spine / spine.001–.006, shoulder.L/R, upper_arm, forearm, hand, thigh, shin, foot, toe.

## Founding roster

Ren Calder (Unsealed), Sera Quill (Stillair), Kade Morr (Red Vein), Bram Holt (Bastion), Nyx Lumen (Lantern), Orin Vale (Longreach), Mairen Solas (Mend), Irix Venn (Chair of Glass), Juno Rake (Emberwake), Cinder (Host unit), The Carapace (Floor horror), Floor Voice (the test).

## Roadmap

0 Bible (now) → 1 3D Mixamo body → 2 Motion → 3 SFX/VFX → 4 One Floor vertical slice.

## Open questions

Death hardness, party vs solo, title lock, Ledger visibility, next build after the bible.
