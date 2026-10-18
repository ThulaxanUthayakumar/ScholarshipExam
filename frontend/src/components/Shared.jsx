import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Auth.jsx";
export function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">ஏற்றப்படுகிறது…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && !user.roles.includes(role))
    return <p role="alert">இந்தப் பக்கத்தை அணுக அனுமதி இல்லை.</p>;
  return children;
}
export function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function Notice({ error, success }) {
  return (
    <>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export const badgeNames = {
  SCHOLARSHIP_STAR: "⭐ புலமை நட்சத்திரம்",
  EXCELLENT_ACHIEVER: "🌟 சிறந்த சாதனையாளர்",
  SCHOLARSHIP_CHAMPION: "🏆 புலமைச் சாதனையாளர்",
};
export function Badges({ items = [] }) {
  return (
    <div className="badges">
      {items.map((x, i) => (
        <span className="pill" key={i}>
          {badgeNames[typeof x === "string" ? x : x.code] || x.code}
        </span>
      ))}
    </div>
  );
}
