import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { Badges, Notice } from "../components/Shared.jsx";
export default function Result({ adminId }) {
  const { id: routeId } = useParams();
  const id = adminId || routeId;
  const [result, setResult] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    setResult(null);
    setError("");
    api
      .get(adminId ? `/admin/attempts/${id}/result` : `/attempts/${id}/result`)
      .then((r) => setResult(r.data))
      .catch((e) => setError(errorText(e)));
  }, [id, adminId]);
  const content = (
    <>
      <Notice error={error} />
      {result ? (
        <>
          <section className="result-summary panel">
            <span className="eyebrow">உங்கள் முயற்சியின் முடிவு</span>
            <h1>{result.title}</h1>
            <div className="score">
              {result.score}
              <small> / {result.total}</small>
            </div>
            <p>{result.message}</p>
            <Badges items={result.rewards} />
            {result.status === "Expired" && (
              <p className="note">
                நேரம் முடிந்ததால் சேமித்த விடைகள் தானாக மதிப்பிடப்பட்டன.
              </p>
            )}
          </section>
          <h2>விடைகள் மற்றும் விளக்கங்கள்</h2>
          {result.questions.map((q, i) => (
            <article className="panel result-question" key={q.id}>
              <h3>
                {i + 1}. {q.questionText}
              </h3>
              {q.diagramKey && (
                <img
                  className="question-diagram"
                  src={`/question-assets/${q.diagramKey}.svg`}
                  alt={q.diagramAlt}
                />
              )}
              {q.options.map((o) => (
                <p
                  key={o.id}
                  className={
                    o.isCorrect
                      ? "correct"
                      : q.selectedOptionId === o.id
                        ? "incorrect"
                        : ""
                  }
                >
                  {o.key}. {o.text} {o.isCorrect ? "✓ சரியான விடை" : ""}
                  {q.selectedOptionId === o.id ? " · உங்கள் விடை" : ""}
                </p>
              ))}
              {!q.selectedOptionId && <p>விடை அளிக்கப்படவில்லை.</p>}
              <p className="explanation">{q.explanation}</p>
            </article>
          ))}
        </>
      ) : (
        !error && <p>முடிவு ஏற்றப்படுகிறது…</p>
      )}
      <Link to="/">முகப்புக்குச் செல்க</Link>
    </>
  );
  return adminId ? (
    <section>{content}</section>
  ) : (
    <main id="main" className="shell page">
      {content}
    </main>
  );
}
