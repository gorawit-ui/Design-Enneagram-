# Hero image prompt — the welcome-page trio

The prompt below replaces `public/guild-characters-3d.webp`. It is written to be pasted whole into a
new ChatGPT conversation; nothing in it is a placeholder.

## Why the current hero is being remade, and what must not change

The image in production is well built and **correctly framed**, and the framing is not the problem.
Measured off the file:

| | Measured | Verdict |
|---|---:|---|
| Figures' share of canvas height | 83.3% | keep |
| Clear space above heads / below soles | 8.2% / 8.5% | keep |
| Figures' share of canvas width | 72.4% | keep |
| Canvas | 1400×1050 (4:3) | keep |

The problem is that the three figures read as **one figure repeated**. Reducing each figure to a
normalised binary silhouette and comparing them pairwise:

| Pair | Silhouette agreement |
|---|---:|
| left vs middle | 72.7% |
| left vs right | 68.5% |
| **middle vs right** | **86.1%** |

All three stand square to the camera, all three hold a small flat pale rectangle at the same chest
height, and all three wear the same pleasant neutral expression. The frame displays the picture
**328 px wide on a phone** — a 4.3× reduction — at which point the three are indistinguishable.

So the prompt changes exactly one thing: it gives each figure a different **arm height** and a
different **prop size**, which is what a silhouette can carry. It does not change the framing, the
wardrobe, the palette, the lighting or the level of realism, because those all measure fine.

## One trap to watch, because it has already cost a generation

Figure 1's ink seal is the same shape as a medal. `scripts/generate-asset-prompts.mjs` carries an
`AWARD_WORDS` guard for exactly this reason after Core 3's prop was once authored as "a milestone
medallion" in a prompt that forbade awards on the next line. The prompt below spends four lines
describing the seal as a working stamp pressed down onto a page, and no prop anywhere in it is
described with a word from that guard list.

---

## The prompt — paste from here down

```
ส่งข้อความนี้ในแชทใหม่ของ ChatGPT — ห้ามแนบไฟล์
(การแนบไฟล์ทำให้ ChatGPT สลับไปโหมดแก้ไขภาพ ซึ่งจะ export ออกมาเป็นสี่เหลี่ยมจัตุรัสและใช้ไม่ได้)

สร้างภาพใหม่ 1 ภาพ สำหรับหน้าแรกของเว็บ (hero image)
- ทำทีละภาพ อย่าสร้างหลายเวอร์ชันให้เลือก
- ถ้ามีข้อไหนขัดกัน ให้ยึด SILHOUETTE TEST เป็นข้อสำคัญที่สุด

---

Polished, warm, semi-realistic 3D character illustration. Three adults standing side by side in a
soft, defocused, very pale interior. Landscape 4:3 canvas, at least 1400 x 1050 px, solid
background (this image is NOT a cut-out and does NOT need transparency).

WHY THIS IMAGE IS BEING REMADE — read this before anything else.
The version being replaced is well built and correctly framed, and its framing is not the problem:
the figures already fill 83.3% of the canvas height with 8.2% clear above and 8.5% below, and they
span 72.4% of the width. Keep all of that. The single problem is that the three figures read as one
figure repeated. Measured as normalised silhouettes, the three agree with each other 68.5%, 72.7%
and 86.1% — the two on the right are very nearly the same shape. All three stand square to the
camera, all three hold a small flat pale rectangle at the same chest height, and all three wear the
same neutral pleasant expression. On a phone the picture is displayed 328 px wide, a 4.3x
reduction, at which point the three are indistinguishable. Every instruction below exists to make
the three figures readable apart as silhouettes at that size.

SILHOUETTE TEST — the requirement this image must pass.
Imagine the finished picture reduced to 328 px wide and filled in as three flat black shapes. A
viewer must be able to tell the three shapes apart with no colour and no facial detail. This is
achieved by giving each figure a different ARM HEIGHT and a different PROP SIZE, listed per figure
below. It is not achieved by changing colour, hair or expression, so do not substitute those.

WARDROBE (identical for all three figures, no exceptions): forest-green blazer, ivory knit top,
straight charcoal trousers, flat-soled black ankle boots. No heels on any figure — footwear is
identical across all three.

PALETTE: matcha green, forest green, ivory, charcoal. Character-specific accents appear only in the
prop. Never use colour alone to signal anything.

STYLE: stylised 3D character rendering of the kind an animated feature uses — not photographic.
Skin is smoothly and evenly shaded, with no visible pores, blemishes or photographic subsurface
detail. Eyes are drawn rather than photographed: clean iris shapes, no studio catchlights. Facial
proportions are gently idealised rather than anatomically exact. All three figures sit at exactly
the same distance from realism.

FINISH: equal lighting, detail density and apparent production value across all three. Soft, even,
warm key light from the left. No dramatic rim light, no lens effects, no vignette.

EQUAL STANDING — the constraint that outranks composition.
No figure may read as more capable, more senior, more employable or more physically dominant than
another. Build may differ between the three; power may not. Same height, same head height, same
prop prominence, same lighting, same production value, same amount of frame. One figure raises an
arm and one holds a wide object, and that difference must read as *a different kind of work*, never
as one person leading or presenting to the other two. Nobody points at another figure. Nobody
stands in front of another figure. Nobody is turned away.

PROPS: held in the hands, worn, or resting on a surface the character is touching. Never floating
detached in mid-air, and never presented as an award, medal, trophy, rosette, prize or rank badge.
This matters especially for the seal in FIGURE 1 — it is a working ink stamp used to mark a
document as checked, flat and unglamorous, pressed down onto the page. It is never worn, never held
up, never displayed to the viewer, never round-and-golden, and never hangs from anything.

--- FIGURE 1, on the viewer's left — LOW ARMS, SMALL PROP ---
CHARACTER: the Standards Keeper.
ORIENTATION: three-quarter turn toward the centre of the picture, weight even on both feet.
ARM HEIGHT: LOW. Both hands are below the waist and close to the body, so the torso silhouette is
one clean unbroken column. This is the narrowest of the three shapes.
ACTION: pressing a flat ink seal down onto the open page of a standards notebook held in the other
hand, looking down at the page.
PROP: a small closed-format notebook and a flat round ink stamp. Both small — together no wider
than the figure's own hip width.
EXPRESSION: calm, attentive, a small closed-mouth smile. Eyes on the page, not on the viewer.
NEVER READS AS: strict, scolding, disapproving, inspecting someone, or perfectionist distress.

--- FIGURE 2, in the middle — MID ARMS, WIDE PROP ---
CHARACTER: the Relationship Guide.
ORIENTATION: facing the viewer, turned very slightly to the viewer's left.
ARM HEIGHT: MID and WIDE. Both forearms are horizontal at chest height with the elbows held away
from the body, so the silhouette is a broad horizontal bar across the chest. This is the widest of
the three shapes.
ACTION: holding a wide network chart open across both hands, angled so its face is visible, as if
about to turn it toward someone.
PROP: a wide folded network chart — roughly twice as wide as it is tall, and clearly wider than the
figure's shoulders. Plus a small welcome kit tucked under the near arm: one folded ivory card and a
slim ivory document sleeve.
EXPRESSION: warm, open, welcoming. This is the one figure making eye contact with the viewer.
NEVER READS AS: pleading, ingratiating, self-sacrificing, or selling something.

--- FIGURE 3, on the viewer's right — HIGH ARM, TALL PROP ---
CHARACTER: the Goal Driver.
ORIENTATION: three-quarter turn toward the centre of the picture, the near foot half a step forward.
ARM HEIGHT: HIGH. One arm is raised above shoulder height, elbow bent, hand near the top of the
board. The other arm hangs relaxed. This is the tallest and most asymmetric of the three shapes.
ACTION: placing a small progress marker near the top of a goal board, looking at the spot where the
marker is going.
PROP: a tall narrow goal board standing on the floor beside them — clearly taller than it is wide,
its top edge at about the figure's shoulder height — and one small flat progress marker in the
raised hand. The board is plain: ruled bands and blank markers, no writing of any kind.
EXPRESSION: focused, positive, composed.
NEVER READS AS: status-seeking, boastful, salesy, image-obsessed, or presenting to the other two.

--- COMPOSITION — hold these numbers ---
- Landscape 4:3, at least 1400 x 1050 px.
- Three figures side by side on one floor line, evenly spaced, with clear space between them: no
  figure overlaps another and no prop crosses into a neighbour's space.
- The three figures together span 72-78% of the canvas width, centred, leaving at least 11% clear
  on the left and 11% clear on the right.
- Every figure's soles sit 8-9% of the canvas height above the bottom edge.
- The tops of the three heads are level with each other and 6-9% of the canvas height below the top
  edge. The heads are the top of the composition: FIGURE 3's raised hand may reach up to head
  height but must not rise above the head line, and FIGURE 3's board must stay below it too.
- All three heads at the same height. No figure taller than another.

--- BACKGROUND ---
A soft, very pale, defocused warm interior: ivory walls, diffused daylight from a large window on
the left, one hint of a green plant at the far left, a pale stone floor. Nothing in focus behind the
figures. The background stays clearly lighter than the figures at every point so the three separate
cleanly when the picture is reduced to 328 px wide. Soft contact shadows under the feet only — no
long cast shadows, no hard floor reflections, no furniture in focus.

--- NEVER INCLUDE ---
Text, numbers, letters, words, logos, watermarks, signage, charts with readable labels, money,
luxury or status objects, badges of rank, job titles, awards, medals, trophies, distress,
pathology, medical or diagnostic cues, dominance posturing, flirtation, or any body-shape encoding
of personality or gender. No speech bubbles. No UI elements. No borders or frames drawn into the
image — the website adds its own frame.

--- OUTPUT ---
One image. Landscape 4:3, at least 1400 x 1050 px, PNG or JPEG with a solid background.
```

## When the image comes back

The hero is not a spec asset, so it does not go through `npm run assets:check` — that script
enforces 1024×1024 RGBA with a transparent margin, which is the wrong contract for a landscape hero
on a solid background. The one requirement that *can* be measured is the one the current file fails,
and it now has a command:

```
npm run assets:hero                       # checks public/guild-characters-3d.webp
npm run assets:hero -- path/to/new.webp   # or check a candidate before replacing anything
```

It prints the framing (which must be kept) and the three pairwise silhouette agreements (which must
drop), and exits non-zero when any pair is above 65%. On the file in production today:

```
figures fill 83.3% of height  ·  8.2% clear above  ·  8.5% clear below
figures fill 72.4% of width   ·  14.7% clear left  ·  12.9% clear right
  left vs middle: 72.7%  TOO ALIKE
  left vs right:  68.5%  TOO ALIKE
  middle vs right: 86.1%  TOO ALIKE
worst pair 86.1% against a 65% ceiling: FAIL
```

Then two things the script cannot judge:

1. **The weight.** The current file is 50 KB, converted down from a 2187 KB source. Target ≤80 KB
   at 1400×1050 lossy WebP; above that it will be felt on a phone.
2. **Look at it at 328 px.** Not zoomed out in a viewer — actually displayed 328 px wide, which is
   what a phone shows inside the frame. The script is a floor, not a substitute for looking.

Then replace `public/guild-characters-3d.webp` and update the `alt` text in `app/page.tsx`, which
currently describes the *old* props ("ถือสมุดและการ์ดประจำแนวคิดของตัวเอง") and would otherwise
describe a picture that no longer exists.

---

## Round 2, 2026-09-10 — what the first generation from this prompt returned

1600×1200, 4:3, and a real improvement on the thing the prompt exists to fix. The arm heights and
prop sizes all landed: low arms with a small stamp, a chart wider than the shoulders at chest
height, a raised arm at a tall board.

| Pair, upper body | First hero | This candidate |
|---|---:|---:|
| left vs middle | 71.1% | **58.0%** |
| left vs right | 65.0% | **52.4%** |
| middle vs right | 77.3% | **66.2%** |

The gate had to be corrected before that table meant anything, and the correction is not a
concession to this image: gating on the *whole* outline scored the spec's own requirements as a
defect, because identical wardrobe and an equal standing pose force the legs of any two figures to
agree. This candidate's left-vs-middle legs agree 83.6% while its upper bodies agree 58.0% — the
props worked and the whole-body number hid it. The gate now reads the top 45%. The first hero still
fails it at 77.3%, which is the check that the change did not soften anything.

Two things to fix in the next generation, neither visible to the script:

- **Footwear.** All six boots came back with a block heel. The wardrobe lock is *flat-soled black
  ankle boots, no heels on any presentation*, and all twelve approved base assets follow it — so a
  participant would meet heeled figures on the welcome page and flat-soled ones on their own result
  page. Within the image nothing is unequal; against the rest of the set it is a continuity break.
- **Presentation mix.** All three figures read as the same presentation. The first hero had a
  visible mix, and the whole point of building female/male/neutral for every core is that people
  see themselves. The prompt did not ask for a mix, which is the prompt's omission — it is now
  stated below.

Everything else — framing, palette, lighting, realism, the seal reading as a working stamp rather
than a medal, no text anywhere — came back correct and should be held.

### Follow-up message, to be sent in the same ChatGPT conversation

```
แก้ 3 จุด ส่วนอื่นเก็บไว้เหมือนเดิมทั้งหมด — คนเดิม เสื้อผ้าเดิม แสงเดิม กรอบเดิม
ท่าเดิม ของถือเดิม พื้นหลังเดิม สร้างภาพใหม่ 1 ภาพ ไม่ต้องทำหลายเวอร์ชัน

1. FOOTWEAR: all six boots must be FLAT-SOLED black ankle boots with no heel at all — a thin
   welted sole only, the same boot on all three figures. The heel block in the last image is
   wrong. This is a hard rule in the character spec: footwear is identical across every
   presentation, because a heel changes apparent height and posture and encodes gender into the
   figure. Remove the heel entirely; keep the boots otherwise identical.

2. PRESENTATION MIX: the three figures currently read as the same presentation. Make them one
   female-presenting, one male-presenting and one androgynous/neutral-presenting adult, in that
   order left to right. Change only hair and facial structure to do it. Do NOT change height,
   shoulder width, build, wardrobe, posture, prop, arm height or expression — all three keep the
   pose and prop they already have, and no figure may read as more capable, more senior or more
   physically dominant than another. Same height and the same head height for all three.

3. HEADROOM: leave 6-9% of the canvas height clear above the tops of the heads. The last image
   left only 4.9%. Everything else about the framing was right and must not change: figures
   filling about 85% of the height, about 80% of the width, soles 8-10% above the bottom edge.

Keep: the same three poses and arm heights (low / mid-and-wide / high), the same three props
(small notebook and flat ink stamp / wide network chart and welcome kit / tall goal board and
progress marker), the forest-green blazer, ivory knit top, charcoal trousers, the pale defocused
interior, the soft warm light from the left, and no text or numbers anywhere in the image.
```
