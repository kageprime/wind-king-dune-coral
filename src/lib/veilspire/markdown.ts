import { FOUNDING } from "./characters";
import {
  APP_NAME,
  COSMETIC_SLOTS,
  GLOSSARY,
  LOOP,
  OPEN_QUESTIONS,
  PITCH,
  RANKS,
  RIG_CONTRACT,
  ROADMAP,
  ROLES,
  TAGLINE,
  TITLE_OPTIONS,
  VISUAL_RULES,
} from "./content";

export function buildBibleMarkdown(): string {
  const roster = FOUNDING.map((c) => {
    return `### ${c.name} — ${c.title}
- Role / rank: ${c.role} / ${c.rank}
- Wear: helm ${c.wear.helm}, chest ${c.wear.chest}, legs ${c.wear.legs}, back ${c.wear.back}, weapon ${c.wear.weapon}${c.wear.offhand !== "none" ? ` + ${c.wear.offhand}` : ""}, aura ${c.wear.aura}
- Tone ${c.body.tone}, thickness ${c.body.thickness}, height ${c.body.height}
- ${c.blurb}
- Notes: ${c.notes}`;
  }).join("\n\n");

  return `# ${APP_NAME} — Design Bible

> ${TAGLINE}
>
> A stick-figure roguelike inspired by Solo Leveling and Tower of God.
> Original world, original names. One Mixamo stick rig for every body.

## 1. Pitch

${PITCH.oneLiner}

${PITCH.fantasy}

${PITCH.whyStick}

### What we take / leave

${PITCH.influences
  .map((i) => `**${i.from}**\n- Take: ${i.take}\n- Leave: ${i.leave}`)
  .join("\n\n")}

## 2. Title workshop

${TITLE_OPTIONS.map((t) => `- **${t.name}** — ${t.note}`).join("\n")}

Working title: **${APP_NAME}**.

## 3. Glossary (renames)

| Ours | Instead of | Meaning |
| --- | --- | --- |
${GLOSSARY.map((g) => `| ${g.ours} | ${g.theirs} | ${g.meaning} |`).join("\n")}

## 4. Ranks

${RANKS.map((r) => `- **${r.mark} ${r.name}** (${r.analog}) — ${r.summary}`).join("\n")}

## 5. Roles (party positions)

${ROLES.map(
  (r) => `- **${r.name}** (${r.analog}) — ${r.summary} Party job: ${r.partyJob}. Default weapon: ${r.defaultWeapon}.`,
).join("\n")}

## 6. Run loop

### Inside a Floor
${LOOP.run.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### Between runs
${LOOP.meta.map((s) => `- ${s}`).join("\n")}

## 7. Visual language

${VISUAL_RULES.map((r) => `- ${r}`).join("\n")}

### Cosmetic slots (same skeleton)

${COSMETIC_SLOTS.map((s) => `- **${s.label}** — ${s.bone}`).join("\n")}

## 8. Mixamo rig contract

Files:
${RIG_CONTRACT.files.map((f) => `- ${f}`).join("\n")}

Bones:
${RIG_CONTRACT.bones.map((b) => `- \`${b.bone}\` — ${b.slot}`).join("\n")}

Later:
${RIG_CONTRACT.later.map((x) => `- ${x}`).join("\n")}

## 9. Founding roster

${roster}

Cinder Host rule: lock tone to matte black, joints to pin-light, aura to ash. Keep weapon and silhouette.

## 10. Generator

The Atelier is a seed + role + rank machine. It writes a \`FigureSpec\` (tone, thickness, colors, wear slots) that both the 2D stick renderer and a later 3D Mixamo viewer can consume. Save specs to the working roster. Do not invent a second skeleton.

## 11. Roadmap

${ROADMAP.map((p) => `### ${p.phase}\n${p.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n")}

## 12. Open questions

${OPEN_QUESTIONS.map((q) => `**${q.q}**\n${q.opts.map((o) => `- ${o}`).join("\n")}`).join("\n\n")}

---

_Living document. The in-app bible is the source of truth; this file is the portable stamp._
`;
}

export function downloadBible() {
  const blob = new Blob([buildBibleMarkdown()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "veilspire-design-bible.md";
  a.click();
  URL.revokeObjectURL(url);
}
