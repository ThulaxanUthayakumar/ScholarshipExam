import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { useAuth } from "../context/Auth.jsx";
import { Field, Notice } from "../components/Shared.jsx";
export default function Payments() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [studentId, setStudentId] = useState(params.get("studentId") || ""),
    [children, setChildren] = useState([]),
    [payments, setPayments] = useState([]),
    [settings, setSettings] = useState(null),
    [pkg, setPkg] = useState(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
  async function load() {
    try {
      const [s, p, m] = await Promise.all([
        api.get("/public/settings"),
        api.get("/public/package"),
        api.get("/payments/me"),
      ]);
      setSettings(s.data);
      setPkg(p.data);
      setPayments(m.data);
      if (user.roles.includes("Parent"))
        setChildren((await api.get("/parent/children")).data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function create() {
    setBusy(true);
    setError("");
    try {
      await api.post("/payments", {
        reference: null,
        idempotencyKey: key.current,
        studentId: studentId || undefined,
      });
      key.current = crypto.randomUUID();
      setSuccess(
        "கட்டணக் கோரிக்கை உருவாக்கப்பட்டது. வழிமுறையின்படி செலுத்தி குறிப்பு எண்ணை அனுப்பவும்.",
      );
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const awaiting = payments.find(
    (p) =>
      p.status === "AwaitingReference" &&
      p.studentId === (studentId || user.id),
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/payments/${awaiting.id}/reference`, {
        reference: new FormData(e.currentTarget).get("reference"),
      });
      setSuccess(
        "கட்டண விவரம் பெறப்பட்டது. சரிபார்ப்பிற்குப் பிறகு தேர்வு அனுமதி வழங்கப்படும்.",
      );
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="shell page">
      <h1>தேர்வுத் தொகுப்பு மற்றும் கட்டணம்</h1>
      <Notice error={error} success={success} />
      {settings && pkg ? (
        <div className="two-col">
          <section className="panel">
            <h2>5 தேர்வுகள் · LKR {pkg.price}</h2>
            <p>
              ஒவ்வொரு தேர்வுக்கும் ஒரு முயற்சி. புதுப்பித்தால் சேமித்த
              விடைகளுடன் தொடரலாம். நேரம் நிறுத்தப்படாது.
            </p>
            <h3>கட்டணம் செலுத்தும் வழிமுறை</h3>
            <p className="prewrap">
              {settings.paymentInstructions ||
                "கட்டண வசதி இன்னும் திறக்கப்படவில்லை."}
            </p>
            <p>
              உண்மையான வங்கிப் பதிவை நிர்வாகி சரிபார்த்த பிறகே அனுமதி
              கிடைக்கும்.
            </p>
          </section>
          <form className="panel" onSubmit={submit}>
            <h2>பரிவர்த்தனை விவரம்</h2>
            {user.roles.includes("Parent") && (
              <label className="field">
                குழந்தை
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">தேர்வு செய்க</option>
                  {children.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!awaiting && (
              <button
                type="button"
                className="button"
                disabled={
                  busy ||
                  !pkg.purchasesEnabled ||
                  (user.roles.includes("Parent") && !studentId)
                }
                onClick={create}
              >
                முதலில் கட்டணக் கோரிக்கையை உருவாக்கு
              </button>
            )}
            <Field
              disabled={!awaiting}
              label="வங்கிப் பரிவர்த்தனை குறிப்பு எண்"
              name="reference"
              minLength={4}
              maxLength={80}
              required
            />
            <p className="note">
              வங்கிக் கடவுச்சொல், அட்டை எண் அல்லது PIN பகிர வேண்டாம்.
            </p>
            <button className="button" disabled={busy || !awaiting}>
              {busy ? "சமர்ப்பிக்கிறது…" : "சரிபார்ப்பிற்கு அனுப்பு"}
            </button>
            {!pkg.purchasesEnabled && (
              <p>தற்போது புதிய கட்டணங்கள் ஏற்கப்படவில்லை.</p>
            )}
          </form>
        </div>
      ) : (
        <p>ஏற்றப்படுகிறது…</p>
      )}
      <h2>கட்டண வரலாறு</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>குறிப்பு</th>
              <th>தொகை</th>
              <th>நிலை</th>
              <th>குறிப்பு</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.reference}</td>
                <td>
                  {p.currency} {p.amount}
                </td>
                <td>{p.status}</td>
                <td>{p.reviewNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!payments.length && <p>இன்னும் கட்டணங்கள் இல்லை.</p>}
      </div>
    </main>
  );
}
