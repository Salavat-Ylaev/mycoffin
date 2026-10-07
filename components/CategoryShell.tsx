"use client";

import { useCallback, useState } from "react";
import type { EngravingOption, PetKind, Product } from "@/lib/types";
import { t } from "@/lib/i18n";
import { sizesFor, sizeById, priceOf, weightRange } from "@/lib/calc";
import { CATEGORIES, type Category } from "@/lib/categories";
import ProductImage from "./ProductImage";
import CalculatorModal from "./CalculatorModal";
import ContactModal from "./ContactModal";

/**
 * Сторінка одного виду тварини.
 *
 * Українською і без перемикача мови: ці сторінки написані під пошукові
 * запити українською, англійського двійника в них немає. Перемикач
 * лишається на головній.
 */
export default function CategoryShell({
  category,
  products,
  engraving,
}: {
  category: Category;
  products: Product[];
  engraving: EngravingOption[];
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcPreset, setCalcPreset] = useState<{
    pet: PetKind;
    sizeId?: string;
    productId?: string;
  } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const L = t("uk");

  const openCalc = useCallback(
    (preset?: { pet: PetKind; sizeId?: string; productId?: string }) => {
      setCalcPreset(preset ?? { pet: category.pet });
      setCalcOpen(true);
    },
    [category.pet]
  );

  const bands = sizesFor(category.pet);
  const list = products
    .filter((p) => p.pet === category.pet)
    .sort((a, b) => a.sort - b.sort);

  const others = CATEGORIES.filter((c) => c.slug !== category.slug);

  /** «від … грн» по всіх корпусах цього виду */
  const cheapest = (() => {
    const all = list
      .flatMap((p) => bands.map((b) => priceOf(p, b.sizeId)))
      .filter((n) => n > 0);
    return all.length ? Math.min(...all) : 0;
  })();

  const money = (n: number) => n.toLocaleString("uk-UA");

  /** 0.5 → «0,5»: в українському тексті десятковий роздільник — кома */
  const num = (n: number) => String(n).replace(".", ",");

  const weightLabel = (sizeId: string) => {
    const band = bands.find((b) => b.sizeId === sizeId);
    if (!band) return "";
    const [from, to] = weightRange(band);
    if (from === 0) return to < 1 ? `до ${Math.round(to * 1000)} г` : `до ${num(to)} кг`;
    return `${num(from)}–${num(to)} кг`;
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <nav className="header-nav caps">
            <a href="/">Головна</a>
            <a href="/#catalog">Каталог</a>
          </nav>

          <a href="/" className="brand">
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
        <nav className="pg-crumbs caps" aria-label="Навігація">
          <a href="/">{L.brand}</a>
          <span aria-hidden>·</span>
          <span className="muted">{category.short}</span>
        </nav>

        {/* ── заголовок розділу ── */}
        <section className="pg-hero">
          <div>
            <h1 className="display">{category.h1}</h1>
            <p className="pg-lede">{category.lede}</p>
            <div className="pg-cta">
              <button className="btn btn-solid" onClick={() => openCalc()}>
                {L.ctaCalc}
              </button>
              {cheapest > 0 && (
                <span className="pg-from">
                  <span className="caps muted">Ціна від</span>
                  <strong>
                    {money(cheapest)} {L.uah}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── таблиця розмірів ── */}
        <section className="pg-block" id="rozmiry">
          <h2 className="display">Стандартні розміри</h2>
          <p className="pg-note">{category.sizeNote}</p>

          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Група</th>
                  <th>Вага</th>
                  <th>Приклади</th>
                  <th className="num">Внутрішній розмір</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => {
                  const s = sizeById(b.sizeId)!;
                  return (
                    <tr key={b.sizeId}>
                      <td>
                        <strong>{b.label_uk}</strong>
                        <span className="pg-code">{s.code}</span>
                      </td>
                      <td className="num">{weightLabel(b.sizeId)}</td>
                      <td className="ex">{b.examples_uk.replace(/^[^·]*·\s*/, "")}</td>
                      <td className="num dim">
                        {s.length} × {s.width} × {s.height} см
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="pg-fine">
            Розміри внутрішні — це простір, який залишається для тварини.
            Товщину стінки цех закладає понад це.
          </p>
        </section>

        {/* ── моделі ── */}
        <section className="pg-block" id="modeli">
          <h2 className="display">Моделі</h2>
          <p className="pg-note">
            Корпус той самий, відрізняється оздоблення. Ціна залежить від розміру —
            у картці показана найнижча, точну покаже калькулятор.
          </p>

          <div className="pg-grid">
            {list.map((p) => {
              const prices = bands
                .map((b) => priceOf(p, b.sizeId))
                .filter((n) => n > 0);
              const from = prices.length ? Math.min(...prices) : 0;
              return (
                <article className="card pg-card" key={p.id}>
                  <div className="card-media">
                    <ProductImage src={p.image} alt={p.name_uk} art={p.art} pet={p.pet} />
                    <span className={`card-badge caps ${p.in_stock ? "" : "out"}`}>
                      {p.in_stock ? L.inStock : L.outStock}
                    </span>
                  </div>

                  <h3 className="card-name">{p.name_uk}</h3>
                  <div className="card-material">{p.material_uk}</div>
                  <div className="card-material" style={{ marginTop: -6 }}>
                    {p.desc_uk}
                  </div>

                  <div className="card-meta">
                    <span className="card-price">
                      {from > 0 ? (
                        <>
                          <small>від</small>
                          {money(from)} {L.uah}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <button
                    className="btn btn-sm card-cta"
                    onClick={() => openCalc({ pet: p.pet, productId: p.id })}
                  >
                    {L.orderThis}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── текстові розділи ── */}
        <section className="pg-prose">
          {category.sections.map((s) => (
            <article key={s.heading} className="pg-sec">
              <h2 className="display">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          ))}
        </section>

        {/* ── питання ── */}
        <section className="pg-block" id="pytannya">
          <h2 className="display">Часті питання</h2>
          <div className="pg-faq">
            {category.faq.map(([q, a]) => (
              <details key={q} className="pg-faq-item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── перелінковка ── */}
        <section className="pg-block">
          <h2 className="display">Інші розділи</h2>
          <div className="pg-links">
            {others.map((c) => (
              <a href={`/${c.slug}`} key={c.slug} className="pg-link">
                <span className="caps muted">{c.short}</span>
                <span className="pg-link-t">{c.h1}</span>
              </a>
            ))}
          </div>
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
          <a href="/admin" rel="nofollow">
            Admin
          </a>
          <span className="muted">
            © {new Date().getFullYear()} {L.brand}. {L.footerRights}
          </span>
        </div>
      </footer>

      {calcOpen && (
        <CalculatorModal
          lang="uk"
          products={products}
          engraving={engraving}
          preset={calcPreset}
          onClose={() => setCalcOpen(false)}
        />
      )}
      {contactOpen && <ContactModal lang="uk" onClose={() => setContactOpen(false)} />}
    </>
  );
}
