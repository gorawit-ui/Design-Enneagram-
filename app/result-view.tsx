import Image from "next/image";
import { useState } from "react";
import { getCharacterProfile, type GenderPresentation, type ResolvedCharacterProfile } from "./lib/character-system";
import { resolveCharacterSceneKit, type CharacterSceneKit, type VisualMbti } from "./lib/character-visual-modifiers";
import { LIVING_CHARACTER_SCHEMA_VERSION, resolveLivingCharacterVisual } from "./lib/living-character-resolver";
import type { AssessmentResult, Confidence } from "./lib/scoring";
import { composeResultNarrative } from "./lib/result-insights";

const confidenceThai: Record<Confidence, string> = { clear: "ชัดเจน", close: "แนวโน้มที่ใกล้เคียง", ambiguous: "ยังไม่ชัดเจน" };
type Props = { result: AssessmentResult; character: ResolvedCharacterProfile; nickname: string; team: string; consent: boolean; onRestart: () => void };

function InsightCard({ title, items, soft = false }: { title: string; items: readonly string[]; soft?: boolean }) {
  return <article className={`insight-card ${soft ? "insight-card-soft" : ""}`}><h2>{title}</h2><ul>{items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></article>;
}

function CharacterVisual({ character, ambiguous, sceneKit }: { character: ResolvedCharacterProfile; ambiguous: boolean; sceneKit: CharacterSceneKit }) {
  const [assetFailed, setAssetFailed] = useState(false);
  const resolvedVisual = resolveLivingCharacterVisual({
    schemaVersion: LIVING_CHARACTER_SCHEMA_VERSION,
    enabled: true,
    core: character.enneagramType,
    mbti: character.mbtiBaseType,
    mbtiConfidence: ambiguous ? "ambiguous" : "clear",
    enneagramConfidence: ambiguous ? "ambiguous" : "clear",
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
    <CharacterVisual key={sampleCharacter.assetPath} character={sampleCharacter} ambiguous={false} sceneKit={resolveCharacterSceneKit("INTJ", "right", "A")} />
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
    <CharacterVisual character={sampleCharacter} ambiguous={false} sceneKit={sceneKit} />
  </aside>;
}

export default function ResultView({ result, character, nickname, team, consent, onRestart }: Props) {
  const insight = composeResultNarrative(result);
  const ambiguous = result.mbti.status === "ambiguous" || result.enneagram.status === "ambiguous";
  const wingAccent = character.wingStatus === "valid" ? character.wing === character.coreProfile.leftWing.type ? "left" : "right" : null;
  const identity = character.mbtiType.endsWith("-A") ? "A" : character.mbtiType.endsWith("-T") ? "T" : null;
  const sceneKit = resolveCharacterSceneKit(ambiguous ? null : character.mbtiBaseType, ambiguous ? null : wingAccent, ambiguous ? null : identity);
  const typeLabel = `${result.mbti.type ?? `${result.mbti.candidate} / ${result.mbti.runnerUp}`} × Enneagram ${result.enneagram.core ? `${result.enneagram.core}${result.wingStatus === "valid" ? `w${result.wing}` : ""}` : `${result.enneagram.top.value} / ${result.enneagram.runnerUp.value}`}`;
  return <div className="result-wrap result-insights fade-in">
    <section className={`result-hero ${ambiguous ? "result-ambiguous" : ""}`} aria-labelledby="result-overview-title"><div className="result-copy"><span className="kicker">ภาพรวมของคุณ · {confidenceThai[result.enneagram.confidence]}</span><p className="result-owner">ผลของ {nickname} · ทีม {team}</p><h1 id="result-overview-title">{ambiguous ? "แนวโน้มที่ยังใกล้เคียงกัน" : character.coreProfile.titleThai}</h1><div className="type-code">{typeLabel}</div><p className="character-summary">{insight.narrative}</p><small>ใช้เพื่อการสะท้อนตนเองและพัฒนาการทำงานร่วมกัน ไม่ใช่การวินิจฉัยหรือข้อสรุปตายตัว</small></div><CharacterVisual key={character.assetPath} character={character} ambiguous={ambiguous} sceneKit={sceneKit} /></section>
    <section className="result-model-note" aria-labelledby="result-model-title"><h2 id="result-model-title">ผลลัพธ์เดียวกัน มองคุณจาก 2 มุม</h2><p><strong>MBTI</strong> ช่วยอธิบายวิธีคิดและการตัดสินใจ ส่วน <strong>Enneagram</strong> สะท้อนแรงขับภายใน โดย <strong>Wing</strong> เป็นรายละเอียดที่ช่วยขยายแนวโน้ม Enneagram ของคุณ</p>{ambiguous && <p className="result-model-caution">ผลครั้งนี้เป็นแนวโน้มเบื้องต้น เพราะบางด้านยังมีคะแนนใกล้เคียงกัน</p>}</section>
    <div className="insight-grid"><InsightCard title="สิ่งที่ขับเคลื่อนคุณ" items={insight.motivation} /><InsightCard title="สไตล์การทำงานของคุณ" items={insight.workStyle} /><InsightCard title="เมื่อเจองานกดดัน" items={insight.pressure} soft /><InsightCard title="ทำงานร่วมกับคุณอย่างไรให้ลื่นขึ้น" items={insight.collaboration} /><InsightCard title="สิ่งที่ลองฝึกต่อได้" items={insight.growth} soft /></div>
    {consent && <details className="facilitator-details"><summary>แนวทางคุยต่อสำหรับหัวหน้า / HR</summary><div className="facilitator-content"><section><h3>คำถามสำหรับคุยหนึ่งต่อหนึ่ง</h3><ul>{insight.facilitatorPrompts.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>สิ่งที่หัวหน้าช่วยได้</h3><ul>{insight.managerSupport.map((item) => <li key={item}>{item}</li>)}</ul></section><p className="privacy-reminder">ใช้เพื่อสนับสนุนการพัฒนาและการทำงานร่วมกันเท่านั้น ไม่ใช้ตัดสินผลงาน โอกาส หรือคุณค่าของบุคคล</p></div></details>}
    {process.env.NODE_ENV === "development" && <><CoreFiveDevPreview /><GateCDevPreview /></>}
    <details className="mapping-details"><summary>รายละเอียดการจับคู่ตัวละครสำหรับทีมงาน</summary><div className="design-recipe"><div><span className="step-label">MAPPING REVIEW</span><h2>Character design recipe</h2></div><dl><div><dt>Core</dt><dd>{ambiguous ? "Neutral fallback" : character.characterDesignRecipe.core}</dd></div><div><dt>Wing</dt><dd>{result.wingStatus === "valid" ? result.wing : "Ambiguous"}</dd></div><div><dt>MBTI visual energy</dt><dd>{ambiguous ? "Neutral" : character.characterDesignRecipe.mbtiVisualEnergy}</dd></div><div><dt>Presentation</dt><dd>{character.characterDesignRecipe.presentation}</dd></div></dl></div></details><button className="secondary-button restart" onClick={onRestart}>↻ ทำแบบประเมินอีกครั้ง</button>
  </div>;
}
