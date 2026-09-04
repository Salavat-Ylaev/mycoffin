// Генерує data/products.json — стартовий каталог під стандартні корпуси.
// 5 моделей × 4 типи тварин, у кожної моделі ціна за кожен корпус свого виду.
// Запуск:  node scripts/generate-seed.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Стандартні корпуси — має збігатися з SIZES у lib/calc.ts */
const SIZES = {
  s1: 25,
  s2: 50,
  s3: 65,
  s4: 75,
  s5: 95,
  s6: 100,
  s7: 135,
};

/** Які корпуси доступні кожному виду */
const PET_SIZES = {
  cat: ["s3", "s4"],
  dog: ["s3", "s6", "s7"],
  reptile: ["s2", "s5"],
  rodent: ["s1", "s2"],
};

const MODELS = [
  {
    key: "classic",
    art: "classic",
    name_uk: "Класик",
    name_en: "Classic",
    material_uk: "Дуб, лак, фурнітура під золото",
    material_en: "Oak, lacquer, gold-finished hardware",
    desc_uk: "Класична форма, тепле дерево, м'яка внутрішня оббивка кольору слонової кістки.",
    desc_en: "A classic silhouette in warm wood, lined with soft ivory cloth.",
  },
  {
    key: "minimal",
    art: "minimal",
    name_uk: "Мінімал",
    name_en: "Minimal",
    material_uk: "МДФ, матова біла емаль",
    material_en: "MDF, matte white enamel",
    desc_uk: "Чисті лінії без декору. Біла матова поверхня, прихована фурнітура.",
    desc_en: "Clean lines, no ornament. Matte white surface, concealed hardware.",
  },
  {
    key: "noir",
    art: "noir",
    name_uk: "Ноар",
    name_en: "Noir",
    material_uk: "Ясен, чорна матова емаль",
    material_en: "Ash, matte black enamel",
    desc_uk: "Глибокий чорний корпус і тонкий золотий кант по периметру кришки.",
    desc_en: "A deep black body with a thin gold rule around the lid.",
  },
  {
    key: "goldline",
    art: "goldline",
    name_uk: "Голд Лайн",
    name_en: "Gold Line",
    material_uk: "Біла емаль, золоте гравіювання",
    material_en: "White enamel, gold engraving",
    desc_uk: "Біла емаль із гравіюванням імені та дат сусальним золотом.",
    desc_en: "White enamel with the name and dates engraved in gold leaf.",
  },
  {
    key: "eco",
    art: "eco",
    name_uk: "Еко",
    name_en: "Eco",
    material_uk: "Березова фанера, льон, без лаку",
    material_en: "Birch plywood, linen, unlacquered",
    desc_uk: "Біорозкладна модель для поховання в землю. Натуральні матеріали.",
    desc_en: "A biodegradable model for burial. Natural materials only.",
  },
];

/**
 * Стартовий прайс. Рахується від опорної довжини та надбавки за сантиметр —
 * але це лише щоб згенерувати перші числа. Далі ціни живуть в адмінці
 * і правляться руками, формула більше ніде не використовується.
 */
const PRICING = {
  cat: { baseLength: 48, models: { classic: [3200, 55], minimal: [2400, 42], noir: [3600, 60], goldline: [4200, 70], eco: [1800, 32] } },
  dog: { baseLength: 70, models: { classic: [5200, 60], minimal: [4100, 48], noir: [5900, 66], goldline: [6800, 78], eco: [3200, 36] } },
  reptile: { baseLength: 45, models: { classic: [2600, 48], minimal: [2000, 38], noir: [2900, 52], goldline: [3400, 62], eco: [1500, 28] } },
  rodent: { baseLength: 24, models: { classic: [1600, 40], minimal: [1200, 32], noir: [1800, 45], goldline: [2200, 55], eco: [900, 22] } },
};

const priceFor = (pet, modelKey, sizeId) => {
  const cfg = PRICING[pet];
  const [base, perCm] = cfg.models[modelKey];
  const raw = base + (SIZES[sizeId] - cfg.baseLength) * perCm;
  return Math.max(Math.round(raw / 50) * 50, Math.round((base * 0.6) / 50) * 50);
};

const products = [];
for (const [pet, sizeIds] of Object.entries(PET_SIZES)) {
  MODELS.forEach((m, i) => {
    const prices = {};
    for (const sizeId of sizeIds) prices[sizeId] = priceFor(pet, m.key, sizeId);

    products.push({
      id: `${pet}-${m.key}`,
      pet,
      sort: i + 1,
      name_uk: m.name_uk,
      name_en: m.name_en,
      material_uk: m.material_uk,
      material_en: m.material_en,
      desc_uk: m.desc_uk,
      desc_en: m.desc_en,
      prices,
      in_stock: true,
      image: "",
      art: m.art,
    });
  });
}

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(
  join(root, "data", "products.json"),
  JSON.stringify(products, null, 2) + "\n",
  "utf8"
);
console.log(`OK: ${products.length} товарів → data/products.json`);
