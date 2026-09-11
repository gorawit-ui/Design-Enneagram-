import Image from "next/image";
import { useState } from "react";
import { getCharacterProfile, type GenderPresentation, type ResolvedCharacterProfile } from "./lib/character-system";
import { resolveCharacterSceneKit, type CharacterSceneKit, type VisualMbti } from "./lib/character-visual-modifiers";
import { LIVING_CHARACTER_PILOT_ENABLED } from "./lib/living-character-flag";
import { LIVING_CHARACTER_SCHEMA_VERSION, resolveLivingCharacterVisual, type LivingCharacterConfidence } from "./lib/living-character-resolver";
import type { AnswerRecord, AssessmentResult, Confidence } from "./lib/scoring";
import { buildSessionExport } from "./lib/session-export";
import { CORE_VOICES, POLE_VOICES, WING_VOICES, crossReading } from "./lib/cross-reading";
import { composeResultNarrative } from "./lib/result-insights";
import {
  CORE_TRAITS, ENNEAGRAM_DEPTH, PASSIONS, USER_MANUAL, centreOf, growthArrow, stressArrow, wingPersona,
} from "./lib/enneagram-depth";
import { ENNEAGRAM_PROFILES } from "./lib/character-system";

const confidenceThai: Record<Confidence, string> = { clear: "ชัดเจน", close: "แนวโน้มที่ใกล้เคียง", ambiguous: "ยังไม่ชัดเจน" };
type Props = {
  result: AssessmentResult; answers: readonly AnswerRecord[]; character: ResolvedCharacterProfile;
  nickname: string; team: string; genderPresentation: string; consent: boolean; onRestart: () => void;
};

function InsightCard({ title, items, soft = false }: { title: string; items: readonly string[]; soft?: boolean }) {
  return <article className={`insight-card ${soft ? "insight-card-soft" : ""}`}><h2>{title}</h2><ul>{items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></article>;
}

/**
 * The depth section: what this type is afraid of and wants, the same person at three levels of
 * strain, and the two arrows.
 *
 * Only rendered for a named core. On an ambiguous result there is no core to be afraid of anything,
 * and inventing one here would be the one place on this page where a hedge turns into a claim.
 *
 * The three levels exist because the page previously described one state and let the reader take
 * it as who they are. A person reads their "average" paragraph and recognises themselves; the point
 * of showing "healthy" next to it is that the same type has somewhere to go, and the point of
 * showing "strained" is that a bad month is a state rather than a verdict.
 */
function DepthSection({ core, wing }: { core: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; wing: number | null }) {
  const depth = ENNEAGRAM_DEPTH[core];
  const stress = stressArrow(core);
  const growth = growthArrow(core);
  const nameOf = (target: number) => ENNEAGRAM_PROFILES[target as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9].titleThai;
  // Collapsed by default, and this is the one section where that costs nothing: the card at the
  // top already prints the fear, the desire and both arrows. Measured, this block is 1667px — two
  // full phone screens of a page that was 8.4 — and every headline in it is above the fold in
  // shorter form. docs/UX_REVIEW_2026-09-10.md §3 asked for a page a person can read in sixty
  // seconds; the answer is not to delete the depth, it is to stop making everyone scroll past it.
  return <details className="depth-section" open={false}>
    <summary>
      <span className="step-label">โครงสร้างข้างใน</span>
      <h2 id="depth-title">อะไรอยู่ใต้แรงขับของคุณ</h2>
      <span className="details-teaser">ระดับสุขภาพ 3 ระดับ · เวลาเครียดไปทางไหน · ทางเติบโตไปทางไหน</span>
    </summary>
    <div className="depth-head">
      <p>ลักษณ์ไม่ได้บอกว่าคุณทำอะไร แต่บอกว่าคุณจัดชีวิตเพื่อเลี่ยงอะไร และเดินไปหาอะไร</p>
    </div>
    <dl className="depth-pair">
      <div><dt>สิ่งที่กลัวจริง ๆ</dt><dd>{depth.coreFearThai}</dd></div>
      <div><dt>สิ่งที่ต้องการจริง ๆ</dt><dd>{depth.coreDesireThai}</dd></div>
      <div><dt>วิธีที่ใช้ปกป้องตัวเอง</dt><dd>{depth.defenceThai}</dd></div>
    </dl>
    <div className="depth-levels">
      <h3>ลักษณ์เดียวกัน สามระดับ</h3>
      <p className="depth-levels-note">คนคนเดียวอ่านได้ทั้งสามแบบในปีเดียว ขึ้นกับว่าตอนนั้นมีแรงเหลือเท่าไร</p>
      <ol>
        <li className="depth-level depth-level-healthy"><b>ตอนมีแรงเหลือ</b><span>{depth.levels.healthyThai}</span></li>
        <li className="depth-level depth-level-average"><b>ตอนปกติทั่วไป</b><span>{depth.levels.averageThai}</span></li>
        <li className="depth-level depth-level-strained"><b>ตอนสะสมความเครียดนานเกินไป</b><span>{depth.levels.strainedThai}</span></li>
      </ol>
    </div>
    <div className="depth-arrows">
      <h3>สองทิศที่ลักษณ์ของคุณขยับไป</h3>
      <p className="depth-levels-note">
        {`นี่คือเหตุผลที่บางคำตอบของคุณอาจดูขัดกันเอง — เวลาเครียด ลักษณ์ ${core} จะแสดงออกคล้ายลักษณ์ ${stress} ซึ่งไม่ได้หมายความว่าคุณเป็นลักษณ์ ${stress}`}
      </p>
      <div className="depth-arrow-grid">
        <article className="depth-arrow depth-arrow-stress">
          <span className="depth-arrow-label">เวลาเครียด → ลักษณ์ {stress}</span>
          <b>{nameOf(stress)}</b>
          <p>{depth.underStrainThai}</p>
        </article>
        <article className="depth-arrow depth-arrow-growth">
          <span className="depth-arrow-label">ทางเติบโต → ลักษณ์ {growth}</span>
          <b>{nameOf(growth)}</b>
          <p>{depth.towardGrowthThai}</p>
        </article>
      </div>
    </div>
    {wing !== null && <p className="depth-wing-note">
      {`Wing ${wing} เพิ่มรายละเอียดให้ลักษณ์ ${core} แต่ไม่เปลี่ยนสิ่งที่กลัวและสิ่งที่ต้องการข้างบน — นั่นคือส่วนที่เป็นแกน`}
    </p>}
    <p className="depth-source">
      โครงสองทิศนี้เป็นโครงมาตรฐานของ Enneagram (stress / growth arrow) ไม่ใช่การตีความเฉพาะของเครื่องมือนี้
    </p>
  </details>;
}

/**
 * Shown only when the two lenses disagree. Worded to say what the disagreement means rather than
 * to apologise for it: this is not a weaker result, it is two readings of the same person, and
 * which is the core and which is the strategy is exactly the thing worth talking about.
 */
/**
 * The tension map: every part of the person that wants something, saying it in one line.
 *
 * This is the extended version of the two-lens tension. That comparison is a measurement and it
 * stays where it is; this is the picture around it, built from things already established
 * elsewhere on the page -- the core, the wing, and whichever MBTI poles pull against the core per
 * lib/cross-reading.ts.
 *
 * Ordered core first, then wing, then poles, so it reads as one person with a loudest voice rather
 * than as a committee. Shown only with at least three voices; two lines wanting different things is
 * a sentence, not a map.
 */
function TensionMap({ core, wing, mbtiType, lensTension }: {
  core: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; wing: number | null; mbtiType: string | null;
  lensTension: AssessmentResult["tension"];
}) {
  const reading = crossReading(core, mbtiType as never);
  const voices: { source: string; line: string }[] = [
    { source: `ลักษณ์ ${core}`, line: CORE_VOICES[core] },
  ];
  if (wing !== null) {
    voices.push({ source: `Wing ${wing}`, line: WING_VOICES[wing as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9] });
  }
  for (const pull of reading?.pulls ?? []) {
    const line = POLE_VOICES[pull.pole];
    if (line) voices.push({ source: `${pull.pole} (MBTI)`, line });
  }
  // The lens tension names an inward and an outward core, and one of them is usually the core
  // already speaking first in this list. Adding it again produced a map with the same sentence
  // twice under two labels, which reads as a bug because it is one. Only the lens that points
  // somewhere else has a voice worth hearing.
  for (const [lens, lensCore] of [
    ["คำตอบด้านใน", lensTension?.inwardCore],
    ["คำตอบด้านนอก", lensTension?.outwardCore],
  ] as const) {
    if (lensCore === undefined || lensCore === core) continue;
    voices.push({ source: lens, line: CORE_VOICES[lensCore] });
  }
  if (voices.length < 3) return null;
  return <section className="tension-map" aria-labelledby="tension-map-title">
    <span className="step-label">เสียงในตัวคุณ</span>
    <h2 id="tension-map-title">หลายเสียงที่ดึงกันอยู่</h2>
    <p className="tension-map-note">
      แต่ละบรรทัดคือส่วนหนึ่งของคุณที่ต้องการคนละอย่าง — ไม่ได้แปลว่ามีอะไรผิด
      คนที่ตัดสินใจยากในบางเรื่องมักไม่ได้ลังเล แต่กำลังฟังหลายเสียงพร้อมกัน
    </p>
    <ul>{voices.map((voice) => (
      <li key={voice.source}><b>{voice.source}</b><span>{voice.line}</span></li>
    ))}</ul>
  </section>;
}

function TensionNote({ tension }: { tension: NonNullable<AssessmentResult["tension"]> }) {
  const nameOf = (core: number) => ENNEAGRAM_PROFILES[core as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9].titleThai;
  return <section className="tension-note" aria-labelledby="tension-title">
    <span className="step-label">คำตอบชี้ไปสองทาง</span>
    <h3 id="tension-title">ข้างในกับข้างนอกของคุณไม่ตรงกัน — และนั่นคือข้อมูล</h3>
    <ul>
      <li>
        <b>คำถามเรื่องสิ่งที่คุณกลัว และเสียงที่คุณพูดกับตัวเอง</b>
        <span>{`ชี้ไปที่ลักษณ์ ${tension.inwardCore} · ${nameOf(tension.inwardCore)}`}</span>
      </li>
      <li>
        <b>คำถามเรื่องวิธีที่คุณทำงาน และคำชื่นชมที่อยากได้</b>
        <span>{`ชี้ไปที่ลักษณ์ ${tension.outwardCore} · ${nameOf(tension.outwardCore)}`}</span>
      </li>
    </ul>
    <p>
      {`นี่ไม่ใช่ผลที่ไม่ชัด — ทั้งสองด้านชัดพอทั้งคู่ แต่ชี้ไม่ตรงกัน สิ่งที่มักเกิดขึ้นคือ ลักษณ์ ${tension.outwardCore} เป็นวิธีที่คุณพัฒนาขึ้นมาเพื่อทำงานกับโลกและกับคนรอบตัว ส่วนลักษณ์ ${tension.inwardCore} คือสิ่งที่อยู่ข้างใต้`}
    </p>
    <p className="tension-next">
      ลองสังเกตตัวเองสักสัปดาห์ว่าเวลาไม่มีใครดู คุณอยู่กับแบบไหนมากกว่า — และเรื่องนี้เป็นหัวข้อที่คุยกับหัวหน้าหรือ HR ต่อได้ดี
    </p>
  </section>;
}

/**
 * The summary card for a result that did not resolve to one core.
 *
 * Not a placeholder and not an apology. Two cores scoring within a couple of points of each other
 * is a real reading, and the useful thing to hand back is what separates them -- so the card puts
 * both fears and both desires side by side and says which question decides it. That is also the
 * only thing a person can act on: nobody can pick between "ลักษณ์ 5" and "ลักษณ์ 9" as labels, but
 * most people know immediately which of two fears they recognise.
 */
function AmbiguousSummaryCard({ result, nickname, team, mbtiLabel }: {
  result: AssessmentResult; nickname: string; team: string; mbtiLabel: string;
}) {
  const first = result.enneagram.top.value;
  const second = result.enneagram.runnerUp.value;
  const pair = [first, second] as const;
  const gap = Math.abs(result.enneagram.top.score - result.enneagram.runnerUp.score);
  return <section className="summary-card summary-card-open" aria-labelledby="summary-title">
    <header className="summary-head">
      <div className="summary-badge summary-badge-open" aria-hidden="true">{`${first}/${second}`}</div>
      <div className="summary-identity">
        <h1 id="summary-title">ยังอยู่ระหว่างสองลักษณ์</h1>
        <p className="summary-line">
          {`คำตอบชี้ไปที่ลักษณ์ ${first} กับลักษณ์ ${second} ห่างกันแค่ ${gap} คะแนน ซึ่งใกล้เกินกว่าจะสรุปเป็นลักษณ์เดียว`}
        </p>
        <p className="summary-meta">
          {`${ENNEAGRAM_PROFILES[first].titleThai} · ${ENNEAGRAM_PROFILES[second].titleThai}`}
        </p>
      </div>
    </header>
    <p className="summary-owner">{`${nickname} · ทีม ${team} · ${mbtiLabel}`}</p>

    <dl className="summary-structure">
      {pair.map((candidate) => <div key={`fear-${candidate}`}>
        <dt>{`ลักษณ์ ${candidate} กลัวอะไร`}</dt><dd>{ENNEAGRAM_DEPTH[candidate].coreFearThai}</dd>
      </div>)}
      {pair.map((candidate) => <div key={`want-${candidate}`}>
        <dt>{`ลักษณ์ ${candidate} ต้องการอะไร`}</dt><dd>{ENNEAGRAM_DEPTH[candidate].coreDesireThai}</dd>
      </div>)}
    </dl>

    <div className="summary-traits">
      {pair.map((candidate) => <section key={candidate}>
        <h2>{`ถ้าเป็นลักษณ์ ${candidate}`}</h2>
        <ul>{CORE_TRAITS[candidate].strengths.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>)}
    </div>

    <p className="summary-open-hint">
      วิธีตัดสินด้วยตัวเอง — อ่าน &ldquo;กลัวอะไร&rdquo; ทั้งสองข้าง ข้อที่อ่านแล้วสะดุดหรือไม่อยากยอมรับ มักเป็นแกนจริง
      ส่วนอีกข้อมักเป็นวิธีที่คุณใช้รับมือกับมัน
    </p>
    <p className="summary-caveat">
      ใช้เพื่อการสะท้อนตนเองและการทำงานร่วมกัน ไม่ใช่การวินิจฉัยหรือข้อสรุปตายตัว
    </p>
  </section>;
}

/**
 * The one-page summary card. Everything a person needs in one screen, and the page the PDF export
 * prints.
 *
 * This exists because the result page reached 4797px on a phone -- about 5.7 screens -- and
 * docs/UX_REVIEW_2026-09-10.md had already called it too long at three. The content was all
 * present and none of it was reachable in the sixty seconds the onsite playbook allocates to
 * reading a result. Nothing here is new material: it is the identity, the structure, the two
 * arrows and six trait lines, arranged so that a reader who stops after the first screen has still
 * had the whole thing.
 *
 * It is also what makes the export work. A PDF of a 4797px page is not a document anybody keeps;
 * a PDF of this is.
 */
function SummaryCard({ result, nickname, team, mbtiLabel }: {
  result: AssessmentResult; nickname: string; team: string; mbtiLabel: string;
}) {
  const core = result.enneagram.core;
  // An ambiguous result still has to produce a card, and this branch is why. It used to return
  // null, which hid the card, the radar and every depth section at once -- and because the print
  // stylesheet is an allow-list that opts exactly those two back in, printing an ambiguous result
  // produced a blank sheet of paper. Reported from a phone as "the PDF is empty"; reproduced at
  // 1009 bytes. A person whose answers came out close is precisely the person who needs something
  // to read, so the card shows the two cores that are close and what separates them.
  if (core === null) return <AmbiguousSummaryCard result={result} nickname={nickname} team={team} mbtiLabel={mbtiLabel} />;
  const wing = result.wingStatus === "valid" ? result.wing : null;
  const depth = ENNEAGRAM_DEPTH[core];
  const persona = wingPersona(core, wing);
  const centre = centreOf(core);
  const passion = PASSIONS[core];
  const traits = CORE_TRAITS[core];
  const profile = ENNEAGRAM_PROFILES[core];
  const stress = stressArrow(core);
  const growth = growthArrow(core);
  const nameOf = (target: number) => ENNEAGRAM_PROFILES[target as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9].titleThai;
  return <section className="summary-card" aria-labelledby="summary-title">
    <header className="summary-head">
      <div className="summary-badge" aria-hidden="true">{wing === null ? core : `${core}w${wing}`}</div>
      <div className="summary-identity">
        <h1 id="summary-title">{persona?.nameThai ?? profile.titleThai}</h1>
        <p className="summary-line">{persona?.lineThai ?? profile.shortDescriptionThai}</p>
        {/* The core title is repeated here only when the heading is a wing persona. With no
            resolved wing the heading IS the core title, and printing it twice in three lines read
            as a mistake. */}
        <p className="summary-meta">
          {persona ? `ลักษณ์ ${core} · ${profile.titleThai} · Wing ${wing} · ${centre.nameThai}`
            : `ลักษณ์ ${core} · ${centre.nameThai} · ${centre.driveThai}`}
        </p>
      </div>
    </header>
    <p className="summary-owner">{`${nickname} · ทีม ${team} · ${mbtiLabel}`}</p>

    <dl className="summary-structure">
      <div><dt>สิ่งที่กลัวจริง ๆ</dt><dd>{depth.coreFearThai}</dd></div>
      <div><dt>สิ่งที่ต้องการจริง ๆ</dt><dd>{depth.coreDesireThai}</dd></div>
      <div><dt>วิธีปกป้องตัวเอง</dt><dd>{depth.defenceThai}</dd></div>
      <div><dt>บาปหลัก</dt><dd><b>{passion.nameThai}</b> — {passion.lineThai}</dd></div>
    </dl>

    <div className="summary-arrows" role="group" aria-label="สองทิศที่ลักษณ์ขยับไป">
      <div className="summary-arrow summary-arrow-stress">
        <span>{`← เวลาเครียด · ลักษณ์ ${stress}`}</span><b>{nameOf(stress)}</b>
      </div>
      <div className="summary-arrow summary-arrow-core">
        <span>แกนของคุณ</span><b>{wing === null ? `ลักษณ์ ${core}` : `${core}w${wing}`}</b>
      </div>
      <div className="summary-arrow summary-arrow-growth">
        <span>{`ทางเติบโต · ลักษณ์ ${growth} →`}</span><b>{nameOf(growth)}</b>
      </div>
    </div>

    <div className="summary-traits">
      <section><h2>จุดแข็ง</h2><ul>{traits.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><h2>จุดที่ท้าทาย</h2><ul>{traits.challenges.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>

    {/* One line on purpose. The full explanation is in its own section below; this is the flag that
        says go and read it, and the card has 24px of room, not 60. */}
    {result.tension !== null && <p className="summary-tension-flag">
      {`คำตอบด้านในชี้ลักษณ์ ${result.tension.inwardCore} · ด้านนอกชี้ลักษณ์ ${result.tension.outwardCore} — ดูรายละเอียดด้านล่าง`}
    </p>}
    <p className="summary-caveat">
      ใช้เพื่อการสะท้อนตนเองและการทำงานร่วมกัน ไม่ใช่การวินิจฉัยหรือข้อสรุปตายตัว
    </p>
  </section>;
}


/**
 * The Personal User Manual — three sentences to hand to the people you work with.
 *
 * docs/ONSITE_ACTIVITY_50_MIN.md runs this on paper at minutes 39-47, and docs/UX_REVIEW_2026-09-10.md
 * calls it the highest-value thing missing from the app. The result page already knows enough to
 * start all three sentences, so asking a participant to write them from nothing is asking them to
 * redo work the assessment just did.
 *
 * Pre-filled and editable, in that order. A blank line after a ten-minute assessment is a worse
 * prompt than a wrong one: a sentence you disagree with tells you immediately what you do think,
 * and the field exists so that disagreement has somewhere to go. Whatever is typed is what prints.
 *
 * The text stays in this component and in the printed report. It is deliberately NOT in the
 * session code or the JSON: those go to whoever is checking the scoring, and a sentence about how
 * to work with you is not theirs to read.
 */
function UserManual({ core, nickname }: { core: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; nickname: string }) {
  const defaults = USER_MANUAL[core];
  const lines = [
    { key: "works", label: "ฉันทำงานได้ดีเมื่อ", value: defaults.worksBestThai },
    { key: "pressure", label: "เมื่อฉันกดดัน ช่วยฉันโดย", value: defaults.underPressureThai },
    { key: "assume", label: "อย่าคาดเดาว่า", value: defaults.doNotAssumeThai },
  ] as const;
  const [text, setText] = useState<Record<string, string>>(
    Object.fromEntries(lines.map((line) => [line.key, line.value])));
  const [copied, setCopied] = useState(false);

  const asPlainText = () => `คู่มือการทำงานกับ${nickname ? ` ${nickname}` : "ฉัน"}\n\n`
    + lines.map((line) => `${line.label} ${text[line.key]}`).join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asPlainText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // An in-app webview or an insecure origin can refuse the write outright. The text is on
      // screen and selectable, so the fallback is to say so rather than to fail silently.
      setCopied(false);
    }
  };

  return <section className="user-manual" aria-labelledby="user-manual-title">
    <h2 id="user-manual-title">คู่มือการทำงานกับฉัน</h2>
    <p className="user-manual-note">
      สามประโยคสำหรับส่งให้คนที่ทำงานด้วย — เติมไว้ให้แล้วจากผลของคุณ แก้ได้ทุกบรรทัด
      ประโยคที่คุณไม่เห็นด้วยมีประโยชน์ที่สุด เพราะมันบอกว่าคุณคิดอย่างไรจริง ๆ
    </p>
    <dl className="user-manual-lines">
      {lines.map((line) => <div key={line.key}>
        <dt><label htmlFor={`manual-${line.key}`}>{line.label}</label></dt>
        <dd>
          <textarea id={`manual-${line.key}`} value={text[line.key]} rows={2}
            onChange={(event) => setText((current) => ({ ...current, [line.key]: event.target.value }))} />
          {/* What prints. A textarea prints its box and clips anything past the visible rows, so
              the printed report reads this mirror instead. */}
          <p className="manual-print">{text[line.key]}</p>
        </dd>
      </div>)}
    </dl>
    <button type="button" className="secondary-button" onClick={copy}>
      {copied ? "คัดลอกแล้ว ✓" : "คัดลอกทั้งสามบรรทัด"}
    </button>
  </section>;
}

/**
 * Getting a finished session out of the browser.
 *
 * Three actions for two different readers. The PDF is for the person -- theirs to keep, and the
 * thing that makes taking the assessment feel worth the ten minutes. The code and the JSON are for
 * whoever is checking whether the scoring is right, and they exist because a screenshot of a result
 * cannot do that job: it carries the verdict and loses the answers, and the verdict is the part
 * under test.
 *
 * Copy-to-clipboard is the primary action rather than the file download because the team will do
 * this on phones, where handling a downloaded file is far more work than pasting a line of text.
 *
 * Nothing is uploaded. The app has no backend; the person copies and decides who to give it to,
 * and the code shows them exactly what it contains -- including their own name, which is in there
 * because a calibration set has to know whose session is whose.
 */
function ExportRow({ result, answers, nickname, team, genderPresentation }: {
  result: AssessmentResult; answers: readonly AnswerRecord[];
  nickname: string; team: string; genderPresentation: string;
}) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [revealed, setRevealed] = useState(false);
  const session = buildSessionExport(answers, result, { nickname, team, genderPresentation });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.code);
      setCopied("done");
    } catch {
      // A clipboard write can be refused outright -- an insecure origin, a browser that gates it
      // behind a permission, an in-app webview. Falling back to showing the code beats a button
      // that silently does nothing, because the person can still select it by hand.
      setCopied("failed");
      setRevealed(true);
    }
    window.setTimeout(() => setCopied("idle"), 2600);
  };

  /**
   * The full report, as opposed to the one-page card.
   *
   * Two buttons because they are for two different moments. The card is what a person keeps and
   * what fits on one sheet; the full report is what they send to someone -- which is what this was
   * asked for -- and a summary is the wrong artefact for that: it carries the verdict and drops the
   * reasoning, and the reasoning is the part a reader needs.
   *
   * The print stylesheet stays an allow-list. This adds a class to the root element, opts the rest
   * of the sections in under that class, and takes it off again afterwards, so nothing is printable
   * by default and a section added later still has to be named before it appears in either export.
   *
   * <details> is the one thing CSS cannot do from here: a closed one renders nothing, so the
   * facilitator section would print as an empty bar. They are opened before printing and restored
   * to exactly the state the reader left them in.
   */
  const printFull = () => {
    const root = document.documentElement;
    const details = [...document.querySelectorAll<HTMLDetailsElement>(".result-wrap details")];
    const wasOpen = details.map((element) => element.open);
    const restore = () => {
      root.classList.remove("print-full");
      details.forEach((element, index) => { element.open = wasOpen[index]; });
      window.removeEventListener("afterprint", restore);
    };
    root.classList.add("print-full");
    details.forEach((element) => { element.open = true; });
    window.addEventListener("afterprint", restore);
    window.print();
    // afterprint is not fired by every browser, and a page left in print-full would print the wrong
    // thing next time. The timeout is the belt to that braces.
    window.setTimeout(restore, 1000);
  };

  const download = () => {
    const blob = new Blob([session.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = session.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <section className="export-row" aria-labelledby="export-title">
    <h2 id="export-title">เก็บผลของคุณไว้</h2>
    <p className="export-note">
      ไม่มีการส่งข้อมูลออกจากเครื่องคุณ — ทุกปุ่มนี้สร้างไฟล์หรือข้อความให้คุณเลือกเองว่าจะให้ใคร
    </p>
    <div className="export-actions">
      <button type="button" className="primary-button" onClick={() => window.print()}>
        PDF หน้าเดียว
      </button>
      <button type="button" className="secondary-button" onClick={printFull}>
        PDF ฉบับเต็ม
      </button>
      <button type="button" className="secondary-button" onClick={copy}>
        {copied === "done" ? "คัดลอกแล้ว ✓" : copied === "failed" ? "คัดลอกไม่ได้ — ดูโค้ดด้านล่าง" : "คัดลอกโค้ดผลลัพธ์"}
      </button>
      <button type="button" className="secondary-button" onClick={download}>
        ดาวน์โหลดไฟล์ข้อมูล (.json)
      </button>
    </div>
    <p className="export-hint">
      โค้ดผลลัพธ์เป็นข้อความบรรทัดเดียว เก็บคำตอบทั้ง {answers.length} ข้อไว้ครบ
      สำหรับส่งให้ทีมที่ตรวจความแม่นของแบบทดสอบ — วางในแชทได้เลย
      {" "}
      <button type="button" className="text-button" onClick={() => setRevealed((current) => !current)}>
        {revealed ? "ซ่อนโค้ด" : "ดูโค้ดก่อน"}
      </button>
    </p>
    {revealed && <code className="export-code">{session.code}</code>}
  </section>;
}

/**
 * A radar of the nine Enneagram scores.
 *
 * The reference tool's radar has six invented axes -- Achievement drive, Competence, Adaptability
 * and so on -- which look authoritative and are not measurements of anything the tool computed.
 * Ours plots the nine numbers the scorer actually produced, so every point on it is traceable to
 * the items that put it there. Less impressive, and true.
 *
 * Inline SVG on purpose: a chart library for one nine-point polygon would be the largest dependency
 * in the project.
 */
function ScoreRadar({ scores, core, wing }: {
  scores: Record<number, number>; core: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null; wing: number | null;
}) {
  const cores = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  const max = Math.max(...cores.map((c) => scores[c] ?? 0), 1);
  const size = 260;
  const centre = size / 2;
  const radius = size / 2 - 34;
  // Start at twelve o'clock so core 1 sits at the top and the ring reads clockwise like the symbol.
  const pointAt = (index: number, distance: number) => {
    const angle = (Math.PI * 2 * index) / cores.length - Math.PI / 2;
    return [centre + Math.cos(angle) * distance, centre + Math.sin(angle) * distance] as const;
  };
  const polygon = cores
    .map((c, index) => pointAt(index, ((scores[c] ?? 0) / max) * radius))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  return <figure className="score-radar">
    <svg viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={core === null
        ? "แผนภาพคะแนนทั้งเก้าลักษณ์ ผลครั้งนี้ยังไม่มีลักษณ์ใดนำชัด"
        : `แผนภาพคะแนนทั้งเก้าลักษณ์ ลักษณ์ที่สูงที่สุดคือ ${core}`}>
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} className="radar-ring"
          points={cores.map((_, index) => pointAt(index, radius * ring))
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} />
      ))}
      {cores.map((_, index) => {
        const [x, y] = pointAt(index, radius);
        return <line key={index} className="radar-spoke" x1={centre} y1={centre} x2={x} y2={y} />;
      })}
      <polygon className="radar-shape" points={polygon} />
      {cores.map((c, index) => {
        const [x, y] = pointAt(index, radius + 15);
        const emphasis = c === core ? "radar-label-core" : c === wing ? "radar-label-wing" : "";
        return <text key={c} className={`radar-label ${emphasis}`} x={x} y={y}
          textAnchor="middle" dominantBaseline="middle">{c}</text>;
      })}
    </svg>
    <figcaption>
      คะแนนทั้งเก้าลักษณ์จากคำตอบของคุณ — ตัวเลขรอบวงคือหมายเลขลักษณ์ ยิ่งไกลจากจุดกลางยิ่งได้คะแนนมาก
    </figcaption>
  </figure>;
}

/**
 * Where the two lenses agree and where they pull against each other.
 *
 * Shown only when the MBTI type resolved, and labelled as an observation rather than a finding --
 * see the header of lib/cross-reading.ts for why that labelling is load-bearing rather than modest.
 */
function CrossReadingSection({ core, mbtiType }: {
  core: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; mbtiType: string | null;
}) {
  const reading = crossReading(core, mbtiType as never);
  if (!reading) return null;
  // Collapsed for the same reason as the depth section, and with less to lose: this is a stated
  // correspondence between two frameworks, not a finding, and it says so inside. 543px.
  return <details className="cross-reading">
    <summary>
      <span className="step-label">สองมุมมองมาเจอกัน</span>
      <h2 id="cross-title">{`MBTI ${mbtiType} กับ ลักษณ์ ${core} ตรงไหนเสริมกัน ตรงไหนดึงกัน`}</h2>
      <span className="details-teaser">{`${reading.amplifies.length} ข้อที่เสริมกัน · ${reading.pulls.length} ข้อที่ดึงกัน`}</span>
    </summary>
    <div className="cross-grid">
      <article className="cross-column cross-amplify">
        <h3>เสริมกัน</h3>
        <ul>{reading.amplifies.map((item) => (
          <li key={item.pole}><b>{item.label}</b><span>{item.lineThai}</span></li>
        ))}</ul>
      </article>
      <article className="cross-column cross-pull">
        <h3>ดึงกัน</h3>
        <ul>{reading.pulls.map((item) => (
          <li key={item.pole}><b>{item.label}</b><span>{item.lineThai}</span></li>
        ))}</ul>
      </article>
    </div>
    <p className="cross-caveat">
      ส่วนนี้เป็น <b>ข้อสังเกต ไม่ใช่ผลการวัด</b> — คะแนนลักษณ์ของคุณคำนวณจากคำตอบเสร็จก่อนแล้ว
      ส่วนนี้ไม่ได้เข้าไปเปลี่ยนผล ถ้าอ่านแล้วไม่ตรงกับตัวเอง ให้เชื่อตัวเองก่อน
    </p>
  </details>;
}

function CharacterVisual({ character, ambiguous, sceneKit, mbtiConfidence, enneagramConfidence }: { character: ResolvedCharacterProfile; ambiguous: boolean; sceneKit: CharacterSceneKit; mbtiConfidence: LivingCharacterConfidence; enneagramConfidence: LivingCharacterConfidence }) {
  const [assetFailed, setAssetFailed] = useState(false);
  // Confidence is forwarded verbatim so the resolver stays the single owner of the ambiguity rule:
  // "close" keeps the behavior it already had, "ambiguous" still routes to the neutral fallback.
  const resolvedVisual = resolveLivingCharacterVisual({
    schemaVersion: LIVING_CHARACTER_SCHEMA_VERSION,
    enabled: LIVING_CHARACTER_PILOT_ENABLED,
    core: character.enneagramType,
    mbti: character.mbtiBaseType,
    mbtiConfidence,
    enneagramConfidence,
    presentation: character.genderPresentation,
    existingAssetPath: character.assetPath,
    existingAlt: character.coreProfile.accessibilityDescriptionThai,
  });
  const showAsset = Boolean(resolvedVisual.visual.assetPath) && !assetFailed;

  return <div className={`neutral-result character-stage tone-${sceneKit.tone} ${ambiguous ? "active" : ""}`}>
    {showAsset ? <>
      <div className={`scene-kit kit-${sceneKit.primaryObject} anchor-${sceneKit.compositionAnchor} tiles-${sceneKit.tileLayout}`} aria-hidden="true">
        <div className={`scene-primary ${sceneKit.wingAccent ? `has-wing-${sceneKit.wingAccent}` : ""}`}><i /><i /><i /><i /><i /></div>
        <div className="scene-secondary-stack">
          {sceneKit.secondaryObjects.map((object, index) => <div className={`scene-secondary secondary-${index + 1}`} data-object={object} key={object}><i /><i /><i /></div>)}
        </div>
      </div>
      <Image className="result-character-image" src={resolvedVisual.visual.assetPath} alt={resolvedVisual.visual.alt} fill sizes="(max-width: 760px) 82vw, 320px" onError={() => setAssetFailed(true)} />
    </> : <div className="character-fallback" role="img" aria-label={ambiguous ? "ภาพกลางสำหรับผลที่ยังไม่ชัดเจน" : character.coreProfile.accessibilityDescriptionThai}><span>✦</span><b>{ambiguous ? "สำรวจต่อ" : character.typeLabel}</b></div>}
  </div>;
}

const previewOptions: readonly { presentation: GenderPresentation; label: string }[] = [
  { presentation: "female", label: "ผู้หญิง" },
  { presentation: "male", label: "ผู้ชาย" },
  { presentation: "neutral", label: "ไม่ระบุ" },
];

function CoreFiveDevPreview() {
  const [presentation, setPresentation] = useState<GenderPresentation>("neutral");
  // Gender presentation is visual-only and never affects scoring or the real assessment result.
  const sampleCharacter = getCharacterProfile("INTJ-A", 5, 6, presentation);

  return <aside className="core-five-dev-preview" aria-labelledby="core-five-preview-title">
    <div className="dev-preview-copy">
      <span className="step-label">DEVELOPMENT PREVIEW</span>
      <h2 id="core-five-preview-title">ตัวอย่างตรวจภาพ Core 5 — สำหรับพัฒนาในเครื่องเท่านั้น</h2>
      <p>ตัวอย่างจำลอง: INTJ-A × 5w6 · ไม่เปลี่ยนผลแบบประเมินจริง</p>
      <div className="dev-preview-controls" role="group" aria-label="เลือกภาพนำเสนอตัวละครตัวอย่าง">
        {previewOptions.map((option) => <button
          key={option.presentation}
          type="button"
          aria-pressed={presentation === option.presentation}
          onClick={() => setPresentation(option.presentation)}
        >{option.label}</button>)}
      </div>
      <code>{sampleCharacter.assetPath}</code>
    </div>
    <CharacterVisual key={sampleCharacter.assetPath} character={sampleCharacter} ambiguous={false} sceneKit={resolveCharacterSceneKit("INTJ", "right", "A")} mbtiConfidence="clear" enneagramConfidence="clear" />
  </aside>;
}

const gateCOptions = ["INTJ", "ENFP", "ISTJ", "ESFP"] as const satisfies readonly VisualMbti[];

function GateCDevPreview() {
  const [mbti, setMbti] = useState<(typeof gateCOptions)[number]>("INTJ");
  // Core 2 art is unavailable, so every state deliberately shares the same non-persisted Core 5 Female base asset.
  const sampleCharacter = getCharacterProfile(`${mbti}-A`, 5, 6, "female");
  const sceneKit = resolveCharacterSceneKit(mbti, "right", "A");

  return <aside className="core-five-dev-preview gate-c-dev-preview" aria-labelledby="gate-c-preview-title">
    <div className="dev-preview-copy">
      <span className="step-label">GATE C REVIEW</span>
      <h2 id="gate-c-preview-title">visual modifier prototype — base asset only</h2>
      <p>ตัวอย่างจำลอง Core 2 · ใช้ภาพฐานเดียวกันทุกสถานะ · ไม่เปลี่ยนผลแบบประเมินจริง</p>
      <div className="scene-kit-switcher" role="group" aria-label="เลือกสถานะตัวอย่าง MBTI และ Core 2">
        {gateCOptions.map((option) => <button key={option} type="button" aria-pressed={mbti === option} onClick={() => setMbti(option)}>{option} × Core 2</button>)}
      </div>
      <dl className="modifier-token-list">{Object.entries(sceneKit).map(([token, value]) => <div key={token}><dt>{token}</dt><dd>{Array.isArray(value) ? value.join(", ") : value}</dd></div>)}</dl>
    </div>
    <CharacterVisual character={sampleCharacter} ambiguous={false} sceneKit={sceneKit} mbtiConfidence="clear" enneagramConfidence="clear" />
  </aside>;
}

export default function ResultView({ result, answers, character, nickname, team, genderPresentation, consent, onRestart }: Props) {
  const insight = composeResultNarrative(result);
  const ambiguous = result.mbti.status === "ambiguous" || result.enneagram.status === "ambiguous";
  const wingAccent = character.wingStatus === "valid" ? character.wing === character.coreProfile.leftWing.type ? "left" : "right" : null;
  const identity = character.mbtiType.endsWith("-A") ? "A" : character.mbtiType.endsWith("-T") ? "T" : null;
  const sceneKit = resolveCharacterSceneKit(ambiguous ? null : character.mbtiBaseType, ambiguous ? null : wingAccent, ambiguous ? null : identity);
  const typeLabel = `${result.mbti.type ?? `${result.mbti.candidate} / ${result.mbti.runnerUp}`} × Enneagram ${result.enneagram.core ? `${result.enneagram.core}${result.wingStatus === "valid" ? `w${result.wing}` : ""}` : `${result.enneagram.top.value} / ${result.enneagram.runnerUp.value}`}`;
  return <div className="result-wrap result-insights fade-in">
    {/* Before the hero on purpose. The hero is the character and the narrative; this is the answer.
        A reader who stops after one screen should have the answer, not the illustration. */}
    <SummaryCard result={result} nickname={nickname} team={team} mbtiLabel={typeLabel} />
    {/* Directly under the card, because the card is what the PDF prints and the code is what the
        calibration run needs — both are actions on the thing just above them. */}
    {/* A sibling of the card rather than part of it. The card is 772px on a 390x844 phone and that
        one-screen fit is the property it exists for; a 260px radar inside it would spend the fit on
        a chart nobody needs in the first sixty seconds. It still prints -- the PDF has room. */}
    {/* Ungated on purpose, unlike the sections below it. Those make a claim about one core and
        need one; this is a picture of the nine scores, and a reader whose result came out close is
        exactly the reader who wants to see how close. */}
    <ScoreRadar scores={result.scores.enneagram} core={result.enneagram.core}
      wing={result.wingStatus === "valid" ? result.wing : null} />
    <ExportRow result={result} answers={answers} nickname={nickname} team={team} genderPresentation={genderPresentation} />
    <section className={`result-hero ${ambiguous ? "result-ambiguous" : ""}`} aria-labelledby="result-overview-title"><div className="result-copy"><span className="kicker">ภาพรวมของคุณ · {confidenceThai[result.enneagram.confidence]}</span><p className="result-owner">ผลของ {nickname} · ทีม {team}</p><h1 id="result-overview-title">{ambiguous ? "แนวโน้มที่ยังใกล้เคียงกัน" : character.coreProfile.titleThai}</h1><div className="type-code">{typeLabel}</div><p className="character-summary">{insight.narrative}</p><small>ใช้เพื่อการสะท้อนตนเองและพัฒนาการทำงานร่วมกัน ไม่ใช่การวินิจฉัยหรือข้อสรุปตายตัว</small></div><CharacterVisual key={character.assetPath} character={character} ambiguous={ambiguous} sceneKit={sceneKit} mbtiConfidence={result.mbti.confidence} enneagramConfidence={result.enneagram.confidence} /></section>
    <section className="result-model-note" aria-labelledby="result-model-title"><h2 id="result-model-title">ผลลัพธ์เดียวกัน มองคุณจาก 2 มุม</h2><p><strong>MBTI</strong> ช่วยอธิบายวิธีคิดและการตัดสินใจ ส่วน <strong>Enneagram</strong> สะท้อนแรงขับภายใน โดย <strong>Wing</strong> เป็นรายละเอียดที่ช่วยขยายแนวโน้ม Enneagram ของคุณ</p>{ambiguous && <p className="result-model-caution">ผลครั้งนี้เป็นแนวโน้มเบื้องต้น เพราะบางด้านยังมีคะแนนใกล้เคียงกัน</p>}</section>
    {/* After the hero, because the manual speaks in the voice of a named type and the hero is
        where that type is named. Gated on the core for the same reason. */}
    {result.enneagram.core !== null && result.enneagram.confidence !== "ambiguous"
      && <UserManual core={result.enneagram.core} nickname={nickname} />}
    {/* Gated on the Enneagram alone, not on the page's combined `ambiguous` flag. That flag is true
        when EITHER lens is unclear, and this section is entirely about the Enneagram core -- hiding
        a person's fear, levels and arrows because their MBTI axes came out close would withhold the
        half of the result that did resolve. A named core is the only precondition. */}
    {result.enneagram.core !== null && result.enneagram.confidence !== "ambiguous"
      && <DepthSection core={result.enneagram.core} wing={result.wingStatus === "valid" ? result.wing : null} />}
    {/* After the arrows, which explain why two answers CAN point different ways, and before the
        insight grid, which assumes one core. This says yours actually did. */}
    {result.tension !== null && <TensionNote tension={result.tension} />}
    {result.enneagram.core !== null && result.enneagram.confidence !== "ambiguous"
      && <CrossReadingSection core={result.enneagram.core} mbtiType={result.mbti.type} />}
    {result.enneagram.core !== null && result.enneagram.confidence !== "ambiguous"
      && <TensionMap core={result.enneagram.core} wing={result.wingStatus === "valid" ? result.wing : null}
        mbtiType={result.mbti.type} lensTension={result.tension} />}
    <div className="insight-grid"><InsightCard title="สิ่งที่ขับเคลื่อนคุณ" items={insight.motivation} /><InsightCard title="สไตล์การทำงานของคุณ" items={insight.workStyle} /><InsightCard title="เมื่อเจองานกดดัน" items={insight.pressure} soft /><InsightCard title="ทำงานร่วมกับคุณอย่างไรให้ลื่นขึ้น" items={insight.collaboration} /><InsightCard title="สิ่งที่ลองฝึกต่อได้" items={insight.growth} soft /></div>
    {consent && <details className="facilitator-details"><summary>แนวทางคุยต่อสำหรับหัวหน้า / HR<span className="details-teaser">{`${insight.facilitatorPrompts.length} คำถามสำหรับคุยหนึ่งต่อหนึ่ง · ${insight.managerSupport.length} สิ่งที่หัวหน้าช่วยได้`}</span></summary><div className="facilitator-content"><section><h3>คำถามสำหรับคุยหนึ่งต่อหนึ่ง</h3><ul>{insight.facilitatorPrompts.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>สิ่งที่หัวหน้าช่วยได้</h3><ul>{insight.managerSupport.map((item) => <li key={item}>{item}</li>)}</ul></section><p className="privacy-reminder">ใช้เพื่อสนับสนุนการพัฒนาและการทำงานร่วมกันเท่านั้น ไม่ใช้ตัดสินผลงาน โอกาส หรือคุณค่าของบุคคล</p></div></details>}
    {process.env.NODE_ENV === "development" && <><CoreFiveDevPreview /><GateCDevPreview /></>}
    <details className="mapping-details"><summary>รายละเอียดการจับคู่ตัวละครสำหรับทีมงาน</summary><div className="design-recipe"><div><span className="step-label">MAPPING REVIEW</span><h2>Character design recipe</h2></div><dl><div><dt>Core</dt><dd>{ambiguous ? "Neutral fallback" : character.characterDesignRecipe.core}</dd></div><div><dt>Wing</dt><dd>{result.wingStatus === "valid" ? result.wing : "Ambiguous"}</dd></div><div><dt>MBTI visual energy</dt><dd>{ambiguous ? "Neutral" : character.characterDesignRecipe.mbtiVisualEnergy}</dd></div><div><dt>Presentation</dt><dd>{character.characterDesignRecipe.presentation}</dd></div></dl></div></details><button className="secondary-button restart" onClick={onRestart}>↻ ทำแบบประเมินอีกครั้ง</button>
  </div>;
}
