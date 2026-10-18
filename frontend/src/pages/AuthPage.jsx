import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, errorText } from "../services/api.js";
import { useAuth } from "../context/Auth.jsx";
import { Field, Notice } from "../components/Shared.jsx";
export default function AuthPage({ register = false }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (user)
    return (
      <Navigate
        to={
          user.roles.includes("Administrator")
            ? "/admin"
            : user.roles.includes("Parent")
              ? "/parent"
              : "/dashboard"
        }
        replace
      />
    );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register)
        await api.post("/auth/register", {
          ...values,
          guardianConsent: values.guardianConsent === "on",
        });
      const profile = await login(values.email, values.password);
      navigate(
        profile.roles.includes("Administrator")
          ? "/admin"
          : profile.roles.includes("Parent")
            ? "/parent"
            : "/dashboard",
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="shell page">
      <form className="panel auth-form" onSubmit={submit}>
        <h1>{register ? "புதிய பதிவு" : "மீண்டும் வருக!"}</h1>
        <p>
          {register
            ? "பெற்றோர் தமக்கென ஒரு கணக்கை உருவாக்கி குழந்தைக்கான கணக்கையும் சேர்க்கலாம்."
            : "உங்கள் கணக்கில் உள்நுழையுங்கள்."}
        </p>
        <Notice error={error} />
        {register && (
          <>
            <Field
              label="பெயர் / புனைப்பெயர்"
              name="displayName"
              maxLength={60}
              required
            />
            <label className="field">
              கணக்கு வகை
              <select name="role">
                <option value="Parent">பெற்றோர்</option>
                <option value="Student">மாணவர்</option>
              </select>
            </label>
          </>
        )}
        <Field
          label="மின்னஞ்சல் / குழந்தையின் உள்நுழைவு முகவரி"
          type="email"
          name="email"
          autoComplete="username"
          required
        />
        <Field
          label="கடவுச்சொல்"
          type="password"
          name="password"
          minLength={register ? 10 : 1}
          maxLength={128}
          autoComplete={register ? "new-password" : "current-password"}
          required
        />
        {register && (
          <>
            <p className="note">
              குறைந்தது 10 எழுத்துகள்; பெரிய எழுத்து, சிறிய எழுத்து, எண் மற்றும்
              சிறப்புக் குறி தேவை.
            </p>
            <label className="check">
              <input type="checkbox" name="guardianConsent" required />
              நான் பெற்றோர்/பாதுகாவலர் அல்லது அவர்களின் அனுமதியுடன் பதிவு
              செய்கிறேன். <Link to="/privacy">
                தனியுரிமை அறிவிப்பு
              </Link> மற்றும் <Link to="/terms">விதிமுறைகளை</Link>ப்
              படித்துள்ளேன்.
            </label>
          </>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "காத்திருக்கவும்…"
            : register
              ? "கணக்கை உருவாக்கு"
              : "உள்நுழைக"}
        </button>
        <p className="note">
          <Link to={register ? "/login" : "/register"}>
            {register ? "ஏற்கெனவே கணக்கு உள்ளதா?" : "புதிய கணக்கு உருவாக்கு"}
          </Link>
        </p>
        <p className="note">
          குழந்தையின் கடவுச்சொல்லைப் பெற்றோர் தமது பக்கத்தில் மாற்றலாம். பிற
          கணக்கு உதவிக்கு தொடர்புப் பக்கத்தைப் பார்க்கவும்.
        </p>
      </form>
    </main>
  );
}
