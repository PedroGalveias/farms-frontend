import { categoryLabel } from "@/lib/categories";
import type { Locale } from "@/lib/i18n";

/**
 * Product (subcategory) taxonomy, generated from the farm dataset by
 * scripts/transform-farms.py. Each product belongs to one of the 13 category
 * groups (the keys in lib/categories.ts). Canonical key = the German product
 * name; English comes from the dataset. fr/it/rm fall back to English until
 * authored. Regenerate after the dataset changes.
 */
interface ProductMeta {
  group: string;
  labels: Partial<Record<Locale, string>> & { de: string; en: string };
}

export const PRODUCTS: Record<string, ProductMeta> = {
  Ananas: { group: "Früchte", labels: { de: "Ananas", en: "Pineapple" } },
  Aprikosen: { group: "Früchte", labels: { de: "Aprikosen", en: "Apricots" } },
  Birnen: { group: "Früchte", labels: { de: "Birnen", en: "Pears" } },
  Brombeeren: {
    group: "Früchte",
    labels: { de: "Brombeeren", en: "Blackberries" },
  },
  Erdbeeren: {
    group: "Früchte",
    labels: { de: "Erdbeeren", en: "Strawberries" },
  },
  Feigen: { group: "Früchte", labels: { de: "Feigen", en: "Figs" } },
  Grapefruits: {
    group: "Früchte",
    labels: { de: "Grapefruits", en: "Grapefruits" },
  },
  Heidelbeeren: {
    group: "Früchte",
    labels: { de: "Heidelbeeren", en: "Blueberries" },
  },
  Himbeeren: {
    group: "Früchte",
    labels: { de: "Himbeeren", en: "Raspberries" },
  },
  Johannisbeeren: {
    group: "Früchte",
    labels: { de: "Johannisbeeren", en: "Currants" },
  },
  Kirschen: { group: "Früchte", labels: { de: "Kirschen", en: "Cherries" } },
  Kiwis: { group: "Früchte", labels: { de: "Kiwis", en: "Kiwis" } },
  Mirabellen: {
    group: "Früchte",
    labels: { de: "Mirabellen", en: "Mirabelle Plums" },
  },
  Orangen: { group: "Früchte", labels: { de: "Orangen", en: "Oranges" } },
  Pfirsiche: { group: "Früchte", labels: { de: "Pfirsiche", en: "Peaches" } },
  Pflaumen: { group: "Früchte", labels: { de: "Pflaumen", en: "Plums" } },
  Quitten: { group: "Früchte", labels: { de: "Quitten", en: "Quinces" } },
  Rhabarber: { group: "Früchte", labels: { de: "Rhabarber", en: "Rhubarb" } },
  Stachelbeeren: {
    group: "Früchte",
    labels: { de: "Stachelbeeren", en: "Gooseberries" },
  },
  Steinobst: {
    group: "Früchte",
    labels: { de: "Steinobst", en: "Stone Fruits" },
  },
  Weintrauben: {
    group: "Früchte",
    labels: { de: "Weintrauben", en: "Grapes" },
  },
  Zwetschgen: {
    group: "Früchte",
    labels: { de: "Zwetschgen", en: "Damson Plums" },
  },
  Äpfel: { group: "Früchte", labels: { de: "Äpfel", en: "Apples" } },
  Artischocken: {
    group: "Gemüse",
    labels: { de: "Artischocken", en: "Artichokes" },
  },
  Auberginen: {
    group: "Gemüse",
    labels: { de: "Auberginen", en: "Eggplants" },
  },
  Batavia: {
    group: "Gemüse",
    labels: { de: "Batavia", en: "Batavia Lettuce" },
  },
  Blumenkohl: {
    group: "Gemüse",
    labels: { de: "Blumenkohl", en: "Cauliflower" },
  },
  Bohnen: { group: "Gemüse", labels: { de: "Bohnen", en: "Beans" } },
  Broccoli: { group: "Gemüse", labels: { de: "Broccoli", en: "Broccoli" } },
  Chicorée: { group: "Gemüse", labels: { de: "Chicorée", en: "Chicory" } },
  Erbsen: { group: "Gemüse", labels: { de: "Erbsen", en: "Peas" } },
  Federkohl: { group: "Gemüse", labels: { de: "Federkohl", en: "Kale" } },
  Fenchel: { group: "Gemüse", labels: { de: "Fenchel", en: "Fennel" } },
  Frischgemuese: {
    group: "Gemüse",
    labels: { de: "Frischgemuese", en: "Fresh Vegetables" },
  },
  Fruchtgemüse: {
    group: "Gemüse",
    labels: { de: "Fruchtgemüse", en: "Fruit Vegetables" },
  },
  Gewürzgemüse: {
    group: "Gemüse",
    labels: { de: "Gewürzgemüse", en: "Spice Vegetables" },
  },
  Gurken: { group: "Gemüse", labels: { de: "Gurken", en: "Cucumbers" } },
  Karotten: { group: "Gemüse", labels: { de: "Karotten", en: "Carrots" } },
  Kartoffeln: { group: "Gemüse", labels: { de: "Kartoffeln", en: "Potatoes" } },
  Kohl: { group: "Gemüse", labels: { de: "Kohl", en: "Cabbage" } },
  Kohlrabi: { group: "Gemüse", labels: { de: "Kohlrabi", en: "Kohlrabi" } },
  Kopfsalat: { group: "Gemüse", labels: { de: "Kopfsalat", en: "Lettuce" } },
  Kürbis: { group: "Gemüse", labels: { de: "Kürbis", en: "Pumpkins" } },
  Lauch: { group: "Gemüse", labels: { de: "Lauch", en: "Leeks" } },
  Mais: { group: "Gemüse", labels: { de: "Mais", en: "Corn" } },
  "Peperoni / Paprika": {
    group: "Gemüse",
    labels: { de: "Peperoni / Paprika", en: "Peppers" },
  },
  Petersilie: { group: "Gemüse", labels: { de: "Petersilie", en: "Parsley" } },
  Radieschen: { group: "Gemüse", labels: { de: "Radieschen", en: "Radishes" } },
  Randen: { group: "Gemüse", labels: { de: "Randen", en: "Beets" } },
  Rucola: { group: "Gemüse", labels: { de: "Rucola", en: "Arugula" } },
  Salate: { group: "Gemüse", labels: { de: "Salate", en: "Salads" } },
  Sellerie: { group: "Gemüse", labels: { de: "Sellerie", en: "Celery" } },
  Spargel: { group: "Gemüse", labels: { de: "Spargel", en: "Asparagus" } },
  Spinat: { group: "Gemüse", labels: { de: "Spinat", en: "Spinach" } },
  Tomaten: { group: "Gemüse", labels: { de: "Tomaten", en: "Tomatoes" } },
  Zucchetti: { group: "Gemüse", labels: { de: "Zucchetti", en: "Zucchini" } },
  Zwiebeln: { group: "Gemüse", labels: { de: "Zwiebeln", en: "Onions" } },
  Alpkäse: {
    group: "Milchprodukte",
    labels: { de: "Alpkäse", en: "Alp Cheese" },
  },
  Bergkäse: {
    group: "Milchprodukte",
    labels: { de: "Bergkäse", en: "Mountain Cheese" },
  },
  Brie: { group: "Milchprodukte", labels: { de: "Brie", en: "Brie" } },
  Butter: { group: "Milchprodukte", labels: { de: "Butter", en: "Butter" } },
  Fonduemischung: {
    group: "Milchprodukte",
    labels: { de: "Fonduemischung", en: "Fondue Mix" },
  },
  Frischkäse: {
    group: "Milchprodukte",
    labels: { de: "Frischkäse", en: "Fresh Cheese" },
  },
  Hobelkäse: {
    group: "Milchprodukte",
    labels: { de: "Hobelkäse", en: "Sliced Cheese" },
  },
  Joghurt: { group: "Milchprodukte", labels: { de: "Joghurt", en: "Yogurt" } },
  Käse: { group: "Milchprodukte", labels: { de: "Käse", en: "Cheese" } },
  Milch: { group: "Milchprodukte", labels: { de: "Milch", en: "Milk" } },
  Milchprodukte: {
    group: "Milchprodukte",
    labels: { de: "Milchprodukte", en: "Dairy Products" },
  },
  Mutschli: {
    group: "Milchprodukte",
    labels: { de: "Mutschli", en: "Small Round Cheese" },
  },
  Quark: { group: "Milchprodukte", labels: { de: "Quark", en: "Curd Cheese" } },
  Raclettekäse: {
    group: "Milchprodukte",
    labels: { de: "Raclettekäse", en: "Raclette Cheese" },
  },
  Rahm: { group: "Milchprodukte", labels: { de: "Rahm", en: "Cream" } },
  Sauerrahm: {
    group: "Milchprodukte",
    labels: { de: "Sauerrahm", en: "Sour Cream" },
  },
  Schafskäse: {
    group: "Milchprodukte",
    labels: { de: "Schafskäse", en: "Sheep Cheese" },
  },
  Ziegenkäse: {
    group: "Milchprodukte",
    labels: { de: "Ziegenkäse", en: "Goat Cheese" },
  },
  Ziegenmilch: {
    group: "Milchprodukte",
    labels: { de: "Ziegenmilch", en: "Goat Milk" },
  },
  "Angus-Beef": {
    group: "Fleisch und Geflügel",
    labels: { de: "Angus-Beef", en: "Angus Beef" },
  },
  Büffel: {
    group: "Fleisch und Geflügel",
    labels: { de: "Büffel", en: "Buffalo" },
  },
  Charolais: {
    group: "Fleisch und Geflügel",
    labels: { de: "Charolais", en: "Charolais Beef" },
  },
  Dexter: {
    group: "Fleisch und Geflügel",
    labels: { de: "Dexter", en: "Dexter Beef" },
  },
  Engadinerschaf: {
    group: "Fleisch und Geflügel",
    labels: { de: "Engadinerschaf", en: "Engadine Sheep" },
  },
  "Galloway-Rind": {
    group: "Fleisch und Geflügel",
    labels: { de: "Galloway-Rind", en: "Galloway Beef" },
  },
  Gans: { group: "Fleisch und Geflügel", labels: { de: "Gans", en: "Goose" } },
  Gitzi: {
    group: "Fleisch und Geflügel",
    labels: { de: "Gitzi", en: "Kid Goat" },
  },
  Hirsch: {
    group: "Fleisch und Geflügel",
    labels: { de: "Hirsch", en: "Venison" },
  },
  Hochlandrind: {
    group: "Fleisch und Geflügel",
    labels: { de: "Hochlandrind", en: "Highland Cattle" },
  },
  Jungrind: {
    group: "Fleisch und Geflügel",
    labels: { de: "Jungrind", en: "Young Beef" },
  },
  Kalb: { group: "Fleisch und Geflügel", labels: { de: "Kalb", en: "Veal" } },
  Kaninchen: {
    group: "Fleisch und Geflügel",
    labels: { de: "Kaninchen", en: "Rabbit" },
  },
  Lamm: { group: "Fleisch und Geflügel", labels: { de: "Lamm", en: "Lamb" } },
  "Piemonteser Rind": {
    group: "Fleisch und Geflügel",
    labels: { de: "Piemonteser Rind", en: "Piemontese Beef" },
  },
  Poulet: {
    group: "Fleisch und Geflügel",
    labels: { de: "Poulet", en: "Chicken" },
  },
  Rind: { group: "Fleisch und Geflügel", labels: { de: "Rind", en: "Beef" } },
  Schaf: {
    group: "Fleisch und Geflügel",
    labels: { de: "Schaf", en: "Sheep" },
  },
  Schwein: {
    group: "Fleisch und Geflügel",
    labels: { de: "Schwein", en: "Pork" },
  },
  Truthahn: {
    group: "Fleisch und Geflügel",
    labels: { de: "Truthahn", en: "Turkey" },
  },
  Wild: { group: "Fleisch und Geflügel", labels: { de: "Wild", en: "Game" } },
  Wollschwein: {
    group: "Fleisch und Geflügel",
    labels: { de: "Wollschwein", en: "Mangalica Pig" },
  },
  Apfelessig: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Apfelessig", en: "Apple Cider Vinegar" },
  },
  Birnensirup: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Birnensirup", en: "Pear Syrup" },
  },
  Dörrbohnen: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Dörrbohnen", en: "Dried Beans" },
  },
  Dörrfrüchte: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Dörrfrüchte", en: "Dried Fruits" },
  },
  Eingemachtes: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Eingemachtes", en: "Preserves" },
  },
  Konfitüren: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Konfitüren", en: "Jams" },
  },
  Mostbröckli: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Mostbröckli", en: "Air-dried Beef" },
  },
  Rauchwürste: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Rauchwürste", en: "Smoked Sausages" },
  },
  Speck: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Speck", en: "Bacon" },
  },
  Trockenfleisch: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Trockenfleisch", en: "Dried Meat" },
  },
  Trockenwürste: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Trockenwürste", en: "Dried Sausages" },
  },
  Wurst: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Wurst", en: "Sausage" },
  },
  Wurstwaren: {
    group: "Verarbeitete und haltbare Produkte",
    labels: { de: "Wurstwaren", en: "Processed Sausages" },
  },
  Birnel: {
    group: "Honig und Süßstoffe",
    labels: { de: "Birnel", en: "Pear Honey" },
  },
  Blütenhonig: {
    group: "Honig und Süßstoffe",
    labels: { de: "Blütenhonig", en: "Blossom Honey" },
  },
  Holundersirup: {
    group: "Honig und Süßstoffe",
    labels: { de: "Holundersirup", en: "Elderberry Syrup" },
  },
  Honig: { group: "Honig und Süßstoffe", labels: { de: "Honig", en: "Honey" } },
  Waldhonig: {
    group: "Honig und Süßstoffe",
    labels: { de: "Waldhonig", en: "Forest Honey" },
  },
  "Apfelsaft / Süssmost": {
    group: "Getränke",
    labels: { de: "Apfelsaft / Süssmost", en: "Apple Juice / Cider" },
  },
  Apfelwein: {
    group: "Getränke",
    labels: { de: "Apfelwein", en: "Apple Wine" },
  },
  Destillate: {
    group: "Getränke",
    labels: { de: "Destillate", en: "Distillates" },
  },
  Essig: { group: "Getränke", labels: { de: "Essig", en: "Vinegar" } },
  "Glace / Eiscreme": {
    group: "Getränke",
    labels: { de: "Glace / Eiscreme", en: "Ice Cream" },
  },
  Holunderblütensirup: {
    group: "Getränke",
    labels: { de: "Holunderblütensirup", en: "Elderflower Syrup" },
  },
  Liköre: { group: "Getränke", labels: { de: "Liköre", en: "Liqueurs" } },
  Melissensirup: {
    group: "Getränke",
    labels: { de: "Melissensirup", en: "Lemon Balm Syrup" },
  },
  Pfefferminzsirup: {
    group: "Getränke",
    labels: { de: "Pfefferminzsirup", en: "Peppermint Syrup" },
  },
  Schnaps: { group: "Getränke", labels: { de: "Schnaps", en: "Brandy" } },
  Sirup: { group: "Getränke", labels: { de: "Sirup", en: "Syrup" } },
  Bauernbrot: {
    group: "Backwaren und Gebäck",
    labels: { de: "Bauernbrot", en: "Farmhouse Bread" },
  },
  Brot: { group: "Backwaren und Gebäck", labels: { de: "Brot", en: "Bread" } },
  Gebäck: {
    group: "Backwaren und Gebäck",
    labels: { de: "Gebäck", en: "Pastry" },
  },
  "Kuchen und Süsses": {
    group: "Backwaren und Gebäck",
    labels: { de: "Kuchen und Süsses", en: "Cakes and Sweets" },
  },
  Meringue: {
    group: "Backwaren und Gebäck",
    labels: { de: "Meringue", en: "Meringue" },
  },
  Zopf: {
    group: "Backwaren und Gebäck",
    labels: { de: "Zopf", en: "Plaited Bread" },
  },
  Blumen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Blumen", en: "Flowers" },
  },
  Dahlien: {
    group: "Blumen und Pflanzen",
    labels: { de: "Dahlien", en: "Dahlias" },
  },
  Gladiolen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Gladiolen", en: "Gladioli" },
  },
  Goldmelissen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Goldmelissen", en: "Bee Balm" },
  },
  Hortensien: {
    group: "Blumen und Pflanzen",
    labels: { de: "Hortensien", en: "Hydrangeas" },
  },
  Kresse: {
    group: "Blumen und Pflanzen",
    labels: { de: "Kresse", en: "Cress" },
  },
  "Kräuter und Gewürze": {
    group: "Blumen und Pflanzen",
    labels: { de: "Kräuter und Gewürze", en: "Herbs and Spices" },
  },
  Lavendel: {
    group: "Blumen und Pflanzen",
    labels: { de: "Lavendel", en: "Lavender" },
  },
  Lilien: {
    group: "Blumen und Pflanzen",
    labels: { de: "Lilien", en: "Lilies" },
  },
  Minze: { group: "Blumen und Pflanzen", labels: { de: "Minze", en: "Mint" } },
  Narzissen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Narzissen", en: "Daffodils" },
  },
  Osterglocken: {
    group: "Blumen und Pflanzen",
    labels: { de: "Osterglocken", en: "Easter Lilies" },
  },
  Pfingstrosen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Pfingstrosen", en: "Peonies" },
  },
  Rosen: { group: "Blumen und Pflanzen", labels: { de: "Rosen", en: "Roses" } },
  Sonnenblumen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Sonnenblumen", en: "Sunflowers" },
  },
  Tannenzweige: {
    group: "Blumen und Pflanzen",
    labels: { de: "Tannenzweige", en: "Fir Branches" },
  },
  Tulpen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Tulpen", en: "Tulips" },
  },
  Baumnüsse: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Baumnüsse", en: "Walnuts" },
  },
  Haselnüsse: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Haselnüsse", en: "Hazelnuts" },
  },
  Kastanien: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Kastanien", en: "Chestnuts" },
  },
  Leinöl: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Leinöl", en: "Linseed Oil" },
  },
  Mandeln: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Mandeln", en: "Almonds" },
  },
  Nussöl: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Nussöl", en: "Nut Oil" },
  },
  "Nüssler / Feldsalat": {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Nüssler / Feldsalat", en: "Lamb's Lettuce" },
  },
  Rapsöl: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Rapsöl", en: "Rapeseed Oil" },
  },
  Sonnenblumenöl: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Sonnenblumenöl", en: "Sunflower Oil" },
  },
  Ölsamen: {
    group: "Nüsse, Samen und Öle",
    labels: { de: "Ölsamen", en: "Oilseeds" },
  },
  Dinkel: {
    group: "Getreide und Cerealien",
    labels: { de: "Dinkel", en: "Spelt" },
  },
  Gerste: {
    group: "Getreide und Cerealien",
    labels: { de: "Gerste", en: "Barley" },
  },
  Getreide: {
    group: "Getreide und Cerealien",
    labels: { de: "Getreide", en: "Grains" },
  },
  Maismehl: {
    group: "Getreide und Cerealien",
    labels: { de: "Maismehl", en: "Cornmeal" },
  },
  Mehl: {
    group: "Getreide und Cerealien",
    labels: { de: "Mehl", en: "Flour" },
  },
  Müesli: {
    group: "Getreide und Cerealien",
    labels: { de: "Müesli", en: "Muesli" },
  },
  Polenta: {
    group: "Getreide und Cerealien",
    labels: { de: "Polenta", en: "Polenta" },
  },
  Roggen: {
    group: "Getreide und Cerealien",
    labels: { de: "Roggen", en: "Rye" },
  },
  UrDinkel: {
    group: "Getreide und Cerealien",
    labels: { de: "UrDinkel", en: "Ancient Spelt" },
  },
  Weizen: {
    group: "Getreide und Cerealien",
    labels: { de: "Weizen", en: "Wheat" },
  },
  Austernseitlinge: {
    group: "Fisch und Meeresfrüchte",
    labels: { de: "Austernseitlinge", en: "Oyster Mushrooms" },
  },
  Fisch: {
    group: "Fisch und Meeresfrüchte",
    labels: { de: "Fisch", en: "Fish" },
  },
  Forelle: {
    group: "Fisch und Meeresfrüchte",
    labels: { de: "Forelle", en: "Trout" },
  },
  Brennholz: {
    group: "Sonstiges",
    labels: { de: "Brennholz", en: "Fuelwood" },
  },
  Chemineeholz: {
    group: "Sonstiges",
    labels: { de: "Chemineeholz", en: "Firewood" },
  },
  Finnenkerze: {
    group: "Sonstiges",
    labels: { de: "Finnenkerze", en: "Finn Candle" },
  },
  Forstwaren: {
    group: "Sonstiges",
    labels: { de: "Forstwaren", en: "Forest Products" },
  },
  Geschenkideen: {
    group: "Sonstiges",
    labels: { de: "Geschenkideen", en: "Gift Ideas" },
  },
  Gärmost: {
    group: "Sonstiges",
    labels: { de: "Gärmost", en: "Fermented Apple Juice" },
  },
  Holzofenbrot: {
    group: "Sonstiges",
    labels: { de: "Holzofenbrot", en: "Wood-fired Bread" },
  },
  Wachteleier: {
    group: "Sonstiges",
    labels: { de: "Wachteleier", en: "Quail Eggs" },
  },
  Weihnachtsbäume: {
    group: "Sonstiges",
    labels: { de: "Weihnachtsbäume", en: "Christmas Trees" },
  },
  Öl: { group: "Sonstiges", labels: { de: "Öl", en: "Oil" } },
};

export const PRODUCTS_BY_GROUP: Record<string, string[]> = {
  Früchte: [
    "Ananas",
    "Aprikosen",
    "Birnen",
    "Brombeeren",
    "Erdbeeren",
    "Feigen",
    "Grapefruits",
    "Heidelbeeren",
    "Himbeeren",
    "Johannisbeeren",
    "Kirschen",
    "Kiwis",
    "Mirabellen",
    "Orangen",
    "Pfirsiche",
    "Pflaumen",
    "Quitten",
    "Rhabarber",
    "Stachelbeeren",
    "Steinobst",
    "Weintrauben",
    "Zwetschgen",
    "Äpfel",
  ],
  Gemüse: [
    "Artischocken",
    "Auberginen",
    "Batavia",
    "Blumenkohl",
    "Bohnen",
    "Broccoli",
    "Chicorée",
    "Erbsen",
    "Federkohl",
    "Fenchel",
    "Frischgemuese",
    "Fruchtgemüse",
    "Gewürzgemüse",
    "Gurken",
    "Karotten",
    "Kartoffeln",
    "Kohl",
    "Kohlrabi",
    "Kopfsalat",
    "Kürbis",
    "Lauch",
    "Mais",
    "Peperoni / Paprika",
    "Petersilie",
    "Radieschen",
    "Randen",
    "Rucola",
    "Salate",
    "Sellerie",
    "Spargel",
    "Spinat",
    "Tomaten",
    "Zucchetti",
    "Zwiebeln",
  ],
  Milchprodukte: [
    "Alpkäse",
    "Bergkäse",
    "Brie",
    "Butter",
    "Fonduemischung",
    "Frischkäse",
    "Hobelkäse",
    "Joghurt",
    "Käse",
    "Milch",
    "Milchprodukte",
    "Mutschli",
    "Quark",
    "Raclettekäse",
    "Rahm",
    "Sauerrahm",
    "Schafskäse",
    "Ziegenkäse",
    "Ziegenmilch",
  ],
  "Fleisch und Geflügel": [
    "Angus-Beef",
    "Büffel",
    "Charolais",
    "Dexter",
    "Engadinerschaf",
    "Galloway-Rind",
    "Gans",
    "Gitzi",
    "Hirsch",
    "Hochlandrind",
    "Jungrind",
    "Kalb",
    "Kaninchen",
    "Lamm",
    "Piemonteser Rind",
    "Poulet",
    "Rind",
    "Schaf",
    "Schwein",
    "Truthahn",
    "Wild",
    "Wollschwein",
  ],
  "Verarbeitete und haltbare Produkte": [
    "Apfelessig",
    "Birnensirup",
    "Dörrbohnen",
    "Dörrfrüchte",
    "Eingemachtes",
    "Konfitüren",
    "Mostbröckli",
    "Rauchwürste",
    "Speck",
    "Trockenfleisch",
    "Trockenwürste",
    "Wurst",
    "Wurstwaren",
  ],
  "Honig und Süßstoffe": [
    "Birnel",
    "Blütenhonig",
    "Holundersirup",
    "Honig",
    "Waldhonig",
  ],
  Getränke: [
    "Apfelsaft / Süssmost",
    "Apfelwein",
    "Destillate",
    "Essig",
    "Glace / Eiscreme",
    "Holunderblütensirup",
    "Liköre",
    "Melissensirup",
    "Pfefferminzsirup",
    "Schnaps",
    "Sirup",
  ],
  "Backwaren und Gebäck": [
    "Bauernbrot",
    "Brot",
    "Gebäck",
    "Kuchen und Süsses",
    "Meringue",
    "Zopf",
  ],
  "Blumen und Pflanzen": [
    "Blumen",
    "Dahlien",
    "Gladiolen",
    "Goldmelissen",
    "Hortensien",
    "Kresse",
    "Kräuter und Gewürze",
    "Lavendel",
    "Lilien",
    "Minze",
    "Narzissen",
    "Osterglocken",
    "Pfingstrosen",
    "Rosen",
    "Sonnenblumen",
    "Tannenzweige",
    "Tulpen",
  ],
  "Nüsse, Samen und Öle": [
    "Baumnüsse",
    "Haselnüsse",
    "Kastanien",
    "Leinöl",
    "Mandeln",
    "Nussöl",
    "Nüssler / Feldsalat",
    "Rapsöl",
    "Sonnenblumenöl",
    "Ölsamen",
  ],
  "Getreide und Cerealien": [
    "Dinkel",
    "Gerste",
    "Getreide",
    "Maismehl",
    "Mehl",
    "Müesli",
    "Polenta",
    "Roggen",
    "UrDinkel",
    "Weizen",
  ],
  "Fisch und Meeresfrüchte": ["Austernseitlinge", "Fisch", "Forelle"],
  Sonstiges: [
    "Brennholz",
    "Chemineeholz",
    "Finnenkerze",
    "Forstwaren",
    "Geschenkideen",
    "Gärmost",
    "Holzofenbrot",
    "Wachteleier",
    "Weihnachtsbäume",
    "Öl",
  ],
};

/** Parent category group for a value; returns the value itself if it is
 * already a group (or unknown), so existing group-level data still works. */
export function productGroupOf(value: string): string {
  return PRODUCTS[value]?.group ?? value;
}

/**
 * Stable public slug for a product, matching the backend's `products.slug`.
 * The backend derives it as `slugify(name_en)` with these exact rules
 * (NFKD → ASCII → non-alphanumeric runs to hyphens → lowercase); the frontend
 * catalog's English label is the same source string, so the two agree for
 * every catalog product (verified: 183/183). This is the identity that bridges
 * a catalog product to a farm's `products[]`.
 */
export function productSlug(key: string): string {
  const en = PRODUCTS[key]?.labels.en ?? key;
  return (
    en
      .normalize("NFKD")
      // Faithful port of the backend's `.encode("ascii", "ignore")`: after NFKD
      // the accents are separate combining marks, so dropping every non-ASCII
      // code point turns ä→a, é→e and removes anything undecomposable.
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "item"
  );
}

/** Reverse of {@link productSlug}: backend product slug → catalog German key. */
const PRODUCT_KEY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.keys(PRODUCTS).map((key) => [productSlug(key), key]),
);

/** Catalog German key for a backend product slug, or `undefined` if unknown. */
export function productKeyForSlug(slug: string): string | undefined {
  return PRODUCT_KEY_BY_SLUG[slug];
}

export function productLabel(key: string, locale: Locale): string {
  const meta = PRODUCTS[key];
  if (!meta) return key;
  return meta.labels[locale] ?? meta.labels.en ?? key;
}

/** Localized label for any tag — a product or a category group. */
export function tagLabel(value: string, locale: Locale): string {
  return PRODUCTS[value]
    ? productLabel(value, locale)
    : categoryLabel(value, locale);
}
