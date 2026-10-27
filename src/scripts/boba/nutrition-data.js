// Project reference recipe, not a prediction for a specific commercial drink.
export const REFERENCE_VOLUME_ML = 500;
export const GRAMS_PER_CUBE = 4;
export const FREE_SUGAR_REFERENCE_G = 25;

export const sources = Object.freeze({
  min: Object.freeze({
    title: 'Min et al. · Calories and sugars in boba milk tea',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5217910/',
    note: 'Research context. Article access was blocked during verification; not used to verify the numerical ingredient values.',
  }),
  tpTea: Object.freeze({
    title: 'TP TEA Las Vegas · Nutrition Facts',
    url: 'https://tptealasvegas.snk.site/nutrition-facts',
    note: 'Verified topping table: pearl 5.38 g, pudding 9.13 g, grass jelly 3.79 g total sugar. Serving weights and free sugar breakdown are not specified.',
  }),
  bossen: Object.freeze({
    title: 'Bossen Rainbow Jelly · Product specification (PDF)',
    url: 'https://www.webstaurantstore.com/documents/nutrition/bossen_rainbow_jelly.pdf',
    note: 'Verified label: 13 g total and added sugar per 50 g. This sweetened konjac-containing jelly is the model proxy for Konjac; other formulations vary.',
  }),
  gongCha: Object.freeze({
    title: 'Gong cha USA · Supplied January 2024 nutrition link',
    url: 'https://gongchausofficial.com/wp-content/uploads/2024/02/Gong-cha-nutritional-info-Jan-2024.pdf',
    note: 'This former PDF link currently redirects to the brand homepage; its nutrition values could not be verified and are not used in calculations.',
  }),
  who: Object.freeze({
    title: 'WHO · Healthy diet',
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    note: 'Daily free sugar guidance. The project uses the 5% energy reference: 25 g at 2,000 kcal/day, not a per-drink limit.',
  }),
});

const ingredient = (label, totalSugarG, freeSugarMinG, freeSugarMaxG, source, portion) =>
  Object.freeze({ label, totalSugarG, freeSugarMinG, freeSugarMaxG, source, portion });

export const ingredients = Object.freeze({
  greenTea: ingredient('Green Tea', 0, 0, 0, null, 'Unsweetened tea; project reference'),
  blackTea: ingredient('Black Tea', 0, 0, 0, null, 'Unsweetened tea; project reference'),
  milk: ingredient('Plain Milk', 4.8, 0, 0, null, '100 mL; supplied project reference value, not independently verified'),
  boba: ingredient('Boba', 5.38, 0, 5.38, 'tpTea', 'Reference serving; weight unspecified by source'),
  pudding: ingredient('Pudding', 9.13, 0, 9.13, 'tpTea', 'Reference serving; weight unspecified by source'),
  grass: ingredient('Grass Jelly', 3.79, 0, 3.79, 'tpTea', 'Reference serving; weight unspecified by source'),
  konjac: ingredient('Sweetened Konjac Jelly', 13, 13, 13, 'bossen', '50 g sweetened jelly proxy'),
});

export const TOPPING_KEYS = Object.freeze(['boba', 'pudding', 'grass', 'konjac']);
// Illustrative linear syrup recipe: 100% means 32 g, not an industry standard.
export const syrupSugarG = Object.freeze({ '0%': 0, '30%': 9.6, '50%': 16, '70%': 22.4, '100%': 32 });
