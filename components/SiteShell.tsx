"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PetKind, Product } from "@/lib/types";
import { PET_KINDS } from "@/lib/types";
import { t, type Lang } from "@/lib/i18n";
import { priceFor } from "@/lib/calc";
import CoffinArt from "./CoffinArt";
import CalculatorModal from "./CalculatorModal";
import ContactModal from "./ContactModal";

const PET_GLYPH: Record<PetKind, string> = {
  cat: "🐈",
  dog: "🐕",
  reptile: "🦎",
  rodent: "🐹",
};

export default function SiteShell({ products }: { products: Product[] }) {
  const [lang, setLang] = useState<Lang>("uk");
  const [pet, setPet] = useState<PetKind>("cat");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcPreset, setCalcPreset] = useState<{ pet: PetKind; productId?: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const L = t(lang);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("spokiy_lang");
      if (saved === "uk" || saved === "en") setLang(saved);
    } catch {
      /* приватний режим — просто лишаємо українську */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const switchLang = () => {
    const next: Lang = lang === "uk" ? "en" : "uk";
    setLang(next);
    try {
      localStorage.setItem("spokiy_lang", next);
    } catch {
      /* ігноруємо */
    }
  };

  const openCalc = useCallback((preset?: { pet: PetKind; productId?: string }) => {
    setCalcPreset(preset ?? null);
    setCalcOpen(true);
  }, []);

  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 260), behavior: "smooth" });
  };

  const petLabel = (p: PetKind) =>
    ({ cat: L.petCat, dog: L.petDog, reptile: L.petReptile, rodent: L.petRodent })[p];

  const list = products
    .filter((p) => p.pet === pet)
    .sort((a, b) => a.sort - b.sort);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <nav className="header-nav caps">
            <a href="#catalog">{L.navCatalog}</a>
            <a href="#care">{L.navCare}</a>
          </nav>

          <a href="#top" className="brand">
            <div className="brand-word">{L.brand}</div>
            <div className="brand-sub">{L.brandSub}</div>
          </a>

          <div className="header-actions">
            <button className="btn btn-sm btn-desktop" onClick={() => setContactOpen(true)}>
              {L.ctaWrite}
            </button>
            <button className="btn btn-sm btn-solid btn-desktop" onClick={() => openCalc()}>
              {L.ctaCalc}
            </button>
            <button className="lang-toggle caps" onClick={switchLang} aria-label="Language">
              {L.langLabel}
            </button>
          </div>
        </div>

        <div className="header-mobile-cta">
          <button className="btn btn-sm" onClick={() => setContactOpen(true)}>
            {L.ctaWrite}
          </button>
          <button className="btn btn-sm btn-solid" onClick={() => openCalc()}>
            {L.ctaCalc}
          </button>
        </div>
      </header>

      <main id="top">
        {/* ── головний екран ── */}
        <section className="hero">
          <h1 className="display">
            {L.heroLine1}
            <br />
            <em>{L.heroLine2}</em>
          </h1>
          <div className="hero-side">
            <div className="hero-rule" />
            <p className="hero-text">{L.heroText}</p>
            <a href="#catalog" className="btn btn-sm" style={{ marginTop: 26 }}>
              {L.heroScroll}
            </a>
          </div>
        </section>

        {/* ── короткий текст підтримки ── */}
        <section className="comfort">
          <div className="caps gold">{L.comfortTitle}</div>
          <div className="comfort-body">
            <p>{L.comfortText}</p>
            <div className="comfort-sign caps">{L.comfortSign}</div>
          </div>
        </section>

        {/* ── каталог ── */}
        <section className="catalog" id="catalog">
          <div className="catalog-head">
            <h2 className="catalog-title display">{L.catalogTitle}</h2>
            <span className="caps muted">{L.catalogHint}</span>
          </div>

          <div className="tabs" role="tablist">
            {PET_KINDS.map((p) => (
              <button
                key={p}
                role="tab"
                className="tab"
                aria-selected={p === pet}
                onClick={() => {
                  setPet(p);
                  railRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                }}
              >
                {petLabel(p)}
              </button>
            ))}
          </div>

          <div className="rail-wrap">
            <div className="rail" ref={railRef}>
              {list.map((p) => (
                <article className="card" key={p.id}>
                  <div className="card-media">
                    {p.image ? (
                      <img src={p.image} alt={lang === "uk" ? p.name_uk : p.name_en} />
                    ) : (
                      <CoffinArt art={p.art} label={lang === "uk" ? p.name_uk : p.name_en} />
                    )}
                    <span className={`card-badge caps ${p.in_stock ? "" : "out"}`}>
                      {p.in_stock ? L.inStock : L.outStock}
                    </span>
                  </div>

                  <h3 className="card-name">{lang === "uk" ? p.name_uk : p.name_en}</h3>
                  <div className="card-material">
                    {lang === "uk" ? p.material_uk : p.material_en}
                  </div>
                  <div className="card-material" style={{ marginTop: -8 }}>
                    {lang === "uk" ? p.desc_uk : p.desc_en}
                  </div>

                  <div className="card-meta">
                    <span className="caps muted">
                      {L.sizeRange} {p.min_length_cm}–{p.max_length_cm} см
                    </span>
                    <span className="card-price">
                      <small>{L.fromPrice}</small>
                      {priceFor(p, p.min_length_cm).toLocaleString("uk-UA")} {L.uah}
                    </span>
                  </div>

                  <button
                    className="btn btn-sm card-cta"
                    onClick={() => openCalc({ pet: p.pet, productId: p.id })}
                  >
                    {L.orderThis}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="rail-nav">
            <button className="rail-btn" onClick={() => scrollRail(-1)} aria-label="←">
              <Arrow dir="left" />
            </button>
            <button className="rail-btn" onClick={() => scrollRail(1)} aria-label="→">
              <Arrow dir="right" />
            </button>
          </div>
        </section>

        {/* ── як ми працюємо ── */}
        <section className="steps" id="care">
          {[
            [L.footerStep1, L.footerStep1Text],
            [L.footerStep2, L.footerStep2Text],
            [L.footerStep3, L.footerStep3Text],
          ].map(([title, text], i) => (
            <div className="step" key={i}>
              <div className="step-num caps">0{i + 1}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        <div>
          <div className="brand-word" style={{ textAlign: "left" }}>
            {L.brand}
          </div>
          <div className="brand-sub" style={{ letterSpacing: "0.18em" }}>
            {L.brandSub}
          </div>
        </div>
        <div className="footer-links caps">
          <button onClick={() => setContactOpen(true)}>{L.ctaWrite}</button>
          <button onClick={() => openCalc()}>{L.ctaCalc}</button>
          <a href="/admin">Admin</a>
          <span className="muted">
            © {new Date().getFullYear()} {L.brand}. {L.footerRights}
          </span>
        </div>
      </footer>

      {calcOpen && (
        <CalculatorModal
          lang={lang}
          products={products}
          preset={calcPreset}
          onClose={() => setCalcOpen(false)}
        />
      )}
      {contactOpen && <ContactModal lang={lang} onClose={() => setContactOpen(false)} />}
    </>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden>
      <path
        d={dir === "right" ? "M0 5h13M9 1l4 4-4 4" : "M15 5H2M6 1L2 5l4 4"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export { PET_GLYPH };
