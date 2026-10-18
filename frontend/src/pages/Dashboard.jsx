import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { useAuth } from "../context/Auth.jsx";
import { Badges, Notice } from "../components/Shared.jsx";
export default function Dashboard({ studentId, embedded = false }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null),
    [exams, setExams] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  async function load() {
    setError("");
    try {
      const d = await api.get("/dashboard", { params: { studentId } });
      setData(d.data);
      if (!studentId) setExams((await api.get("/exams")).data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    load();
  }, [studentId]);
  async function start(id) {
    if (
      !window.confirm(
        "60 நிமிடத் தேர்வைத் தொடங்கவா? ஒரு அனுமதி பயன்படுத்தப்படும். விடைகள் சேமிக்கப்படும்; நேரம் நிறுத்தப்படாது.",
      )
    )
      return;
    setBusy(id);
    try {
      const { data: a } = await api.post(`/exams/${id}/attempts`);
      nav(a.status === "Active" ? `/exam/${a.id}` : `/result/${a.id}`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy("");
    }
  }
  const content = (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">கற்றல் பயணம்</span>
          <h1>
            {studentId
              ? "குழந்தையின் முன்னேற்றம்"
              : `வணக்கம், ${user.displayName}`}
          </h1>
        </div>
        {!studentId && (
          <Link className="button" to="/payments">
            தொகுப்பு / கட்டணம்
          </Link>
        )}
      </div>
      <Notice error={error} />
      {!data ? (
        <button onClick={load}>மீண்டும் ஏற்று</button>
      ) : (
        <>
          <div className="stats">
            <article>
              <strong>
                {data.subscriptions.reduce((a, s) => a + s.remaining, 0)}
              </strong>
              <span>மீதமுள்ள தேர்வுகள்</span>
            </article>
            <article>
              <strong>
                {data.attempts.filter((a) => a.status !== "Active").length}
              </strong>
              <span>முடித்த தேர்வுகள்</span>
            </article>
            <article>
              <strong>{data.rewards.length}</strong>
              <span>பாராட்டுப் பதக்கங்கள்</span>
            </article>
          </div>
          <h2>பெற்ற பதக்கங்கள்</h2>
          {data.rewards.length ? (
            <Badges items={data.rewards} />
          ) : (
            <p>முயற்சியைத் தொடங்குங்கள். ஒவ்வொரு படியும் முன்னேற்றமே!</p>
          )}
          {!studentId && (
            <>
              <h2>பயிற்சித் தேர்வுகள்</h2>
              {!exams.length && (
                <p>
                  ஆசிரியர் சரிபார்ப்பிற்குப் பிறகு தேர்வுகள் இங்கே தோன்றும்.
                </p>
              )}
              <div className="exam-grid">
                {exams.map((e) => {
                  const active = data.attempts.find(
                    (a) => a.examId === e.id && a.status === "Active",
                  );
                  const available = data.subscriptions.some((s) =>
                    s.entitlements.some((t) => t.examId === e.id && !t.used),
                  );
                  return (
                    <article className="panel" key={e.id}>
                      <h3>{e.title}</h3>
                      <p>
                        {e.questionCount} வினாக்கள் · {e.durationMinutes}{" "}
                        நிமிடங்கள் · 100 மதிப்பெண்கள்
                      </p>
                      <p className="note">
                        தேர்ச்சி: {e.passPercentage}% · தொடங்கிய பின் நேரம்
                        நிறுத்தப்படாது.
                      </p>
                      {active ? (
                        <Link className="button" to={`/exam/${active.id}`}>
                          தொடரவும்
                        </Link>
                      ) : (
                        <button
                          className="button"
                          disabled={!available || !!busy}
                          onClick={() => start(e.id)}
                        >
                          {busy === e.id
                            ? "தொடங்குகிறது…"
                            : available
                              ? "தேர்வைத் தொடங்கு"
                              : "அனுமதி தேவை / பயன்படுத்தப்பட்டது"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
          <h2>முயற்சிகள் மற்றும் முடிவுகள்</h2>
          {!data.attempts.length ? (
            <p>இன்னும் தேர்வுகள் எழுதப்படவில்லை.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>தேர்வு</th>
                    <th>நிலை</th>
                    <th>மதிப்பெண்</th>
                    <th>விவரம்</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.title}</td>
                      <td>
                        {a.status === "Active"
                          ? "நடைபெறுகிறது"
                          : a.status === "Expired"
                            ? "நேரம் முடிந்தது"
                            : "முடிந்தது"}
                      </td>
                      <td>
                        {a.status === "Active" ? "—" : `${a.percentage}%`}
                      </td>
                      <td>
                        {a.status !== "Active" ? (
                          <Link to={`/result/${a.id}`}>முடிவு</Link>
                        ) : (
                          !studentId && (
                            <Link to={`/exam/${a.id}`}>தொடரவும்</Link>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
  return embedded ? (
    <section>{content}</section>
  ) : (
    <main id="main" className="shell page">
      {content}
    </main>
  );
}
