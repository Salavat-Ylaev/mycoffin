"use client";

import { useEffect, useState } from "react";
import type { PetKind, Product } from "@/lib/types";
import { PET_KINDS } from "@/lib/types";
import { calcDimensions, pickOffers, SHAPES, type Dimensions, type Offer } from "@/lib/calc";
import { t, type Lang } from "@/lib/i18n";
import CoffinArt from "./CoffinArt";

const GLYPH: Record<PetKind, string> = {
  cat: "🐈",
  dog: "🐕",
  reptile: "🦎",
  rodent: "🐹",
};

interface Props {
  lang: Lang;
  products: Product[];
  preset: { pet: PetKind; productId?: string } | null;
  onClose: () => void;
}

export default function CalculatorModal({ lang, products, preset, onClose }: Props) {
  const L = t(lang);

  const [step, setStep] = useState(1);
  const [pet, setPet] = useState<PetKind>(preset?.pet ?? "cat");
  const [weight, setWeight] = useState<string>(String(SHAPES[preset?.pet ?? "cat"].defaultWeight));
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [chosen, setChosen] = useState<Offer | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    post_office: "",
    comment: "",
  });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState("");

  const payDetails =
    process.env.NEXT_PUBLIC_PAYMENT_DETAILS || "Реквізити надішле менеджер";

  // блокуємо прокрутку сторінки під модалкою + закриття по Esc
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

  const petLabel = (p: PetKind) =>
    ({ cat: L.petCat, dog: L.petDog, reptile: L.petReptile, rodent: L.petRodent })[p];

  const range = SHAPES[pet].weight;

  const calculate = () => {
    const w = Number(String(weight).replace(",", "."));
    if (!w || w <= 0) {
      setError(L.formRequired);
      return;
    }
    setError("");
    const d = calcDimensions(pet, w);
    const list = pickOffers(products, pet, d, 4);
    setDims(d);
    setOffers(list);
    // якщо прийшли з картки каталогу — одразу підсвічуємо ту модель
    const pre = preset?.productId
      ? list.find((o) => o.product.id === preset.productId)
      : null;
    setChosen(pre ?? null);
    setStep(2);
  };

  const submit = async () => {
    if (!chosen || !dims) return;
    const phoneOk = /^[\d+\s()\-]{9,20}$/.test(form.phone.trim());
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    if (!form.first_name.trim() || !form.last_name.trim() || !form.post_office.trim()) {
      setError(L.formRequired);
      return;
    }
    if (!phoneOk) return setError(L.formPhoneInvalid);
    if (!emailOk) return setError(L.formEmailInvalid);

    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet,
          weight_kg: Number(String(weight).replace(",", ".")),
          ...form,
          product_id: chosen.product.id,
          length_cm: dims.length,
          width_cm: dims.width,
          height_cm: dims.height,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setOrderId(data.id);
      setStep(4);
    } catch {
      setError(L.formError);
    } finally {
      setSending(false);
    }
  };

  const stepTitle = [L.calcStep1, L.calcStep2, L.calcStep3, L.calcStep4][step - 1];

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={L.calcTitle}>
        <div className="modal-head">
          <div>
            <div className="caps-lg">{L.calcTitle}</div>
            <div className="caps muted" style={{ marginTop: 6 }}>
              {stepTitle}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Cross />
          </button>
        </div>

        <div className="modal-body">
          <div className="steps-bar">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={i <= step ? "on" : ""} />
            ))}
          </div>

          {/* ─── КРОК 1 ─── */}
          {step === 1 && (
            <>
              <div className="field">
                <label>{L.calcPetLabel}</label>
                <div className="pet-picker">
                  {PET_KINDS.map((p) => (
                    <button
                      key={p}
                      className="pet-option"
                      aria-pressed={p === pet}
                      onClick={() => {
                        setPet(p);
                        setWeight(String(SHAPES[p].defaultWeight));
                      }}
                    >
                      <span className="pet-glyph">{GLYPH[p]}</span>
                      <span className="caps">{petLabel(p)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>
                  {L.calcWeightLabel} · {range[0]}–{range[1]}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={range[0]}
                  max={range[1]}
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <div className="caps muted" style={{ marginTop: 10, letterSpacing: ".08em" }}>
                  {L.calcWeightHint}
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button className="btn btn-solid" style={{ width: "100%", marginTop: 12 }} onClick={calculate}>
                {L.calcSubmit}
              </button>
            </>
          )}

          {/* ─── КРОК 2 ─── */}
          {step === 2 && dims && (
            <>
              <div className="result-box">
                <div className="caps muted">{L.calcResultTitle}</div>
                <div className="result-dims">
                  <div>
                    <span className="caps muted">{L.calcLength}</span>
                    <strong>{dims.length}</strong>
                    <span className="caps muted">см</span>
                  </div>
                  <div>
                    <span className="caps muted">{L.calcWidth}</span>
                    <strong>{dims.width}</strong>
                    <span className="caps muted">см</span>
                  </div>
                  <div>
                    <span className="caps muted">{L.calcHeight}</span>
                    <strong>{dims.height}</strong>
                    <span className="caps muted">см</span>
                  </div>
                </div>
              </div>

              <div className="caps muted" style={{ marginBottom: 14 }}>
                {L.calcOffersTitle}
              </div>

              {offers.map((o) => (
                <button
                  key={o.product.id}
                  className="offer"
                  aria-pressed={chosen?.product.id === o.product.id}
                  onClick={() => setChosen(o)}
                >
                  <div className="offer-media">
                    {o.product.image ? (
                      <img src={o.product.image} alt="" />
                    ) : (
                      <CoffinArt art={o.product.art} />
                    )}
                  </div>
                  <div>
                    <h4>{lang === "uk" ? o.product.name_uk : o.product.name_en}</h4>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
                      {lang === "uk" ? o.product.material_uk : o.product.material_en}
                    </div>
                    <div className="offer-price">
                      <span className="caps" style={{ color: o.exactFit ? "var(--gold)" : "var(--grey)" }}>
                        {o.exactFit ? L.calcExact : L.calcCustom}
                      </span>
                      <span style={{ fontSize: 14 }}>
                        {o.price.toLocaleString("uk-UA")} {L.uah}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button className="btn btn-sm" onClick={() => setStep(1)}>
                  {L.calcBack}
                </button>
                <button
                  className="btn btn-sm btn-solid"
                  style={{ flex: 1 }}
                  disabled={!chosen}
                  onClick={() => setStep(3)}
                >
                  {L.calcChoose}
                </button>
              </div>
            </>
          )}

          {/* ─── КРОК 3 ─── */}
          {step === 3 && chosen && dims && (
            <>
              <div className="notice">
                <b>{lang === "uk" ? chosen.product.name_uk : chosen.product.name_en}</b>
                {" · "}
                {dims.length}×{dims.width}×{dims.height} см
                {" · "}
                {chosen.price.toLocaleString("uk-UA")} {L.uah}
              </div>

              <div className="field-row">
                <Field label={L.formFirstName} value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
                <Field label={L.formLastName} value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
              </div>
              <Field label={L.formPhone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" placeholder="+380" />
              <Field label={L.formEmail} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Field label={L.formPostOffice} value={form.post_office} onChange={(v) => setForm({ ...form, post_office: v })} placeholder="Київ, №12" />

              <div className="field">
                <label>{L.formPayment}</label>
                <select value="transfer" onChange={() => {}}>
                  <option value="transfer">{L.formPaymentTransfer}</option>
                </select>
              </div>

              <div className="field">
                <label>{L.formComment}</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>

              {error && <div className="error">{error}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => setStep(2)} disabled={sending}>
                  {L.calcBack}
                </button>
                <button className="btn btn-sm btn-solid" style={{ flex: 1 }} onClick={submit} disabled={sending}>
                  {sending ? L.formSending : L.formSubmit}
                </button>
              </div>
            </>
          )}

          {/* ─── КРОК 4 ─── */}
          {step === 4 && (
            <>
              <div className="done-check">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
                  <path d="M1 7l5.5 5.5L17 1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <h3 className="display" style={{ fontSize: 30, margin: "0 0 14px" }}>
                {L.doneTitle}
              </h3>
              <p style={{ lineHeight: 1.85, color: "var(--ink-70)", margin: 0 }}>{L.doneText}</p>

              <div className="result-box" style={{ marginTop: 26 }}>
                <div className="caps muted">{L.doneNumber}</div>
                <div className="display" style={{ fontSize: 30, marginTop: 6 }}>
                  №{orderId}
                </div>
              </div>

              <div className="notice">
                <div className="caps muted" style={{ marginBottom: 8 }}>
                  {L.donePayTitle}
                </div>
                {payDetails}
                <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                  {L.donePayHint}
                </div>
              </div>

              <button className="btn btn-solid" style={{ width: "100%", marginTop: 12 }} onClick={onClose}>
                {L.doneClose}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Cross() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
