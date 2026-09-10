"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import { MAX_QUESTIONS } from "./lib/assessment-data";
import { getCharacterProfile, type GenderPresentation } from "./lib/character-system";
import { scoreAssessment, sessionQuestions, type AnswerRecord } from "./lib/scoring";
import { INITIAL_PROFILE, type Profile } from "./lib/profile-contract";
import { getRoster } from "./lib/roster";
import ResultView from "./result-view";

type Step = "welcome" | "profile" | "questions" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [consent, setConsent] = useState(false);
  const [candidateNotice, setCandidateNotice] = useState(false);
  // Null today. When a roster exists the two text fields become one picker; see app/lib/roster.ts.
  const roster = useMemo(() => getRoster(), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [error, setError] = useState("");
  // The whole sequence is derived from the answers before each position rather than stored, so
  // going back and changing an answer re-derives every question after it instead of leaving the
  // session carrying an adaptive block chosen for answers that no longer exist.
  // Only as far as the answers reach, plus the one being asked now. Anything past that would be
  // selected from answers that do not exist yet.
  const questions = useMemo(() => sessionQuestions(answers), [answers]);
  const question = questions[index];
  const selected = answers[index]?.questionId === question?.id ? answers[index].optionIndex : null;
  const result = useMemo(() => scoreAssessment(answers), [answers]);
  // Thai gender choices map to visual presentation only and never participate in scoring.
  const gender: GenderPresentation = profile.gender === "ผู้หญิง" ? "female" : profile.gender === "ผู้ชาย" ? "male" : "neutral";
  const character = getCharacterProfile((result.mbti.type ?? result.mbti.candidate) as Parameters<typeof getCharacterProfile>[0], result.enneagram.core ?? result.enneagram.top.value, result.enneagram.core ? result.wing : null, gender);

  const update = (field: keyof Profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  const submitProfile = (event: FormEvent) => { event.preventDefault(); if (!profile.nameAndNickname.trim() || !profile.team.trim()) return setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบ"); if (!consent) return setError("กรุณายินยอมให้ใช้ข้อมูลเพื่อสรุปผลกิจกรรม"); setError(""); setStep("questions"); };
  // Answers are positional: index i is the answer to questions[i]. Changing one drops every answer
  // after it, because those questions were selected from this answer and may no longer be the
  // questions this respondent should see. Dropping them is the transparent invalidation the
  // blueprint asks for -- the alternative is scoring a session that was never coherent.
  const choose = (optionIndex: number) => { setAnswers((current) => [...current.slice(0, index), { questionId: question.id, optionIndex }]); setError(""); };
  const next = () => {
    if (selected === null) return setError("เลือกคำตอบที่ใกล้เคียงตัวคุณที่สุดก่อนนะ");
    if (index === MAX_QUESTIONS - 1) setStep("result"); else setIndex(index + 1);
  };
  const restart = () => { setStep("welcome"); setProfile(INITIAL_PROFILE); setConsent(false); setCandidateNotice(false); setIndex(0); setAnswers([]); setError(""); };

  return <main className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="site-header"><button className="brand" type="button" onClick={() => setStep("welcome")}><Image className="brand-logo" src="/brand/td-logo.png" alt="โลโก้ TD" width={52} height={52} /><span><b>TDFB</b><small>Personality Quest</small></span></button><span className="secure-note"><i /> พื้นที่สำหรับทำความเข้าใจตัวเอง</span></header>
    <section className={`stage stage-${step}`} aria-live="polite">
      {step === "welcome" && <div className="welcome-grid"><div className="hero-copy fade-in"><span className="kicker">รู้จักตัวเอง ทำงานร่วมกันได้ดีขึ้น</span><h1><span className="welcome-title-line">เข้าใจตัวเองให้ชัดขึ้น</span><span className="welcome-title-line">ทำงานและเติบโตไปด้วยกัน</span></h1><p className="hero-text">สำรวจรูปแบบการคิด แรงขับภายใน และวิธีทำงานที่เหมาะกับคุณ</p><div className="time-badge">◷ ใช้เวลาประมาณ 8–10 นาที · 24 ข้อ</div><fieldset className="audience-pick"><legend>คุณเข้ามาในฐานะใคร?</legend><div className="audience-options"><button className="primary-button" type="button" onClick={() => { setCandidateNotice(false); setStep("profile"); }}><b>พนักงานบริษัท</b><small>Employee · ทำได้เลย</small></button><button className="secondary-button" type="button" aria-describedby={candidateNotice ? "candidate-notice" : undefined} onClick={() => setCandidateNotice(true)}><b>ผู้สมัครงาน</b><small>Candidate · ยังไม่เปิด</small></button></div></fieldset>{candidateNotice && <p className="notice" id="candidate-notice" role="status">เส้นทางสำหรับผู้สมัครยังไม่เปิดใช้งาน — ต้องรอลิงก์และข้อความยินยอมจากฝ่ายบุคคลก่อน หากคุณเป็นผู้สมัคร กรุณาติดต่อฝ่ายบุคคล</p>}<p className="fine-print">ไม่มีคำตอบถูกหรือผิด เลือกคำตอบที่ใกล้เคียงคุณที่สุด</p></div><div className="hero-art fade-in-delayed"><div className="guild-visual"><Image src="/guild-characters-3d.webp" alt="ตัวละครสามแบบของ TDFB Personality Quest ยืนเรียงกัน ถือสมุดและการ์ดประจำแนวคิดของตัวเอง" fill sizes="(max-width: 899px) 92vw, 560px" preload /><span className="guild-orbit" /><span className="guild-logo"><Image src="/brand/td-logo.png" alt="โลโก้ TD" width={52} height={52} /></span></div></div></div>}
      {step === "profile" && <div className="form-layout fade-in"><aside className="side-intro"><span className="step-label">ขั้นตอนที่ 1</span><h1>ก่อนเริ่ม<br />ขอรู้จักคุณสักนิด</h1><p>ข้อมูลนี้อยู่ในหน้านี้เท่านั้น และใช้เพื่อแสดงผลให้ถูกคน</p></aside><form className="profile-card" onSubmit={submitProfile}><div className="card-heading"><span>ข้อมูลผู้เข้าร่วม</span><small><i>*</i> จำเป็น</small></div>{roster ? <label>ชื่อและชื่อเล่น <i>*</i><select value={profile.nameAndNickname} onChange={(e) => { const picked = roster.find((member) => member.name === e.target.value); update("nameAndNickname", e.target.value); if (picked) update("team", picked.team); }} autoFocus><option value="">เลือกชื่อของคุณ</option>{roster.map((member) => <option key={member.name} value={member.name}>{member.name}</option>)}</select></label> : <label>ชื่อและชื่อเล่น <i>*</i><input value={profile.nameAndNickname} onChange={(e) => update("nameAndNickname", e.target.value)} autoFocus /></label>}<fieldset><legend>เลือกภาพตัวละครที่ใกล้เคียงกับคุณ</legend><div className="segmented">{["ผู้หญิง", "ผู้ชาย", "ไม่ระบุ"].map((value) => <button className={profile.gender === value ? "active" : ""} type="button" key={value} onClick={() => update("gender", value)}>{value}</button>)}</div></fieldset><label>ทีม <i>*</i><input value={profile.team} onChange={(e) => update("team", e.target.value)} placeholder="เช่น People & Culture" /></label><label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>ยินยอมให้ใช้ข้อมูลเพื่อแสดงผลกิจกรรม <small>ไม่มีการส่งข้อมูลออกหรือบันทึกลงฐานข้อมูล</small></span></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-button full">เริ่มตอบคำถาม →</button><button className="text-button" type="button" onClick={() => setStep("welcome")}>← กลับหน้าก่อนหน้า</button></form></div>}
      {step === "questions" && question && <div className="question-wrap fade-in"><div className="progress-meta"><span>ข้อ {index + 1} จาก {MAX_QUESTIONS}</span><span>เหลือประมาณ {Math.max(1, Math.ceil((MAX_QUESTIONS-index-1)*24/60))} นาที</span></div><div className="progress-track" role="progressbar" aria-label="ความคืบหน้า" aria-valuemin={1} aria-valuemax={MAX_QUESTIONS} aria-valuenow={index + 1}><span style={{width:`${(index+1)/MAX_QUESTIONS*100}%`}} /></div><article className="question-card"><span className="step-label">{question.context}</span><h1>{question.prompt}</h1><p>เลือกข้อที่ตรงกับคุณมากกว่าในเวลาส่วนใหญ่</p><div className="answers">{question.options.map((option, optionIndex) => <button type="button" key={optionIndex} aria-pressed={selected === optionIndex} className={selected === optionIndex ? "selected" : ""} onClick={() => choose(optionIndex)}><span className="answer-key" aria-hidden="true">{String.fromCharCode(65+optionIndex)}</span><span className="answer-label">{option.text}</span><i aria-hidden="true">✓</i></button>)}</div>{error && <p className="error centered">{error}</p>}</article><div className="question-actions"><button className="secondary-button" onClick={() => index === 0 ? setStep("profile") : setIndex(index-1)}>← ย้อนกลับ</button><button className="primary-button" disabled={selected === null} onClick={next}>{index === MAX_QUESTIONS-1 ? "ดูผลลัพธ์" : "ถัดไป"} →</button></div></div>}
      {step === "result" && <ResultView result={result} character={character} nickname={profile.nameAndNickname} team={profile.team} consent={consent} onRestart={restart} />}
    </section><footer><span>PERSONALITY IS A MAP, NOT A BOX.</span><span>Made for TDFB team growth</span></footer>
  </main>;
}
