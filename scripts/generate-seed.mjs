// Генерує data/products.json — стартовий каталог: 5 моделей на кожен тип тварини.
// Запуск:  node scripts/generate-seed.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const PETS = {
  cat: {
    base_length_cm: 48,
    variants: {
      classic: [34, 70, 3200, 55],
      minimal: [34, 70, 2400, 42],
      noir: [38, 70, 3600, 60],
      goldline: [34, 66, 4200, 70],
      eco: [34, 70, 1800, 32],
    },
  },
  dog: {
    base_length_cm: 70,
    variants: {
      classic: [32, 120, 5200, 60],
      minimal: [32, 120, 4100, 48],
      noir: [40, 130, 5900, 66],
      goldline: [32, 110, 6800, 78],
      eco: [32, 120, 3200, 36],
    },
  },
  reptile: {
    base_length_cm: 45,
    variants: {
      classic: [24, 100, 2600, 48],
      minimal: [24, 100, 2000, 38],
      noir: [24, 110, 2900, 52],
      goldline: [24, 90, 3400, 62],
      eco: [24, 100, 1500, 28],
    },
  },
  rodent: {
    base_length_cm: 24,
    variants: {
      classic: [18, 40, 1600, 40],
      minimal: [18, 40, 1200, 32],
      noir: [18, 40, 1800, 45],
      goldline: [18, 36, 2200, 55],
      eco: [18, 40, 900, 22],
    },
  },
};

const products = [];
for (const [pet, cfg] of Object.entries(PETS)) {
  MODELS.forEach((m, i) => {
    const [min, max, base, perCm] = cfg.variants[m.key];
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
      min_length_cm: min,
      max_length_cm: max,
      base_price_uah: base,
      base_length_cm: cfg.base_length_cm,
      price_per_cm_uah: perCm,
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
