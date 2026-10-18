import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { Notice } from "../components/Shared.jsx";
export default function Exam() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null),
    [answers, setAnswers] = useState({}),
    [index, setIndex] = useState(0),
    [seconds, setSeconds] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submitting = useRef(false),
    deadline = useRef(0),
    lastRetry = useRef(0);
  async function submit(automatic = false) {
    if (
      submitting.current ||
      (!automatic &&
        !window.confirm(
          "தேர்வைச் சமர்ப்பிக்கவா? பின்னர் விடைகளை மாற்ற முடியாது.",
        ))
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post(`/attempts/${id}/submit`);
      nav(`/result/${id}`, { replace: true });
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function load() {
    try {
      const { data: d } = await api.get(`/attempts/${id}/questions`);
      if (d.status !== "Active") {
        nav(`/result/${id}`, { replace: true });
        return;
      }
      setData(d);
      setAnswers(
        Object.fromEntries(d.answers.map((a) => [a.questionId, a.optionId])),
      );
      deadline.current =
        performance.now() +
        Math.max(0, new Date(d.expiresAt) - new Date(d.serverNow));
      setSeconds(Math.ceil((deadline.current - performance.now()) / 1000));
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - performance.now()) / 1000),
      );
      setSeconds(left);
      if (left === 0 && Date.now() - lastRetry.current > 5000) {
        lastRetry.current = Date.now();
        submit(true);
      }
    }, 500);
    return () => clearInterval(t);
  }, [data, id]);
  useEffect(() => {
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e) => {
      const a = e.target.closest("a");
      if (
        a &&
        !a.getAttribute("href")?.startsWith("#") &&
        !window.confirm(
          "தேர்விலிருந்து வெளியேறவா? சேமித்த விடைகள் இருக்கும்; நேரம் தொடரும்.",
        )
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", click, true);
    };
  }, []);
  async function choose(questionId, optionId) {
    setBusy(true);
    setError("");
    try {
      const { data: d } = await api.put(`/attempts/${id}/answers`, {
        questionId,
        optionId,
      });
      if (d.status !== "Active") {
        nav(`/result/${id}`, { replace: true });
        return;
      }
      setAnswers((a) => ({ ...a, [questionId]: optionId }));
    } catch (e) {
      setError(
        "விடை சேமிக்கப்படவில்லை. மீண்டும் தேர்வு செய்க. " + errorText(e),
      );
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <main id="main" className="shell page">
        <Notice error={error} />
        <p>தேர்வு ஏற்றப்படுகிறது…</p>
        <button onClick={load}>மீண்டும் முயற்சி</button>
      </main>
    );
  const q = data.questions[index];
  return (
    <main id="main" className="shell page">
      <div className="exam-header">
        <div>
          <h1>{data.title}</h1>
          <p>
            {Object.keys(answers).length} / {data.questions.length} விடைகள்
            சேமிக்கப்பட்டன
          </p>
        </div>
        <div
          className={"timer " + (seconds < 300 ? "urgent" : "")}
          role="timer"
          aria-label="மீதமுள்ள நேரம்"
        >
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </div>
      </div>
      <Notice error={error} />
      <div className="exam-layout">
        <section className="panel">
          <p className="eyebrow">
            வினா {index + 1} / {data.questions.length} · {q.marks} மதிப்பெண்கள்
          </p>
          <fieldset disabled={busy || seconds === 0}>
            <legend className="question">{q.questionText}</legend>
            {q.diagramKey && (
              <img
                className="question-diagram"
                src={`/question-assets/${q.diagramKey}.svg`}
                alt={q.diagramAlt}
              />
            )}
            {q.options.map((o) => (
              <label
                key={o.id}
                className={
                  "answer " + (answers[q.id] === o.id ? "selected" : "")
                }
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === o.id}
                  onChange={() => choose(q.id, o.id)}
                />
                <strong>{o.key}</strong> {o.text}
              </label>
            ))}
          </fieldset>
          <p role="status" className="note">
            {busy
              ? "சேமிக்கிறது…"
              : answers[q.id]
                ? "விடை சேமிக்கப்பட்டது"
                : "ஒரு விடையைத் தேர்வு செய்யுங்கள்"}
          </p>
          <div className="actions">
            <button
              disabled={index === 0 || busy}
              onClick={() => setIndex((i) => i - 1)}
            >
              முந்தையது
            </button>
            <button
              disabled={index === data.questions.length - 1 || busy}
              onClick={() => setIndex((i) => i + 1)}
            >
              அடுத்தது
            </button>
          </div>
        </section>
        <aside className="panel">
          <h2>வினா வழிசெலுத்தல்</h2>
          <div className="question-grid">
            {data.questions.map((item, i) => (
              <button
                key={item.id}
                disabled={busy}
                className={
                  (answers[item.id] ? "done " : "") +
                  (i === index ? "current" : "")
                }
                aria-label={`வினா ${i + 1}${answers[item.id] ? ", விடை சேமிக்கப்பட்டது" : ""}`}
                aria-current={i === index ? "step" : undefined}
                onClick={() => setIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="note">
            பச்சை = விடை சேமிக்கப்பட்டது. நேரம் முடிந்தால் சேமித்த விடைகள் தானாக
            மதிப்பிடப்படும்.
          </p>
          <button className="button" disabled={busy} onClick={() => submit()}>
            தேர்வைச் சமர்ப்பி
          </button>
        </aside>
      </div>
    </main>
  );
}
