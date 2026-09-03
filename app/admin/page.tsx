"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ArtPattern, Order, PetKind, Product } from "@/lib/types";
import { PET_KINDS } from "@/lib/types";
import CoffinArt from "@/components/CoffinArt";

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

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [pet, setPet] = useState<PetKind>("cat");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState("");

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
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

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(await res.json());
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (authed && tab === "orders") loadOrders();
  }, [authed, tab, loadOrders]);

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
    const ok = window.confirm(`Видалити модель «${p.name_uk}» (${PET_LABEL[p.pet]})?`);
    if (!ok) return;
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
      min_length_cm: 20,
      max_length_cm: 60,
      base_price_uah: 2000,
      base_length_cm: 40,
      price_per_cm_uah: 40,
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

  const upload = async (p: Product, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    flash("Завантажуємо фото…");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Не вдалося завантажити");
    patch(p.id, "image", data.url);
    flash("Фото завантажено — не забудьте «Зберегти»");
  };

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
          <div className="caps muted" style={{ textAlign: "center", marginTop: 10, marginBottom: 30 }}>
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
        <button className="tab" aria-selected={tab === "orders"} onClick={() => setTab("orders")}>
          Замовлення
        </button>
      </div>

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
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" />
                  ) : (
                    <CoffinArt art={p.art} />
                  )}
                </div>
                <label className="btn btn-sm" style={{ width: "100%", marginTop: 8 }}>
                  Фото
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
                  <Cell label="Довжина від, см" type="number" value={p.min_length_cm} onChange={(v) => patch(p.id, "min_length_cm", Number(v))} />
                  <Cell label="Довжина до, см" type="number" value={p.max_length_cm} onChange={(v) => patch(p.id, "max_length_cm", Number(v))} />
                  <Cell label="Базова довжина, см" type="number" value={p.base_length_cm} onChange={(v) => patch(p.id, "base_length_cm", Number(v))} />
                  <Cell label="Ціна за базову, грн" type="number" value={p.base_price_uah} onChange={(v) => patch(p.id, "base_price_uah", Number(v))} />
                  <Cell label="Доплата за 1 см, грн" type="number" value={p.price_per_cm_uah} onChange={(v) => patch(p.id, "price_per_cm_uah", Number(v))} />
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

                <Cell label="Посилання на фото (якщо не завантажували файл)" value={p.image} onChange={(v) => patch(p.id, "image", v)} />

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
                  <th>Розмір</th>
                  <th>Ціна</th>
                  <th>Відділення</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
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
                      {o.item.length_cm}×{o.item.width_cm}×{o.item.height_cm}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{o.item.price_uah} грн</td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

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
