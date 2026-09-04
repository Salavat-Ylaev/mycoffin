"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  ArtPattern,
  EngravingOption,
  Order,
  PetKind,
  Product,
} from "@/lib/types";
import { PET_KINDS } from "@/lib/types";
import { sizesFor, sizeById } from "@/lib/calc";
import ProductImage from "@/components/ProductImage";

const PET_LABEL: Record<PetKind, string> = {
  cat: "Кіт",
  dog: "Пес",
  reptile: "Рептилія",
  rodent: "Гризун",
};

const ART_OPTIONS: ArtPattern[] = ["classic", "minimal", "noir", "goldline", "eco"];

const STATUS_LABEL: Record<Order["status"], string> = {
  new: "Новий",
  in_work: "В роботі",
  done: "Виконано",
  cancelled: "Скасовано",
};

type Tab = "products" | "engraving" | "orders" | "health";

interface Check {
  configured: boolean;
  ok: boolean;
  error?: string;
  botName?: string;
  products?: number;
}

interface Health {
  env: Record<string, boolean>;
  telegram: Check;
  mail: Check;
  database: Check;
  storage: Check;
  tested: boolean;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("products");
  const [pet, setPet] = useState<PetKind>("cat");
  const [products, setProducts] = useState<Product[]>([]);
  const [engraving, setEngraving] = useState<EngravingOption[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState("");

  const flash = useCallback((msg: string, ms = 2400) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    setProducts(await res.json());
    setAuthed(true);
  }, []);

  const loadEngraving = useCallback(async () => {
    const res = await fetch("/api/admin/engraving");
    if (res.ok) setEngraving(await res.json());
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(await res.json());
  }, []);

  const runHealth = useCallback(async (test: boolean) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/admin/health${test ? "?test=1" : ""}`);
      if (res.ok) setHealth(await res.json());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "orders") loadOrders();
    if (tab === "engraving") loadEngraving();
    if (tab === "health" && !health) runHealth(false);
  }, [authed, tab, loadOrders, loadEngraving, runHealth, health]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      loadProducts();
    } else {
      setLoginError("Невірний пароль");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
  };

  /* ── товари ── */

  const save = async (p: Product) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Помилка збереження");
    flash(`Збережено: ${p.name_uk}`);
    loadProducts();
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Видалити модель «${p.name_uk}» (${PET_LABEL[p.pet]})?`)) return;
    await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    flash("Видалено");
    loadProducts();
  };

  const addNew = () => {
    const draft: Product = {
      id: `${pet}-${Math.random().toString(36).slice(2, 7)}`,
      pet,
      sort: products.filter((x) => x.pet === pet).length + 1,
      name_uk: "Нова модель",
      name_en: "New model",
      material_uk: "",
      material_en: "",
      desc_uk: "",
      desc_en: "",
      prices: Object.fromEntries(sizesFor(pet).map((o) => [o.sizeId, 0])),
      in_stock: true,
      image: "",
      art: "minimal",
    };
    setProducts([...products, draft]);
  };

  const patch = (id: string, key: keyof Product, value: unknown) =>
    setProducts((list) =>
      list.map((p) => (p.id === id ? ({ ...p, [key]: value } as Product) : p))
    );

  /** ціна моделі під конкретний корпус */
  const patchPrice = (id: string, sizeId: string, value: string) =>
    setProducts((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, prices: { ...(p.prices ?? {}), [sizeId]: Number(value) || 0 } }
          : p
      )
    );

  /**
   * Фото з телефона важить 5–12 МБ, а хостинг не пропускає тіло запиту
   * більше ~4,5 МБ — саме тому частина фото раніше не завантажувалась.
   * Стискаємо прямо в браузері: довша сторона 1600 px, JPEG.
   * Виходить 200–500 КБ, і сайт від цього ще й швидший.
   */
  const compressImage = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      throw new Error(
        "Браузер не відкриває цей файл. Збережіть фото як JPG або PNG (формат HEIC з iPhone не підходить)."
      );
    }

    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Не вдалося обробити фото");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) throw new Error("Не вдалося стиснути фото");
    return blob;
  };

  const upload = async (p: Product, file: File) => {
    try {
      flash("Готуємо фото…");
      const blob = await compressImage(file);

      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));

      flash("Завантажуємо…");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });

      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* хостинг міг відповісти не-JSON — покажемо код статусу */
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Сервер відповів помилкою ${res.status}`);
      }

      // одразу зберігаємо, щоб фото не загубилось, якщо забути натиснути «Зберегти»
      const updated: Product = { ...p, image: data.url };
      setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)));
      await save(updated);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Не вдалося завантажити фото", 7000);
    }
  };

  /* ── гравіювання ── */

  const patchEng = (id: string, key: keyof EngravingOption, value: unknown) =>
    setEngraving((list) =>
      list.map((o) => (o.id === id ? ({ ...o, [key]: value } as EngravingOption) : o))
    );

  const saveEng = async (o: EngravingOption) => {
    const res = await fetch("/api/admin/engraving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(o),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Помилка збереження");
    flash(`Збережено: ${o.label_uk}`);
    loadEngraving();
  };

  /* ── замовлення ── */

  const setStatus = async (id: string, status: Order["status"]) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  /* ───────────── вхід ───────────── */

  if (authed === null) {
    return (
      <div className="login-wrap">
        <div className="caps muted">Завантаження…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={login}>
          <div className="brand-word" style={{ textAlign: "center" }}>
            SPOKIY
          </div>
          <div
            className="caps muted"
            style={{ textAlign: "center", marginTop: 10, marginBottom: 30 }}
          >
            Панель керування
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {loginError && <div className="error">{loginError}</div>}
          <button className="btn btn-solid" style={{ width: "100%", marginTop: 14 }} type="submit">
            Увійти
          </button>
        </form>
      </div>
    );
  }

  /* ───────────── панель ───────────── */

  const list = products.filter((p) => p.pet === pet).sort((a, b) => a.sort - b.sort);

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <div className="brand-word" style={{ textAlign: "left", fontSize: 20 }}>
            SPOKIY
          </div>
          <div className="caps muted" style={{ marginTop: 8 }}>
            Панель керування
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn btn-sm" href="/">
            На сайт
          </a>
          <button className="btn btn-sm" onClick={logout}>
            Вийти
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className="tab" aria-selected={tab === "products"} onClick={() => setTab("products")}>
          Товари
        </button>
        <button className="tab" aria-selected={tab === "engraving"} onClick={() => setTab("engraving")}>
          Нанесення
        </button>
        <button className="tab" aria-selected={tab === "orders"} onClick={() => setTab("orders")}>
          Замовлення
        </button>
        <button className="tab" aria-selected={tab === "health"} onClick={() => setTab("health")}>
          Діагностика
        </button>
      </div>

      {/* ───────── товари ───────── */}
      {tab === "products" && (
        <>
          <div className="tabs" style={{ padding: "0 0 22px" }}>
            {PET_KINDS.map((p) => (
              <button key={p} className="tab" aria-selected={p === pet} onClick={() => setPet(p)}>
                {PET_LABEL[p]}
              </button>
            ))}
            <button className="tab" onClick={addNew} style={{ marginLeft: "auto" }}>
              + Додати модель
            </button>
          </div>

          {list.map((p) => (
            <div key={p.id} className="admin-product">
              <div>
                <div className="admin-product-media">
                  <ProductImage src={p.image} alt={p.name_uk} art={p.art} pet={p.pet} />
                </div>
                <label className="btn btn-sm" style={{ width: "100%", marginTop: 8 }}>
                  {p.image ? "Замінити фото" : "Додати фото"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(p, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div>
                <div className="grid-2">
                  <Cell label="Назва (укр)" value={p.name_uk} onChange={(v) => patch(p.id, "name_uk", v)} />
                  <Cell label="Назва (англ)" value={p.name_en} onChange={(v) => patch(p.id, "name_en", v)} />
                  <Cell label="Матеріал (укр)" value={p.material_uk} onChange={(v) => patch(p.id, "material_uk", v)} />
                  <Cell label="Матеріал (англ)" value={p.material_en} onChange={(v) => patch(p.id, "material_en", v)} />
                  <Cell label="Опис (укр)" value={p.desc_uk} onChange={(v) => patch(p.id, "desc_uk", v)} />
                  <Cell label="Опис (англ)" value={p.desc_en} onChange={(v) => patch(p.id, "desc_en", v)} />
                </div>

                <div className="grid-4" style={{ marginTop: 6 }}>
                  {sizesFor(p.pet).map((o) => {
                    const sz = sizeById(o.sizeId)!;
                    return (
                      <Cell
                        key={o.sizeId}
                        label={`${o.label_uk} · ${sz.length}×${sz.width}×${sz.height}, грн`}
                        type="number"
                        value={p.prices?.[o.sizeId] ?? 0}
                        onChange={(v) => patchPrice(p.id, o.sizeId, v)}
                      />
                    );
                  })}
                  <Cell label="Порядок" type="number" value={p.sort} onChange={(v) => patch(p.id, "sort", Number(v))} />

                  <div className="field" style={{ marginBottom: 12 }}>
                    <label>Стиль малюнка</label>
                    <select value={p.art} onChange={(e) => patch(p.id, "art", e.target.value)}>
                      {ART_OPTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field" style={{ marginBottom: 12 }}>
                    <label>Наявність</label>
                    <select
                      value={p.in_stock ? "1" : "0"}
                      onChange={(e) => patch(p.id, "in_stock", e.target.value === "1")}
                    >
                      <option value="1">В наявності</option>
                      <option value="0">Під замовлення</option>
                    </select>
                  </div>
                </div>

                <Cell
                  label="Посилання на фото (якщо не завантажували файл)"
                  value={p.image}
                  onChange={(v) => patch(p.id, "image", v)}
                />

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn btn-sm btn-solid" onClick={() => save(p)}>
                    Зберегти
                  </button>
                  <button className="btn btn-sm" onClick={() => remove(p)}>
                    Видалити
                  </button>
                  <span className="caps muted" style={{ alignSelf: "center" }}>
                    id: {p.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ───────── гравіювання ───────── */}
      {tab === "engraving" && (
        <>
          <p className="muted" style={{ maxWidth: "62ch", marginTop: 0 }}>
            Платні послуги, які клієнт відмічає галочкою при замовленні. Вимкнена послуга
            зникає з сайту. Термін «+1–3 дні» показується автоматично, щойно обрано
            хоч одну послугу.
          </p>

          {engraving
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((o) => (
              <div key={o.id} className="admin-product" style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <div className="grid-2">
                    <Cell label="Назва (укр)" value={o.label_uk} onChange={(v) => patchEng(o.id, "label_uk", v)} />
                    <Cell label="Назва (англ)" value={o.label_en} onChange={(v) => patchEng(o.id, "label_en", v)} />
                    <Cell label="Пояснення (укр)" value={o.hint_uk} onChange={(v) => patchEng(o.id, "hint_uk", v)} />
                    <Cell label="Пояснення (англ)" value={o.hint_en} onChange={(v) => patchEng(o.id, "hint_en", v)} />
                  </div>

                  <div className="grid-4">
                    <Cell label="Ціна, грн" type="number" value={o.price_uah} onChange={(v) => patchEng(o.id, "price_uah", Number(v))} />
                    <Cell label="Порядок" type="number" value={o.sort} onChange={(v) => patchEng(o.id, "sort", Number(v))} />

                    <div className="field" style={{ marginBottom: 12 }}>
                      <label>Потрібен текст від клієнта</label>
                      <select
                        value={o.needs_text ? "1" : "0"}
                        onChange={(e) => patchEng(o.id, "needs_text", e.target.value === "1")}
                      >
                        <option value="1">Так</option>
                        <option value="0">Ні</option>
                      </select>
                    </div>

                    <div className="field" style={{ marginBottom: 12 }}>
                      <label>Показувати на сайті</label>
                      <select
                        value={o.enabled ? "1" : "0"}
                        onChange={(e) => patchEng(o.id, "enabled", e.target.value === "1")}
                      >
                        <option value="1">Так</option>
                        <option value="0">Ні</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-sm btn-solid" onClick={() => saveEng(o)}>
                    Зберегти
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {/* ───────── замовлення ───────── */}
      {tab === "orders" && (
        <div style={{ overflowX: "auto" }}>
          {orders.length === 0 && <div className="caps muted">Замовлень поки немає</div>}
          {orders.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Дата</th>
                  <th>Клієнт</th>
                  <th>Телефон</th>
                  <th>E-mail</th>
                  <th>Тварина</th>
                  <th>Модель</th>
                  <th>Корпус</th>
                  <th>Нанесення</th>
                  <th>Разом</th>
                  <th>Відділення</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const eng = o.engraving;
                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="dot" />
                        {o.id}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(o.created_at).toLocaleString("uk-UA")}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {o.last_name} {o.first_name}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{o.phone}</td>
                      <td>{o.email}</td>
                      <td>
                        {PET_LABEL[o.pet]}, {o.weight_kg} кг
                      </td>
                      <td>{o.item.product_name}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {o.item.size_code}
                        <div className="muted">
                          {o.item.length_cm}×{o.item.width_cm}×{o.item.height_cm}
                        </div>
                      </td>
                      <td>
                        {eng && eng.ids.length ? (
                          <>
                            {eng.labels.join(", ")}
                            {eng.text && <div className="muted">«{eng.text}»</div>}
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{o.total_uah} грн</td>
                      <td>{o.post_office}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o.id, e.target.value as Order["status"])}
                        >
                          {(Object.keys(STATUS_LABEL) as Order["status"][]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ───────── діагностика ───────── */}
      {tab === "health" && (
        <>
          <p className="muted" style={{ maxWidth: "62ch", marginTop: 0 }}>
            Показує, що бачить сайт саме зараз. Якщо тут щось червоне — замовлення
            не дійдуть. Кнопка з тестом реально надсилає повідомлення в Telegram
            і лист на вашу пошту.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
            <button className="btn btn-sm" onClick={() => runHealth(false)} disabled={checking}>
              {checking ? "Перевіряємо…" : "Перевірити"}
            </button>
            <button
              className="btn btn-sm btn-solid"
              onClick={() => runHealth(true)}
              disabled={checking}
            >
              Перевірити і надіслати тест
            </button>
          </div>

          {health && (
            <>
              <CheckRow title="Telegram" check={health.telegram} okText="Бот на зв'язку" />
              <CheckRow title="Пошта" check={health.mail} okText="SMTP відповідає" />
              <CheckRow
                title="База даних"
                check={health.database}
                okText={`Supabase підключено, товарів: ${health.database.products ?? 0}`}
              />
              <CheckRow
                title="Сховище фото"
                check={health.storage}
                okText="Корзина на місці, фото показуються"
              />

              <div style={{ marginTop: 26 }}>
                <div className="caps muted" style={{ marginBottom: 12 }}>
                  Змінні оточення
                </div>
                <div className="env-grid">
                  {Object.entries(health.env).map(([k, v]) => (
                    <div key={k} className="env-row">
                      <span className={v ? "env-dot on" : "env-dot"} />
                      <code>{k}</code>
                      <span className="muted">{v ? "є" : "немає"}</span>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 14, fontSize: 13, maxWidth: "62ch" }}>
                  Якщо на сайті в інтернеті чогось «немає», а в файлі .env воно є —
                  значить змінну не додали у Vercel: Settings → Environment Variables,
                  потім Deployments → Redeploy.
                </p>
              </div>
            </>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function CheckRow({
  title,
  check,
  okText,
}: {
  title: string;
  check: Check;
  okText: string;
}) {
  const state = check.ok ? "ok" : check.configured ? "fail" : "off";
  const label = check.ok ? okText : check.error || "Не налаштовано";
  return (
    <div className={`check check-${state}`}>
      <span className="check-dot" />
      <div>
        <div className="check-title">{title}</div>
        <div className="check-text">{label}</div>
        {check.botName && check.ok && (
          <div className="check-text muted">@{check.botName}</div>
        )}
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
