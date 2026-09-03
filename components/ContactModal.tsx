"use client";

import { useEffect } from "react";
import { t, type Lang } from "@/lib/i18n";

export default function ContactModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const L = t(lang);

  const phone = process.env.NEXT_PUBLIC_PHONE || "+380 00 000 00 00";
  const email = process.env.NEXT_PUBLIC_EMAIL || "hello@example.com";
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM || "";
  const telegram = process.env.NEXT_PUBLIC_TELEGRAM || "";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={L.contactTitle}>
        <div className="modal-head">
          <div className="caps-lg">{L.contactTitle}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
              <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ lineHeight: 1.85, color: "var(--ink-70)", marginTop: 0 }}>{L.contactText}</p>

          <div className="result-box" style={{ marginBottom: 12 }}>
            <div className="caps muted">{L.contactPhone}</div>
            <a className="display" style={{ fontSize: 28, display: "block", marginTop: 6 }} href={`tel:${phone.replace(/\s/g, "")}`}>
              {phone}
            </a>
          </div>

          <div className="result-box">
            <div className="caps muted">{L.contactEmail}</div>
            <a className="display" style={{ fontSize: 24, display: "block", marginTop: 6, wordBreak: "break-all" }} href={`mailto:${email}`}>
              {email}
            </a>
          </div>

          {(instagram || telegram) && (
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              {telegram && (
                <a className="btn btn-sm" style={{ flex: 1 }} href={telegram} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              )}
              {instagram && (
                <a className="btn btn-sm" style={{ flex: 1 }} href={instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
