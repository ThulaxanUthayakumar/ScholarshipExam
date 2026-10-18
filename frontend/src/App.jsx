import React from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/Auth.jsx";
import { Protected } from "./components/Shared.jsx";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Parent from "./pages/Parent.jsx";
import Payments from "./pages/Payments.jsx";
import Exam from "./pages/Exam.jsx";
import Result from "./pages/Result.jsx";
import Admin from "./pages/Admin.jsx";
import PublicPage from "./pages/PublicPage.jsx";
function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <a className="skip-link" href="#main">
        உள்ளடக்கத்திற்குச் செல்லவும்
      </a>
      <header className="shell app-header">
        <Link to="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            அ
          </span>{" "}
          அறிவொளி
        </Link>
        <nav aria-label="முதன்மை வழிசெலுத்தல்">
          <Link to="/how-it-works">செயல்முறை</Link>
          <Link to="/demo">இலவசப் பயிற்சி</Link>
          {user ? (
            <>
              <Link
                to={
                  user.roles.includes("Administrator")
                    ? "/admin"
                    : user.roles.includes("Parent")
                      ? "/parent"
                      : "/dashboard"
                }
              >
                எனது பக்கம்
              </Link>
              <button
                className="text-button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                வெளியேறு
              </button>
            </>
          ) : (
            <>
              <Link to="/login">உள்நுழைக</Link>
              <Link to="/register">பதிவு</Link>
            </>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route
          path="/dashboard"
          element={
            <Protected role="Student">
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/parent"
          element={
            <Protected role="Parent">
              <Parent />
            </Protected>
          }
        />
        <Route
          path="/payments"
          element={
            <Protected>
              <Payments />
            </Protected>
          }
        />
        <Route
          path="/exam/:id"
          element={
            <Protected role="Student">
              <Exam />
            </Protected>
          }
        />
        <Route
          path="/result/:id"
          element={
            <Protected>
              <Result />
            </Protected>
          }
        />
        <Route
          path="/admin/*"
          element={
            <Protected role="Administrator">
              <Admin />
            </Protected>
          }
        />
        {[
          "about",
          "how-it-works",
          "pricing",
          "demo",
          "contact",
          "privacy",
          "terms",
          "refund",
        ].map((path) => (
          <Route
            key={path}
            path={"/" + path}
            element={<PublicPage page={path} />}
          />
        ))}
        <Route
          path="*"
          element={
            <main id="main" className="shell page">
              <h1>பக்கம் கிடைக்கவில்லை</h1>
              <Link to="/">முகப்பு</Link>
            </main>
          }
        />
      </Routes>
      <footer className="shell py-10">
        <strong>அறிவொளி · தமிழ் வழிக் கற்றல்</strong>
        <div className="footer-links">
          {[
            ["about", "எங்களைப் பற்றி"],
            ["contact", "தொடர்பு"],
            ["privacy", "தனியுரிமை"],
            ["terms", "விதிமுறைகள்"],
            ["refund", "பணத்திருப்பம்"],
          ].map(([p, t]) => (
            <Link key={p} to={"/" + p}>
              {t}
            </Link>
          ))}
        </div>
        <p>
          இது ஒரு தனியார் பயிற்சித் தளம். இலங்கைப் பரீட்சைகள் திணைக்களத்துடன்
          இணைக்கப்படவில்லை. தேர்ச்சி உறுதியளிக்கப்படாது.
        </p>
      </footer>
    </>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
