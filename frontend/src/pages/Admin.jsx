import React, { useEffect, useState } from "react";
import { api, errorText } from "../services/api.js";
import { Field, Notice } from "../components/Shared.jsx";
import Result from "./Result.jsx";
const tabs = [
  ["dashboard", "Overview"],
  ["exams", "Exams & questions"],
  ["import", "JSON import"],
  ["payments", "Verify payments"],
  ["students", "Users"],
  ["subscriptions", "Subscriptions"],
  ["attempts", "Attempts"],
  ["rewards", "Reward rules"],
  ["settings", "Settings"],
  ["audit", "Audit log"],
];
const blank = {
  questionText: "",
  explanation: "",
  topic: "",
  marks: 2.5,
  displayOrder: 1,
  correctOptionKey: "A",
  diagramKey: null,
  diagramAlt: null,
  options: ["A", "B", "C"].map((key) => ({ key, text: "" })),
};
function ExamEditor({ id, onChange }) {
  const [exam, setExam] = useState(null),
    [question, setQuestion] = useState(blank),
    [questionId, setQuestionId] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setExam((await api.get(`/admin/exams/${id}`)).data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    load();
    setQuestion(blank);
    setQuestionId("");
  }, [id]);
  function edit(q) {
    setQuestionId(q.id);
    setQuestion({
      questionText: q.questionText,
      explanation: q.explanation,
      topic: q.topic,
      marks: q.marks,
      displayOrder: q.displayOrder,
      correctOptionKey: q.options.find((o) => o.isCorrect)?.key,
      diagramKey: q.diagramKey || null,
      diagramAlt: q.diagramAlt || null,
      options: q.options.map((o) => ({ key: o.key, text: o.text })),
    });
    setSuccess("");
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (questionId) await api.put(`/admin/questions/${questionId}`, question);
      else await api.post(`/admin/exams/${id}/questions`, question);
      setSuccess("Question saved. Teacher review is required again.");
      setQuestion({
        ...blank,
        displayOrder: Math.min(40, question.displayOrder + 1),
      });
      setQuestionId("");
      await load();
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function metadata(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const v = Object.fromEntries(new FormData(e.currentTarget));
      await api.put(`/admin/exams/${id}`, {
        ...v,
        durationMinutes: Number(v.durationMinutes),
        passPercentage: Number(v.passPercentage),
      });
      setSuccess("Exam updated.");
      await load();
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(qid) {
    if (!confirm("Delete this question?")) return;
    setBusy(true);
    try {
      await api.delete(`/admin/questions/${qid}`);
      await load();
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!exam) return <p>Loading editor…</p>;
  return (
    <section className="panel editor" lang="en">
      <h2>{exam.title}</h2>
      <p>
        Paid exams are immutable. Editing an unpaid exam resets teacher review
        and publication.
      </p>
      <Notice error={error} success={success} />
      <form onSubmit={metadata} key={exam.updatedAt}>
        <Field
          label="Title"
          name="title"
          defaultValue={exam.title}
          required
          maxLength={200}
        />
        <Field
          label="Description"
          name="description"
          defaultValue={exam.description}
          required
          maxLength={1500}
        />
        <div className="two-col">
          <Field
            label="Duration (minutes)"
            name="durationMinutes"
            type="number"
            min={5}
            max={120}
            defaultValue={exam.durationMinutes}
          />
          <Field
            label="Pass percentage"
            name="passPercentage"
            type="number"
            min={0}
            max={100}
            defaultValue={exam.passPercentage}
          />
        </div>
        <button disabled={busy}>Save exam details</button>
      </form>
      <div className="two-col">
        <div>
          <h3>Questions ({exam.questions.length}/40)</h3>
          {[...exam.questions]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((q) => (
              <div className="question-row" key={q.id}>
                <button onClick={() => edit(q)}>
                  {q.displayOrder}. {q.questionText}
                </button>
                <button
                  disabled={busy}
                  aria-label={`Delete question ${q.displayOrder}`}
                  onClick={() => remove(q.id)}
                >
                  Delete
                </button>
              </div>
            ))}
        </div>
        <form onSubmit={save}>
          <h3>{questionId ? "Edit question" : "Add question"}</h3>
          <label className="field">
            Question
            <textarea
              value={question.questionText}
              maxLength={4000}
              required
              onChange={(e) =>
                setQuestion({ ...question, questionText: e.target.value })
              }
            />
          </label>
          {question.options.map((o, i) => (
            <Field
              key={o.key}
              label={`Option ${o.key}`}
              value={o.text}
              maxLength={2000}
              required
              onChange={(e) =>
                setQuestion({
                  ...question,
                  options: question.options.map((item, j) =>
                    j === i ? { ...item, text: e.target.value } : item,
                  ),
                })
              }
            />
          ))}
          <div className="actions">
            <button
              type="button"
              onClick={() =>
                setQuestion({
                  ...question,
                  options:
                    question.options.length === 3
                      ? [...question.options, { key: "D", text: "" }]
                      : question.options.slice(0, 3),
                  correctOptionKey:
                    question.correctOptionKey === "D"
                      ? "A"
                      : question.correctOptionKey,
                })
              }
            >
              {question.options.length === 3
                ? "Add fourth option"
                : "Use three options"}
            </button>
          </div>
          <label className="field">
            Optional diagram
            <select
              value={question.diagramKey || ""}
              onChange={(e) =>
                setQuestion({
                  ...question,
                  diagramKey: e.target.value || null,
                  diagramAlt: e.target.value ? question.diagramAlt : null,
                })
              }
            >
              <option value="">None</option>
              {[1, 2, 3, 4, 5].flatMap((p) =>
                [26, 27, 28].map((q) => (
                  <option key={`${p}-${q}`} value={`paper-${p}-q-${q}`}>
                    Paper {p} / diagram {q}
                  </option>
                )),
              )}
            </select>
          </label>
          {question.diagramKey && (
            <>
              <img
                className="question-diagram"
                src={`/question-assets/${question.diagramKey}.svg`}
                alt={question.diagramAlt || "Diagram preview"}
              />
              <Field
                label="Accessible diagram description (Tamil)"
                required
                maxLength={1000}
                value={question.diagramAlt || ""}
                onChange={(e) =>
                  setQuestion({ ...question, diagramAlt: e.target.value })
                }
              />
            </>
          )}
          <label className="field">
            Correct answer
            <select
              value={question.correctOptionKey}
              onChange={(e) =>
                setQuestion({ ...question, correctOptionKey: e.target.value })
              }
            >
              {question.options.map((o) => (
                <option key={o.key}>{o.key}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Explanation (Tamil)
            <textarea
              value={question.explanation}
              required
              maxLength={6000}
              onChange={(e) =>
                setQuestion({ ...question, explanation: e.target.value })
              }
            />
          </label>
          <Field
            label="Topic"
            value={question.topic}
            required
            maxLength={100}
            onChange={(e) =>
              setQuestion({ ...question, topic: e.target.value })
            }
          />
          <Field
            label="Display order (1–40)"
            type="number"
            min={1}
            max={40}
            required
            value={question.displayOrder}
            onChange={(e) =>
              setQuestion({ ...question, displayOrder: Number(e.target.value) })
            }
          />
          <p>2.5 marks per question · 100 total marks</p>
          <div className="actions">
            <button className="button" disabled={busy}>
              Save question
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestion(blank);
                setQuestionId("");
              }}
            >
              New question
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
function Rows({ rows, actions }) {
  if (!rows.length) return <p>No records.</p>;
  const columns = Object.keys(rows[0]).filter(
    (k) =>
      ![
        "id",
        "studentId",
        "payerId",
        "paymentId",
        "reviewedBy",
        "actorId",
        "examId",
        "target",
        "idempotencyKey",
        "entitlements",
      ].includes(k),
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((k) => (
              <th key={k}>{k}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map((k) => (
                <td key={k}>
                  {typeof r[k] === "object"
                    ? JSON.stringify(r[k])
                    : String(r[k] ?? "")}
                </td>
              ))}
              {actions && <td>{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Admin() {
  const [tab, setTab] = useState("dashboard"),
    [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [payment, setPayment] = useState(null),
    [json, setJson] = useState("");
  async function load() {
    if (tab === "import") return;
    try {
      setData((await api.get(`/admin/${tab}`, { params: { page } })).data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    setData(null);
    setError("");
    setSuccess("");
    setSelected("");
    setPayment(null);
    load();
  }, [tab, page]);
  async function action(fn, message = "Saved.") {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      setSuccess(message);
      await load();
      return true;
    } catch (e) {
      setError(
        e instanceof SyntaxError ? "Invalid JSON: " + e.message : errorText(e),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function publish(id) {
    if (
      !confirm(
        "Confirm that a qualified teacher has checked ALL 40 questions, correct answers, Tamil language, difficulty and curriculum alignment. Publish?",
      )
    )
      return;
    await action(
      () =>
        api.post(`/admin/exams/${id}/publish`, { confirmTeacherReview: true }),
      "Published after teacher-review confirmation.",
    );
  }
  async function review(e) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    const ok = await action(
      () =>
        api.post(`/admin/payments/${payment.id}/${v.decision}`, {
          bankVerified: v.bankVerified === "on",
          note: v.note,
        }),
      "Payment reviewed.",
    );
    if (ok) setPayment(null);
  }
  async function importFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2000000) {
      setError("Maximum import size: 2 MB.");
      return;
    }
    setJson(await f.text());
  }
  return (
    <main id="main" className="shell page admin" lang="en">
      <h1>Administration</h1>
      <p>
        Review every paper before publication. Verify actual bank records before
        approving payment.
      </p>
      <div className="admin-tabs" role="navigation" aria-label="Admin sections">
        {tabs.map(([key, title]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <Notice error={error} success={success} />
      {tab === "dashboard" && data && (
        <div className="stats">
          {Object.entries(data).map(([k, v]) => (
            <article key={k}>
              <strong>{v}</strong>
              <span>{k}</span>
            </article>
          ))}
        </div>
      )}
      {tab === "exams" && (
        <>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              const v = Object.fromEntries(new FormData(e.currentTarget));
              action(() =>
                api.post("/admin/exams", {
                  ...v,
                  durationMinutes: 60,
                  passPercentage: 60,
                }),
              );
            }}
          >
            <h2>Create exam</h2>
            <Field label="Title" name="title" required maxLength={200} />
            <Field
              label="Description"
              name="description"
              required
              maxLength={1500}
            />
            <button disabled={busy}>Create draft</button>
          </form>
          {data && (
            <Rows
              rows={data}
              actions={(e) => (
                <div className="actions">
                  <button onClick={() => setSelected(e.id)}>
                    Edit questions
                  </button>
                  <button disabled={busy} onClick={() => publish(e.id)}>
                    Review & publish
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      action(() => api.post(`/admin/exams/${e.id}/unpublish`))
                    }
                  >
                    Unpublish
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Archive this unpaid exam?"))
                        action(() => api.post(`/admin/exams/${e.id}/archive`));
                    }}
                  >
                    Archive
                  </button>
                </div>
              )}
            />
          )}{" "}
          {selected && (
            <ExamEditor key={selected} id={selected} onChange={load} />
          )}
        </>
      )}
      {tab === "import" && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            action(
              () => api.post("/admin/import", JSON.parse(json)),
              "Import complete. Identical content was left unchanged; changed drafts need review.",
            );
          }}
        >
          <h2>Validated JSON import</h2>
          <p>
            Use data/imports/model-exams.ta.json from the source package.
            Maximum five exams; 40 questions each; three or four distinct
            options; 100 marks. Imports run atomically.
          </p>
          <input
            type="file"
            aria-label="Exam JSON file"
            accept=".json,application/json"
            onChange={importFile}
          />
          <label className="field">
            JSON
            <textarea
              className="json-input"
              value={json}
              onChange={(e) => setJson(e.target.value)}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            Validate & import
          </button>
        </form>
      )}
      {tab === "payments" && data && (
        <>
          <Rows
            rows={data}
            actions={(p) => (
              <>
                <small className="break">Student: {p.studentId}</small>
                {["Pending", "AwaitingReference"].includes(p.status) && (
                  <button onClick={() => setPayment(p)}>Review</button>
                )}
              </>
            )}
          />
          {payment && (
            <form className="panel" onSubmit={review}>
              <h2>
                Review {payment.reference} · LKR {payment.amount}
              </h2>
              <label className="field">
                Decision
                <select name="decision">
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </label>
              <label className="check">
                <input type="checkbox" name="bankVerified" />I verified this
                amount and reference against the actual bank/payment record.
              </label>
              <Field
                label="Verification / rejection note"
                name="note"
                required
                maxLength={500}
              />
              <button className="button" disabled={busy}>
                Save review
              </button>
            </form>
          )}
        </>
      )}
      {tab === "students" && data && (
        <Rows
          rows={data}
          actions={(u) => (
            <button
              disabled={busy}
              onClick={() => {
                if (confirm(`${u.disabled ? "Enable" : "Disable"} ${u.email}?`))
                  action(() => api.post(`/admin/students/${u.id}/toggle`));
              }}
            >
              {u.disabled ? "Enable" : "Disable"}
            </button>
          )}
        />
      )}
      {tab === "subscriptions" && data && (
        <Rows
          rows={data}
          actions={(s) => (
            <>
              <small className="break">Student: {s.studentId}</small>
              <button
                disabled={busy}
                onClick={() =>
                  action(() =>
                    api.post(
                      `/admin/subscriptions/${s.id}/${s.status === "Active" ? "suspend" : "resume"}`,
                    ),
                  )
                }
              >
                {s.status === "Active" ? "Suspend" : "Resume"}
              </button>
            </>
          )}
        />
      )}
      {tab === "attempts" && data && (
        <>
          <Rows
            rows={data}
            actions={(a) =>
              a.status !== "Active" && (
                <button onClick={() => setSelected(a.id)}>Review result</button>
              )
            }
          />
          {selected && <Result adminId={selected} />}
        </>
      )}
      {tab === "audit" && data && <Rows rows={data} />}
      {tab === "rewards" && data && (
        <>
          <p>
            Changes apply to future finalizations. Existing earned rewards
            remain unchanged.
          </p>
          {data.map((r) => (
            <form
              className="panel"
              key={r.id}
              onSubmit={(e) => {
                e.preventDefault();
                const v = Object.fromEntries(new FormData(e.currentTarget));
                action(() =>
                  api.put(`/admin/rewards/${r.code}`, {
                    threshold: Number(v.threshold),
                    enabled: v.enabled === "on",
                  }),
                );
              }}
            >
              <h3>
                {r.title} · {r.code}
              </h3>
              <Field
                label="Minimum percentage"
                name="threshold"
                type="number"
                min={0}
                max={100}
                defaultValue={r.threshold}
                required
              />
              <label className="check">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={r.enabled}
                />
                Enabled
              </label>
              {r.code === "SCHOLARSHIP_CHAMPION" && (
                <p>
                  Requires all five DISTINCT exams in the purchased package to
                  meet this threshold.
                </p>
              )}
              <button disabled={busy}>Save rule</button>
            </form>
          ))}
        </>
      )}
      {tab === "settings" && data && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Object.fromEntries(new FormData(e.currentTarget));
            action(() =>
              api.put("/admin/settings", {
                ...v,
                acceptPayments: v.acceptPayments === "on",
              }),
            );
          }}
        >
          <h2>Payment & contact settings</h2>
          <label className="field">
            Bank/payment instructions (visible to users)
            <textarea
              name="paymentInstructions"
              defaultValue={data.paymentInstructions}
              maxLength={4000}
            />
          </label>
          <Field
            label="Support email"
            name="contactEmail"
            type="email"
            defaultValue={data.contactEmail}
          />
          <label className="check">
            <input
              type="checkbox"
              name="acceptPayments"
              defaultChecked={data.acceptPayments}
            />
            Accept payments (also requires exactly five published, reviewed
            exams)
          </label>
          <p>
            Complete teacher review, business policies, support and deployment
            checks before enabling paid access.
          </p>
          <button className="button" disabled={busy}>
            Save settings
          </button>
        </form>
      )}
      {["payments", "students", "subscriptions", "attempts", "audit"].includes(
        tab,
      ) && (
        <div className="actions pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={!data || data.length < 50}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
      {!data && tab !== "import" && !error && <p>Loading…</p>}
    </main>
  );
}
