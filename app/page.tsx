"use client";

import { useEffect, useMemo, useState } from "react";
import { allQuestions } from "@/lib/assessment/questions";
import { scoreAssessment } from "@/lib/assessment/scoring";
import { selectNextQuestion } from "@/lib/assessment/selector";
import type { Answer, Question } from "@/lib/assessment/types";
import { TOTAL_QUESTIONS } from "@/lib/assessment/types";

type View = "intro" | "quiz" | "result";
const STORAGE_KEY = "guild-within-session-v1";
const choices = [
  { value: 1, label: "ไม่เหมือนฉัน", short: "ไม่เลย" },
  { value: 2, label: "ค่อนข้างไม่เหมือน", short: "ไม่ค่อย" },
  { value: 3, label: "กึ่งกลาง", short: "กลาง ๆ" },
  { value: 4, label: "ค่อนข้างเหมือน", short: "ค่อนข้าง" },
  { value: 5, label: "เหมือนฉันมาก", short: "มาก" },
];

export default function Home() {
  const [view, setView] = useState<View>("intro");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { answers: Answer[]; questionIds: string[]; view: View };
        setAnswers(data.answers);
        setQuestions(data.questionIds.map((id) => allQuestions.find((q) => q.id === id)).filter(Boolean) as Question[]);
        setView(data.view);
      }
    } finally { setReady(true); }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, questionIds: questions.map((q) => q.id), view }));
  }, [answers, questions, view, ready]);

  const current = questions[answers.length];
  const result = useMemo(() => scoreAssessment(answers), [answers]);

  function start() {
    const first = selectNextQuestion([], []);
    if (first) setQuestions([first]);
    setView("quiz");
  }

  function respond(value: number) {
    if (!current) return;
    const nextAnswers = [...answers, { questionId: current.id, value }];
    setAnswers(nextAnswers);
    if (nextAnswers.length === TOTAL_QUESTIONS) { setView("result"); return; }
    const next = selectNextQuestion(nextAnswers, questions.map((q) => q.id));
    if (next) setQuestions((previous) => [...previous.slice(0, nextAnswers.length), next]);
  }

  function back() {
    if (!answers.length) { setView("intro"); return; }
    setAnswers((previous) => previous.slice(0, -1));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers([]); setQuestions([]); setView("intro");
  }

  if (!ready) return null;

  return (
    <main className="shell">
      <header className="brandbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setView("intro"); }} aria-label="Guild Within หน้าแรก">
          <span className="brandmark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>GUILD WITHIN</strong><small>PERSONALITY EXPEDITION</small></span>
        </a>
        <span className="privacy"><span>●</span> PRIVATE BY DEFAULT</span>
      </header>

      {view === "intro" && <section className="intro">
        <div className="eyebrow"><span>✦</span> MODERN WORKPLACE ADVENTURE</div>
        <h1>ค้นพบบทบาทของคุณ<br /><em>ในกิลด์แห่งการทำงาน</em></h1>
        <p className="lede">สำรวจพลังการคิด แรงขับภายใน และวิธีที่คุณร่วมสร้างทีม<br className="desktop" /> ผ่านสองกรอบบุคลิกภาพที่แยกจากกัน</p>
        <div className="frameworks">
          <article><span className="roman">I</span><div><b>MBTI</b><small>วิธีรับพลัง · มองโลก · ตัดสินใจ · ใช้ชีวิต</small></div></article>
          <span className="cross">×</span>
          <article><span className="ennea">9</span><div><b>ENNEAGRAM</b><small>แรงขับหลัก · Core Type · Wing</small></div></article>
        </div>
        <button className="primary" onClick={start}>เริ่มการสำรวจ <span>→</span></button>
        <div className="meta"><span>◷ <b>ประมาณ 8 นาที</b></span><span>◈ <b>24 คำถาม</b></span><span>◇ <b>บันทึกอัตโนมัติ</b></span></div>
        <p className="disclaimer">กิจกรรมนี้ใช้เพื่อการสำรวจตนเองและการทำงานร่วมกัน ไม่ใช่การวินิจฉัยทางจิตวิทยา<br />ผลลัพธ์ของคุณเป็นส่วนตัว และจะแชร์เมื่อคุณยินยอมเท่านั้น</p>
        <div className="guild-scene" aria-hidden="true">
          <span className="orb o1" /><span className="orb o2" />
          <div className="character c1"><i className="head"/><i className="body"/><i className="badge">T</i></div>
          <div className="character c2"><i className="head"/><i className="body"/><i className="badge">T</i></div>
          <div className="character c3"><i className="head"/><i className="body"/><i className="badge">T</i></div>
        </div>
      </section>}

      {view === "quiz" && current && <section className="quiz">
        <div className="progress-head"><span>ช่วงที่ {answers.length < 18 ? "1 · สำรวจพื้นฐาน" : "2 · เจาะสิ่งที่ยังไม่ชัด"}</span><b>{answers.length + 1} / {TOTAL_QUESTIONS}</b></div>
        <div className="progress"><i style={{ width: `${((answers.length + 1) / TOTAL_QUESTIONS) * 100}%` }} /></div>
        <article className="question-card">
          <span className="question-no">คำถามที่ {answers.length + 1}</span>
          <small>{current.context}</small>
          <h2>{current.prompt}</h2>
          <div className="choices">{choices.map((choice) => <button key={choice.value} onClick={() => respond(choice.value)} aria-label={choice.label}><i>{choice.value}</i><span>{choice.short}</span></button>)}</div>
          <div className="scale-label"><span>ไม่เหมือนฉัน</span><span>เหมือนฉันมาก</span></div>
        </article>
        <button className="back" onClick={back}>← ย้อนกลับ</button>
        <p className="autosave">✓ บันทึกคำตอบนี้ในอุปกรณ์ของคุณอัตโนมัติ</p>
      </section>}

      {view === "result" && <section className="result">
        <div className="eyebrow"><span>✦</span> YOUR GUILD PROFILE</div>
        <h1>พลังประจำกิลด์ของคุณ</h1>
        <p>ผลลัพธ์เบื้องต้นคำนวณทันทีจากคำตอบ โดยไม่ใช้ AI</p>
        <div className="result-grid">
          <article><small>MBTI</small><strong>{result.mbti.label}</strong><p>{result.mbti.label.includes("X") ? "มีบางแกนที่ยังใกล้เคียงกัน" : "รูปแบบการรับรู้และตัดสินใจที่เด่น"}</p><div className="confidence"><i style={{width:`${result.mbti.overall * 100}%`}} /></div><span>ความมั่นใจโดยรวม {Math.round(result.mbti.overall * 100)}%</span></article>
          <div className="result-cross">×</div>
          <article><small>ENNEAGRAM</small><strong>{result.enneagram.core ? `${result.enneagram.core}${result.enneagram.wing ? `w${result.enneagram.wing}` : " · Wing ยังไม่ชัด"}` : "Core ยังไม่ชัด"}</strong><p>{result.enneagram.core ? "แรงขับหลักที่มีแนวโน้มใกล้คุณ" : `ตัวเลือกใกล้เคียง: ${result.enneagram.alternatives.join(", ")}`}</p><div className="confidence"><i style={{width:`${result.enneagram.coreConfidence * 100}%`}} /></div><span>ความมั่นใจ Core {Math.round(result.enneagram.coreConfidence * 100)}%</span></article>
        </div>
        <div className="result-note"><b>ผลนี้เป็นจุดเริ่มต้น ไม่ใช่กล่องที่จำกัดคุณ</b><span>Cross-framework narrative จะเพิ่มภายหลังเมื่อทีมอนุมัติ AI integration</span></div>
        <button className="primary" onClick={reset}>สำรวจใหม่ <span>↻</span></button>
        <p className="disclaimer">คำตอบและผลลัพธ์เก็บในอุปกรณ์นี้เท่านั้นใน vertical slice ระยะแรก</p>
      </section>}
    </main>
  );
}
