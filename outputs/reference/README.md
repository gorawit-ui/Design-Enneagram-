# Reference collection — competitor and prior-art assessment tools

## The collection protocol, set by the Products Owner on 2026-09-10

> "เก็บเป็นข้อมูลก่อน กำลังทะยอยเอามาเพิ่มให้ จนกว่าจะบอกว่า ครบแล้ว ค่อยเริ่มวิเคราะห์ทำนะ"

**While a batch is arriving: file it and stop.** Save the screenshots, name them in reading order,
note which tool they came from and anything the Products Owner said alongside them. Do not analyse,
do not compare against our item bank, do not measure anything, and do not touch
`app/lib/assessment-data.ts` or any other source file.

**The analysis starts only when the Products Owner says "ครบแล้ว"** (or equivalently that the set is
complete). Until then a batch is data, not a request.

Why it is written down rather than remembered: the last round of analysis produced a wrong
conclusion because it was drawn from the first five screenshots of a ten-screenshot set — batch 2 of
that tool ended on "เหลือ 5 กับ 7 เป็นตัวเต็ง" and batch 3 closed it correctly, so a mid-point was
read as an endpoint and recorded in this repo as a failure that had not happened. Analysing a
partial set is not a small inefficiency; it produces confident wrong findings. This protocol exists
to stop that from happening again.

## What to capture per tool

One directory per tool, `outputs/reference/<tool>/`, with screenshots numbered in reading order:

```
1-<what the screen is>.png
2-<what the screen is>.png
...
```

Extract them with `npm run chat:images -- --save --index N --out-dir outputs/reference/<tool>`
rather than asking for a re-upload.

## Tools collected so far

| Tool | Directory | Status |
|---|---|---|
| พี่ทิม's Enneagram tool (internal, executive-built) | `tim-enneagram-tool/` | **complete** — 10 screenshots, analysed, findings in `docs/REFERENCE_TIM_ENNEAGRAM_TOOL.md`, all borrows built |
| (next tool — collecting) | | screenshots arriving |

## Analysed findings live in docs/, not here

This directory holds raw evidence. Conclusions go in `docs/REFERENCE_*.md` so they sit next to the
other decision records and get reviewed the same way.
