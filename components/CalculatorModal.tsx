"use client";

import { useEffect, useMemo, useState } from "react";
import type { EngravingOption, PetKind, Product } from "@/lib/types";
import { PET_KINDS } from "@/lib/types";
import {
  sizesFor,
  sizeById,
  sizeForWeight,
  maxStandardWeight,
  pickOffers,
  type CoffinSize,
  type Offer,
  type PetSize,
} from "@/lib/calc";
import { t, type Lang } from "@/lib/i18n";
import ProductImage from "./ProductImage";

const GLYPH: Record<PetKind, string> = {
  cat: "🐈",
  dog: "🐕",
  reptile: "🦎",
  rodent: "🐹",
};

interface Props {
  lang: Lang;
  products: Product[];
  engraving: EngravingOption[];
  preset: { pet: PetKind; sizeId?: string; productId?: string } | null;
  onClose: () => void;
}

export default function CalculatorModal({
  lang,
  products,
  engraving,
  preset,
  onClose,
}: Props) {
  const L = t(lang);

  const startPet: PetKind = preset?.pet ?? "cat";
  const startSize =
    sizesFor(startPet).find((o) => o.sizeId === preset?.sizeId) ??
    sizesFor(startPet)[0];

  const [step, setStep] = useState(1);
  const [pet, setPet] = useState<PetKind>(startPet);
  const [sizeId, setSizeId] = useState(startSize.sizeId);
  const [weight, setWeight] = useState<string>(String(startSize.maxWeight));
  const [size, setSize] = useState<CoffinSize | null>(null);
  const [overWeight, setOverWeight] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [chosen, setChosen] = useState<Offer | null>(null);

  const [engIds, setEngIds] = useState<string[]>([]);
  const [engText, setEngText] = useState("");

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
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);

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

  const sizeOptions = useMemo(() => sizesFor(pet), [pet]);
  const options = useMemo(
    () => engraving.filter((o) => o.enabled).sort((a, b) => a.sort - b.sort),
    [engraving]
  );

  const engSelected = options.filter((o) => engIds.includes(o.id));
  const engPrice = engSelected.reduce((s, o) => s + o.price_uah, 0);
  const needsText = engSelected.some((o) => o.needs_text);
  const total = (chosen?.price ?? 0) + engPrice;
  // +1–3 дні потрібні лише на нестандартний розмір або нанесення
  const needsExtraDays = engIds.length > 0 || overWeight;
  const leadLine = needsExtraDays ? L.leadPlus : L.leadBase;

  const choosePet = (p: PetKind) => {
    const o = sizesFor(p)[0];
    setPet(p);
    setSizeId(o.sizeId);
    setWeight(String(o.maxWeight));
  };

  const chooseSize = (id: string) => {
    const o = sizeOptions.find((x) => x.sizeId === id);
    if (!o) return;
    setSizeId(id);
    setWeight(String(o.maxWeight));
  };

  const calculate = () => {
    const w = Number(String(weight).replace(",", "."));
    if (!w || w <= 0) {
      setError(L.formRequired);
      return;
    }
    setError("");

    // вага вирішує, який стандартний корпус потрібен
    const { option, custom } = sizeForWeight(pet, w);
    const s = sizeById(option.sizeId)!;
    const list = pickOffers(products, pet, option.sizeId, custom);

    setSizeId(option.sizeId);
    setSize(s);
    setOverWeight(custom);
    setOffers(list);

    // якщо прийшли з картки каталогу — одразу підсвічуємо ту модель
    const pre = preset?.productId
      ? list.find((o) => o.product.id === preset.productId)
      : null;
    setChosen(pre ?? null);
    setStep(2);
  };

  const toggleEng = (id: string) =>
    setEngIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async () => {
    if (!chosen || !size) return;

    const phoneOk = /^[\d+\s()\-]{9,20}$/.test(form.phone.trim());
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    if (!form.first_name.trim() || !form.last_name.trim() || !form.post_office.trim()) {
      setError(L.formRequired);
      return;
    }
    if (!phoneOk) return setError(L.formPhoneInvalid);
    if (!emailOk) return setError(L.formEmailInvalid);
    if (needsText && !engText.trim()) return setError(L.engravingTextRequired);

    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet,
          size_id: size.id,
          weight_kg: Number(String(weight).replace(",", ".")),
          ...form,
          product_id: chosen.product.id,
          engraving_ids: engIds,
          engraving_text: engText,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setDone({ id: data.id, total: data.total ?? total });
      setStep(4);
    } catch {
      setError(L.formError);
    } finally {
      setSending(false);
    }
  };

  const stepTitle = [L.calcStep1, L.calcStep2, L.calcStep3, L.calcStep4][step - 1];
  const money = (n: number) => n.toLocaleString("uk-UA");

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
                      onClick={() => choosePet(p)}
                    >
                      <span className="pet-glyph">{GLYPH[p]}</span>
                      <span className="caps">{petLabel(p)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>{L.calcCategoryLabel}</label>
                <div className="cat-picker">
                  {sizeOptions.map((o: PetSize) => {
                    const s = sizeById(o.sizeId)!;
                    return (
                      <button
                        key={o.sizeId}
                        className="cat-option"
                        aria-pressed={o.sizeId === sizeId}
                        onClick={() => chooseSize(o.sizeId)}
                      >
                        <span className="cat-name">
                          {lang === "uk" ? o.label_uk : o.label_en}
                          <span className="cat-dim">
                            {s.length}×{s.width}×{s.height} см
                          </span>
                        </span>
                        <span className="cat-ex">
                          {lang === "uk" ? o.examples_uk : o.examples_en}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="caps muted" style={{ marginTop: 10, letterSpacing: ".08em" }}>
                  {L.calcSizeHint}
                </div>
              </div>

              <div className="field">
                <label>
                  {L.calcWeightExact} · {L.calcWeightLabel}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.02}
                  max={maxStandardWeight(pet) * 2}
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <div className="caps muted" style={{ marginTop: 10, letterSpacing: ".08em" }}>
                  {L.calcWeightHint}
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button
                className="btn btn-solid"
                style={{ width: "100%", marginTop: 12 }}
                onClick={calculate}
              >
                {L.calcSubmit}
              </button>
            </>
          )}

          {/* ─── КРОК 2 ─── */}
          {step === 2 && size && (
            <>
              <div className="result-box">
                <div className="caps muted">
                  {L.calcResultTitle} · {size.code}
                </div>
                <div className="result-dims">
                  <div>
                    <span className="caps muted">{L.calcLength}</span>
                    <strong>{size.length}</strong>
                    <span className="caps muted">см</span>
                  </div>
                  <div>
                    <span className="caps muted">{L.calcWidth}</span>
                    <strong>{size.width}</strong>
                    <span className="caps muted">см</span>
                  </div>
                  <div>
                    <span className="caps muted">{L.calcHeight}</span>
                    <strong>{size.height}</strong>
                    <span className="caps muted">см</span>
                  </div>
                </div>
              </div>

              {overWeight && <div className="notice">{L.calcOverWeight}</div>}

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
                    <ProductImage
                      src={o.product.image}
                      alt={lang === "uk" ? o.product.name_uk : o.product.name_en}
                      art={o.product.art}
                      pet={o.product.pet}
                    />
                  </div>
                  <div>
                    <h4>{lang === "uk" ? o.product.name_uk : o.product.name_en}</h4>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
                      {lang === "uk" ? o.product.material_uk : o.product.material_en}
                    </div>
                    <div className="offer-price">
                      <span
                        className="caps"
                        style={{ color: o.custom ? "var(--grey)" : "var(--gold)" }}
                      >
                        {o.custom ? L.calcCustom : L.calcExact}
                      </span>
                      <span style={{ fontSize: 14 }}>
                        {money(o.price)} {L.uah}
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
          {step === 3 && chosen && size && (
            <>
              <div className="notice">
                <b>{lang === "uk" ? chosen.product.name_uk : chosen.product.name_en}</b>
                {" · "}
                {L.corpusLabel} {size.code} · {size.length}×{size.width}×{size.height} см
                {" · "}
                {money(chosen.price)} {L.uah}
              </div>

              {/* гравіювання */}
              {options.length > 0 && (
                <div className="addons">
                  <div className="addons-head">
                    <span className="caps">{L.engravingTitle}</span>
                    <span className="caps muted">{L.engravingSub}</span>
                  </div>

                  {options.map((o) => (
                    <label
                      key={o.id}
                      className="addon"
                      data-on={engIds.includes(o.id) ? "1" : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={engIds.includes(o.id)}
                        onChange={() => toggleEng(o.id)}
                      />
                      <span className="addon-body">
                        <span className="addon-name">
                          {lang === "uk" ? o.label_uk : o.label_en}
                        </span>
                        <span className="addon-hint">
                          {lang === "uk" ? o.hint_uk : o.hint_en}
                        </span>
                      </span>
                      <span className="addon-price">
                        +{money(o.price_uah)} {L.uah}
                      </span>
                    </label>
                  ))}

                  {needsText && (
                    <div className="field" style={{ marginTop: 16, marginBottom: 4 }}>
                      <label>{L.engravingTextLabel}</label>
                      <textarea
                        value={engText}
                        placeholder={L.engravingTextPlaceholder}
                        onChange={(e) => setEngText(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="totals">
                <div>
                  <span className="muted">{L.coffinLabel}</span>
                  <span>
                    {money(chosen.price)} {L.uah}
                  </span>
                </div>
                {engPrice > 0 && (
                  <div>
                    <span className="muted">{L.engravingTitle}</span>
                    <span>
                      {money(engPrice)} {L.uah}
                    </span>
                  </div>
                )}
                <div className="totals-sum">
                  <span>{L.totalLabel}</span>
                  <span>
                    {money(total)} {L.uah}
                  </span>
                </div>
                <div className="caps muted totals-lead">
                  {L.leadTitle}: {leadLine}
                </div>
              </div>

              <div className="field-row">
                <Field
                  label={L.formFirstName}
                  value={form.first_name}
                  onChange={(v) => setForm({ ...form, first_name: v })}
                />
                <Field
                  label={L.formLastName}
                  value={form.last_name}
                  onChange={(v) => setForm({ ...form, last_name: v })}
                />
              </div>
              <Field
                label={L.formPhone}
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                type="tel"
                placeholder="+380"
              />
              <Field
                label={L.formEmail}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
              />
              <Field
                label={L.formPostOffice}
                value={form.post_office}
                onChange={(v) => setForm({ ...form, post_office: v })}
                placeholder="Дніпро, №12"
              />

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
                <button
                  className="btn btn-sm btn-solid"
                  style={{ flex: 1 }}
                  onClick={submit}
                  disabled={sending}
                >
                  {sending ? L.formSending : L.formSubmit}
                </button>
              </div>
            </>
          )}

          {/* ─── КРОК 4 ─── */}
          {step === 4 && done && (
            <>
              <div className="done-check">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
                  <path d="M1 7l5.5 5.5L17 1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <h3 className="display" style={{ fontSize: 30, margin: "0 0 14px" }}>
                {L.doneTitle}
              </h3>
              <p style={{ lineHeight: 1.85, color: "var(--ink-70)", margin: 0 }}>
                {L.doneText}
              </p>

              <div className="result-box" style={{ marginTop: 26 }}>
                <div className="caps muted">{L.doneNumber}</div>
                <div className="display" style={{ fontSize: 30, marginTop: 6 }}>
                  №{done.id}
                </div>
                <div className="caps muted" style={{ marginTop: 16 }}>
                  {L.totalLabel}
                </div>
                <div className="display" style={{ fontSize: 24, marginTop: 4 }}>
                  {money(done.total)} {L.uah}
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

              <div className="caps muted">
                {L.leadTitle}: {leadLine}
              </div>

              <button
                className="btn btn-solid"
                style={{ width: "100%", marginTop: 20 }}
                onClick={onClose}
              >
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
