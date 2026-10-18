import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { Field, Notice } from "../components/Shared.jsx";
import Dashboard from "./Dashboard.jsx";
export default function Parent() {
  const [children, setChildren] = useState([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setChildren((await api.get("/parent/children")).data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function add(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/parent/children", {
        ...v,
        guardianConsent: v.guardianConsent === "on",
      });
      setSuccess(
        `குழந்தையின் உள்நுழைவு முகவரி: ${data.email}. இதைச் சேமிக்கவும்.`,
      );
      form.reset();
      await load();
      setSelected(data.id);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function reset(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/parent/children/${selected}/reset-password`, {
        password: new FormData(e.currentTarget).get("password"),
      });
      setSuccess(
        "கடவுச்சொல் மாற்றப்பட்டது. குழந்தை மீண்டும் உள்நுழைய வேண்டும்.",
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="shell page">
      <div className="page-heading">
        <h1>பெற்றோர் பக்கம்</h1>
        <Link to="/payments" className="button">
          கட்டணங்கள்
        </Link>
      </div>
      <Notice error={error} success={success} />
      <div className="two-col">
        <form className="panel" onSubmit={add}>
          <h2>குழந்தையின் கணக்கைச் சேர்க்கவும்</h2>
          <Field
            label="பெயர் / புனைப்பெயர்"
            name="displayName"
            required
            maxLength={60}
          />
          <Field
            label="குழந்தைக்கான கடவுச்சொல்"
            name="password"
            type="password"
            minLength={10}
            maxLength={128}
            required
          />
          <p className="note">
            10 எழுத்துகள்; பெரிய/சிறிய எழுத்து, எண், சிறப்புக் குறி தேவை.
          </p>
          <label className="check">
            <input type="checkbox" name="guardianConsent" required />
            இந்தக் குழந்தையின் பெற்றோர்/பாதுகாவலர் நான்; தரவு பயன்பாட்டிற்கு
            ஒப்புக்கொள்கிறேன்.
          </label>
          <button className="button" disabled={busy}>
            சேர்க்கவும்
          </button>
        </form>
        <section className="panel">
          <h2>எனது குழந்தைகள்</h2>
          {!children.length ? (
            <p>முதலில் குழந்தையின் கணக்கைச் சேர்க்கவும்.</p>
          ) : (
            <label className="field">
              குழந்தையைத் தேர்வு செய்க
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">தேர்வு செய்க</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {selected && (
            <>
              <p className="note break">
                உள்நுழைவு: {children.find((c) => c.id === selected)?.email}
              </p>
              <Link className="button" to={`/payments?studentId=${selected}`}>
                இந்தக் குழந்தைக்குக் கட்டணம்
              </Link>
              <form onSubmit={reset}>
                <Field
                  label="புதிய கடவுச்சொல்"
                  name="password"
                  type="password"
                  minLength={10}
                  maxLength={128}
                  required
                />
                <button disabled={busy}>கடவுச்சொல் மாற்று</button>
              </form>
            </>
          )}
        </section>
      </div>
      {selected && <Dashboard key={selected} studentId={selected} embedded />}
    </main>
  );
}
