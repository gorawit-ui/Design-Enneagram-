// Locate a donor's neck: the row where its skin column is narrowest just above its own collar,
// which is the point the graft has to line up with the master's collar opening.
import sharp from "sharp";
const isSkin = (R, G, B) => R > 110 && R > G && G > B && R - B > 25 && R - B < 130 && G - B > 5;
for (const file of process.argv.slice(2)) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  let top = -1, bottom = -1;
  for (let y = 0; y < H && top < 0; y += 1) for (let x = 0; x < W; x += 1) { if (data[(y * W + x) * C + C - 1] > 8) { top = y; break; } }
  for (let y = H - 1; y >= 0 && bottom < 0; y -= 1) for (let x = 0; x < W; x += 1) { if (data[(y * W + x) * C + C - 1] > 8) { bottom = y; break; } }
  const height = bottom - top + 1;
  console.log(`${file.split("/").pop()}  top=${top} height=${height}`);
  const rows = [];
  for (let y = top + Math.floor(height * 0.10); y < top + Math.floor(height * 0.32); y += 1) {
    let lo = 1e9, hi = -1;
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * C;
      if (data[i + C - 1] <= 128) continue;
      if (!isSkin(data[i], data[i + 1], data[i + 2])) continue;
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    }
    if (hi >= 0) rows.push({ y, w: hi - lo + 1, cx: (lo + hi) / 2 });
  }
  // the neck: after the face has widened and narrowed again, the last local minimum before the collar
  let best = rows[0];
  for (const r of rows) if (r.w <= best.w) best = r;
  console.log(`  narrowest skin: ${best.w}px at y=${best.y}, centre x=${best.cx.toFixed(0)}`);
  console.log(`  ${rows.filter((_, i) => i % 8 === 0).map((r) => `${r.y}:${r.w}`).join("  ")}`);
}
