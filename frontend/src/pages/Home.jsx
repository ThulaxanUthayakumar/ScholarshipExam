import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getPilotPackage } from "../services/api.js";
export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    setData(null);
    getPilotPackage(controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <main id="main">
      <section className="shell hero grid gap-10 md:grid-cols-2">
        <div>
          <span className="eyebrow">தரம் 5 · தமிழ் மூலம்</span>
          <h1>
            சிறு பயிற்சி.
            <br />
            <span>பெரிய நம்பிக்கை.</span>
          </h1>
          <p className="intro">
            உங்கள் குழந்தை ஆர்வத்துடன் கற்கவும், நம்பிக்கையுடன் பயிற்சி
            செய்யவும் ஓர் எளிய தொடக்கம்.
          </p>
          <a className="button" href="#package">
            தேர்வுத் தொகுப்பைப் பார்க்கவும் <span aria-hidden="true">↗</span>
          </a>
          <p className="note">பெற்றோரின் வழிகாட்டுதலுடன் கற்போம்.</p>
        </div>
        <aside className="learning-card">
          <span className="eyebrow">ஒவ்வொரு முயற்சியும் முன்னேற்றமே</span>
          <div className="book" aria-hidden="true">
            அ ஆ இ<small>கற்போம் · பயிற்சி செய்வோம்</small>
          </div>
          <h2>உங்கள் வேகத்தில் கற்றல்</h2>
          <p>பயிற்சி, புரிதல், முன்னேற்றம் — அனைத்தும் ஒரே இடத்தில்.</p>
          <Link className="pill" to="/demo">
            இலவசமாக முயற்சிக்கவும்
          </Link>
        </aside>
      </section>
      <section id="how" className="shell py-12">
        <span className="eyebrow">எளிய செயல்முறை</span>
        <h2>எப்படிச் செயல்படும்?</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              "01",
              "தொகுப்பைத் தேர்வு செய்யுங்கள்",
              "பெற்றோர் உதவியுடன் பதிவு செய்து, கட்டண விவரங்களைப் பெறுங்கள்.",
            ],
            [
              "02",
              "தேர்வில் பங்கேற்கவும்",
              "கட்டணம் சரிபார்க்கப்பட்டதும், நேர வரம்புடன் பயிற்சி செய்யுங்கள்.",
            ],
            [
              "03",
              "முன்னேற்றத்தைக் காணுங்கள்",
              "சமர்ப்பித்த பிறகு மதிப்பெண்களையும் விளக்கங்களையும் பாருங்கள்.",
            ],
          ].map(([n, t, d]) => (
            <article className="step" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="package" className="shell py-12">
        <div className="package">
          <div>
            <span className="eyebrow">அறிமுகத் தொகுப்பு</span>
            <h2>பயிற்சிக்கான அடுத்த படி</h2>
            <p>
              இவை தனிப்பயன் பயிற்சித் தேர்வுகள்; அதிகாரப்பூர்வத் தேர்வு வடிவம்
              அல்ல.
            </p>
            <p className="note">
              பதிவு செய்து இலவச மாதிரி வினாவை முயற்சிக்கவும். ஆசிரியர்
              சரிபார்ப்பு முடிந்த பின் கட்டணத் தேர்வுகள் திறக்கப்படும்.
            </p>
          </div>
          <div aria-live="polite" className="price-panel">
            {error ? (
              <div role="alert">
                <p>விவரங்களைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.</p>
                <button
                  className="button"
                  onClick={() => setRetry((v) => v + 1)}
                >
                  மீண்டும் முயற்சி
                </button>
              </div>
            ) : !data ? (
              <p role="status">விவரங்கள் ஏற்றப்படுகின்றன…</p>
            ) : (
              <>
                <h3>{data.title}</h3>
                <p className="price">
                  <small>{data.currency}</small> {data.price}
                </p>
                <ul>
                  <li>{data.examCount} தனித்தனி மாதிரித் தேர்வுகள்</li>
                  <li>ஒவ்வொன்றிலும் {data.questionsPerExam} வினாக்கள்</li>
                  <li>
                    ஒவ்வொரு தேர்வுக்கும் {data.durationMinutes} நிமிடங்கள்
                  </li>
                  <li>டிஜிட்டல் பாராட்டுப் பதக்கங்கள்</li>
                </ul>
                <Link
                  className="button"
                  to={data.purchasesEnabled ? "/payments" : "/register"}
                >
                  {data.purchasesEnabled
                    ? "தொகுப்பைப் பெறுங்கள்"
                    : "இலவசமாகப் பதிவு செய்க"}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
