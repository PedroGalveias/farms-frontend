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
  Ananas: {
    group: "Früchte",
    labels: {
      de: "Ananas",
      en: "Pineapple",
      fr: "Ananas",
      it: "Ananas",
      rm: "Ananas",
    },
  },
  Aprikosen: {
    group: "Früchte",
    labels: {
      de: "Aprikosen",
      en: "Apricots",
      fr: "Abricots",
      it: "Albicocche",
      rm: "Albicocs",
    },
  },
  Birnen: {
    group: "Früchte",
    labels: {
      de: "Birnen",
      en: "Pears",
      fr: "Poires",
      it: "Pere",
      rm: "Piras",
    },
  },
  Brombeeren: {
    group: "Früchte",
    labels: {
      de: "Brombeeren",
      en: "Blackberries",
      fr: "Mûres",
      it: "More",
      rm: "Amoras",
    },
  },
  Erdbeeren: {
    group: "Früchte",
    labels: {
      de: "Erdbeeren",
      en: "Strawberries",
      fr: "Fraises",
      it: "Fragole",
      rm: "Fraulas",
    },
  },
  Feigen: {
    group: "Früchte",
    labels: { de: "Feigen", en: "Figs", fr: "Figues", it: "Fichi", rm: "Figs" },
  },
  Grapefruits: {
    group: "Früchte",
    labels: {
      de: "Grapefruits",
      en: "Grapefruits",
      fr: "Pamplemousses",
      it: "Pompelmi",
      rm: "Pampelmus",
    },
  },
  Heidelbeeren: {
    group: "Früchte",
    labels: {
      de: "Heidelbeeren",
      en: "Blueberries",
      fr: "Myrtilles",
      it: "Mirtilli",
      rm: "Murtillas",
    },
  },
  Himbeeren: {
    group: "Früchte",
    labels: {
      de: "Himbeeren",
      en: "Raspberries",
      fr: "Framboises",
      it: "Lamponi",
      rm: "Lampuns",
    },
  },
  Johannisbeeren: {
    group: "Früchte",
    labels: {
      de: "Johannisbeeren",
      en: "Currants",
      fr: "Groseilles",
      it: "Ribes",
      rm: "Ribes",
    },
  },
  Kirschen: {
    group: "Früchte",
    labels: {
      de: "Kirschen",
      en: "Cherries",
      fr: "Cerises",
      it: "Ciliegie",
      rm: "Tschiraschas",
    },
  },
  Kiwis: {
    group: "Früchte",
    labels: { de: "Kiwis", en: "Kiwis", fr: "Kiwis", it: "Kiwi", rm: "Kiwis" },
  },
  Mirabellen: {
    group: "Früchte",
    labels: {
      de: "Mirabellen",
      en: "Mirabelle Plums",
      fr: "Mirabelles",
      it: "Mirabelle",
      rm: "Mirabellas",
    },
  },
  Orangen: {
    group: "Früchte",
    labels: {
      de: "Orangen",
      en: "Oranges",
      fr: "Oranges",
      it: "Arance",
      rm: "Aranschas",
    },
  },
  Pfirsiche: {
    group: "Früchte",
    labels: {
      de: "Pfirsiche",
      en: "Peaches",
      fr: "Pêches",
      it: "Pesche",
      rm: "Persics",
    },
  },
  Pflaumen: {
    group: "Früchte",
    labels: {
      de: "Pflaumen",
      en: "Plums",
      fr: "Prunes",
      it: "Prugne",
      rm: "Pruns",
    },
  },
  Quitten: {
    group: "Früchte",
    labels: {
      de: "Quitten",
      en: "Quinces",
      fr: "Coings",
      it: "Mele cotogne",
      rm: "Cudugns",
    },
  },
  Rhabarber: {
    group: "Früchte",
    labels: {
      de: "Rhabarber",
      en: "Rhubarb",
      fr: "Rhubarbe",
      it: "Rabarbaro",
      rm: "Rabarber",
    },
  },
  Stachelbeeren: {
    group: "Früchte",
    labels: {
      de: "Stachelbeeren",
      en: "Gooseberries",
      fr: "Groseilles à maquereau",
      it: "Uva spina",
      rm: "Üerflas",
    },
  },
  Steinobst: {
    group: "Früchte",
    labels: {
      de: "Steinobst",
      en: "Stone Fruits",
      fr: "Fruits à noyau",
      it: "Drupacee",
      rm: "Fritga cun ossa",
    },
  },
  Weintrauben: {
    group: "Früchte",
    labels: {
      de: "Weintrauben",
      en: "Grapes",
      fr: "Raisins",
      it: "Uva",
      rm: "Iva",
    },
  },
  Zwetschgen: {
    group: "Früchte",
    labels: {
      de: "Zwetschgen",
      en: "Damson Plums",
      fr: "Quetsches",
      it: "Susine",
      rm: "Pruns",
    },
  },
  Äpfel: {
    group: "Früchte",
    labels: {
      de: "Äpfel",
      en: "Apples",
      fr: "Pommes",
      it: "Mele",
      rm: "Mailas",
    },
  },
  Artischocken: {
    group: "Gemüse",
    labels: {
      de: "Artischocken",
      en: "Artichokes",
      fr: "Artichauts",
      it: "Carciofi",
      rm: "Artischocas",
    },
  },
  Auberginen: {
    group: "Gemüse",
    labels: {
      de: "Auberginen",
      en: "Eggplants",
      fr: "Aubergines",
      it: "Melanzane",
      rm: "Auberginas",
    },
  },
  Batavia: {
    group: "Gemüse",
    labels: {
      de: "Batavia",
      en: "Batavia Lettuce",
      fr: "Batavia",
      it: "Lattuga batavia",
      rm: "Salata batavia",
    },
  },
  Blumenkohl: {
    group: "Gemüse",
    labels: {
      de: "Blumenkohl",
      en: "Cauliflower",
      fr: "Chou-fleur",
      it: "Cavolfiore",
      rm: "Caulflur",
    },
  },
  Bohnen: {
    group: "Gemüse",
    labels: {
      de: "Bohnen",
      en: "Beans",
      fr: "Haricots",
      it: "Fagioli",
      rm: "Fasöls",
    },
  },
  Broccoli: {
    group: "Gemüse",
    labels: {
      de: "Broccoli",
      en: "Broccoli",
      fr: "Brocoli",
      it: "Broccoli",
      rm: "Broccoli",
    },
  },
  Chicorée: {
    group: "Gemüse",
    labels: {
      de: "Chicorée",
      en: "Chicory",
      fr: "Chicorée",
      it: "Cicoria",
      rm: "Tschicorea",
    },
  },
  Erbsen: {
    group: "Gemüse",
    labels: {
      de: "Erbsen",
      en: "Peas",
      fr: "Petits pois",
      it: "Piselli",
      rm: "Arbeischs",
    },
  },
  Federkohl: {
    group: "Gemüse",
    labels: {
      de: "Federkohl",
      en: "Kale",
      fr: "Chou frisé",
      it: "Cavolo riccio",
      rm: "Chaul ric",
    },
  },
  Fenchel: {
    group: "Gemüse",
    labels: {
      de: "Fenchel",
      en: "Fennel",
      fr: "Fenouil",
      it: "Finocchio",
      rm: "Fenitg",
    },
  },
  Frischgemuese: {
    group: "Gemüse",
    labels: {
      de: "Frischgemuese",
      en: "Fresh Vegetables",
      fr: "Légumes frais",
      it: "Verdura fresca",
      rm: "Verdura frestga",
    },
  },
  Fruchtgemüse: {
    group: "Gemüse",
    labels: {
      de: "Fruchtgemüse",
      en: "Fruit Vegetables",
      fr: "Légumes-fruits",
      it: "Ortaggi da frutto",
      rm: "Verdura da fritga",
    },
  },
  Gewürzgemüse: {
    group: "Gemüse",
    labels: {
      de: "Gewürzgemüse",
      en: "Spice Vegetables",
      fr: "Légumes aromatiques",
      it: "Ortaggi aromatici",
      rm: "Verdura spezzaria",
    },
  },
  Gurken: {
    group: "Gemüse",
    labels: {
      de: "Gurken",
      en: "Cucumbers",
      fr: "Concombres",
      it: "Cetrioli",
      rm: "Cucumers",
    },
  },
  Karotten: {
    group: "Gemüse",
    labels: {
      de: "Karotten",
      en: "Carrots",
      fr: "Carottes",
      it: "Carote",
      rm: "Carotas",
    },
  },
  Kartoffeln: {
    group: "Gemüse",
    labels: {
      de: "Kartoffeln",
      en: "Potatoes",
      fr: "Pommes de terre",
      it: "Patate",
      rm: "Tartuffels",
    },
  },
  Kohl: {
    group: "Gemüse",
    labels: {
      de: "Kohl",
      en: "Cabbage",
      fr: "Chou",
      it: "Cavolo",
      rm: "Chaul",
    },
  },
  Kohlrabi: {
    group: "Gemüse",
    labels: {
      de: "Kohlrabi",
      en: "Kohlrabi",
      fr: "Chou-rave",
      it: "Cavolo rapa",
      rm: "Chaulrava",
    },
  },
  Kopfsalat: {
    group: "Gemüse",
    labels: {
      de: "Kopfsalat",
      en: "Lettuce",
      fr: "Laitue",
      it: "Lattuga",
      rm: "Salata",
    },
  },
  Kürbis: {
    group: "Gemüse",
    labels: {
      de: "Kürbis",
      en: "Pumpkins",
      fr: "Courges",
      it: "Zucche",
      rm: "Cucurbitas",
    },
  },
  Lauch: {
    group: "Gemüse",
    labels: {
      de: "Lauch",
      en: "Leeks",
      fr: "Poireaux",
      it: "Porri",
      rm: "Puors",
    },
  },
  Mais: {
    group: "Gemüse",
    labels: { de: "Mais", en: "Corn", fr: "Maïs", it: "Mais", rm: "Mais" },
  },
  "Peperoni / Paprika": {
    group: "Gemüse",
    labels: {
      de: "Peperoni / Paprika",
      en: "Peppers",
      fr: "Poivrons",
      it: "Peperoni",
      rm: "Peperoni",
    },
  },
  Petersilie: {
    group: "Gemüse",
    labels: {
      de: "Petersilie",
      en: "Parsley",
      fr: "Persil",
      it: "Prezzemolo",
      rm: "Petersila",
    },
  },
  Radieschen: {
    group: "Gemüse",
    labels: {
      de: "Radieschen",
      en: "Radishes",
      fr: "Radis",
      it: "Ravanelli",
      rm: "Ravanellas",
    },
  },
  Randen: {
    group: "Gemüse",
    labels: {
      de: "Randen",
      en: "Beets",
      fr: "Betteraves",
      it: "Barbabietole",
      rm: "Randas",
    },
  },
  Rucola: {
    group: "Gemüse",
    labels: {
      de: "Rucola",
      en: "Arugula",
      fr: "Roquette",
      it: "Rucola",
      rm: "Rucola",
    },
  },
  Salate: {
    group: "Gemüse",
    labels: {
      de: "Salate",
      en: "Salads",
      fr: "Salades",
      it: "Insalate",
      rm: "Salatas",
    },
  },
  Sellerie: {
    group: "Gemüse",
    labels: {
      de: "Sellerie",
      en: "Celery",
      fr: "Céleri",
      it: "Sedano",
      rm: "Sleri",
    },
  },
  Spargel: {
    group: "Gemüse",
    labels: {
      de: "Spargel",
      en: "Asparagus",
      fr: "Asperges",
      it: "Asparagi",
      rm: "Spargels",
    },
  },
  Spinat: {
    group: "Gemüse",
    labels: {
      de: "Spinat",
      en: "Spinach",
      fr: "Épinards",
      it: "Spinaci",
      rm: "Spinat",
    },
  },
  Tomaten: {
    group: "Gemüse",
    labels: {
      de: "Tomaten",
      en: "Tomatoes",
      fr: "Tomates",
      it: "Pomodori",
      rm: "Tomatas",
    },
  },
  Zucchetti: {
    group: "Gemüse",
    labels: {
      de: "Zucchetti",
      en: "Zucchini",
      fr: "Courgettes",
      it: "Zucchine",
      rm: "Zucchini",
    },
  },
  Zwiebeln: {
    group: "Gemüse",
    labels: {
      de: "Zwiebeln",
      en: "Onions",
      fr: "Oignons",
      it: "Cipolle",
      rm: "Tschiollas",
    },
  },
  Alpkäse: {
    group: "Milchprodukte",
    labels: {
      de: "Alpkäse",
      en: "Alp Cheese",
      fr: "Fromage d'alpage",
      it: "Formaggio d'alpe",
      rm: "Chaschiel d'alp",
    },
  },
  Bergkäse: {
    group: "Milchprodukte",
    labels: {
      de: "Bergkäse",
      en: "Mountain Cheese",
      fr: "Fromage de montagne",
      it: "Formaggio di montagna",
      rm: "Chaschiel da muntogna",
    },
  },
  Brie: {
    group: "Milchprodukte",
    labels: { de: "Brie", en: "Brie", fr: "Brie", it: "Brie", rm: "Brie" },
  },
  Butter: {
    group: "Milchprodukte",
    labels: {
      de: "Butter",
      en: "Butter",
      fr: "Beurre",
      it: "Burro",
      rm: "Paintg",
    },
  },
  Fonduemischung: {
    group: "Milchprodukte",
    labels: {
      de: "Fonduemischung",
      en: "Fondue Mix",
      fr: "Mélange à fondue",
      it: "Misto per fonduta",
      rm: "Maschaida da fondue",
    },
  },
  Frischkäse: {
    group: "Milchprodukte",
    labels: {
      de: "Frischkäse",
      en: "Fresh Cheese",
      fr: "Fromage frais",
      it: "Formaggio fresco",
      rm: "Chaschiel fresc",
    },
  },
  Hobelkäse: {
    group: "Milchprodukte",
    labels: {
      de: "Hobelkäse",
      en: "Sliced Cheese",
      fr: "Fromage à rebibes",
      it: "Formaggio a scaglie",
      rm: "Chaschiel da rader",
    },
  },
  Joghurt: {
    group: "Milchprodukte",
    labels: {
      de: "Joghurt",
      en: "Yogurt",
      fr: "Yaourt",
      it: "Yogurt",
      rm: "Jogurt",
    },
  },
  Käse: {
    group: "Milchprodukte",
    labels: {
      de: "Käse",
      en: "Cheese",
      fr: "Fromage",
      it: "Formaggio",
      rm: "Chaschiel",
    },
  },
  Milch: {
    group: "Milchprodukte",
    labels: { de: "Milch", en: "Milk", fr: "Lait", it: "Latte", rm: "Latg" },
  },
  Milchprodukte: {
    group: "Milchprodukte",
    labels: {
      de: "Milchprodukte",
      en: "Dairy Products",
      fr: "Produits laitiers",
      it: "Latticini",
      rm: "Products da latg",
    },
  },
  Mutschli: {
    group: "Milchprodukte",
    labels: {
      de: "Mutschli",
      en: "Small Round Cheese",
      fr: "Petit fromage",
      it: "Formaggino",
      rm: "Mutschli",
    },
  },
  Quark: {
    group: "Milchprodukte",
    labels: {
      de: "Quark",
      en: "Curd Cheese",
      fr: "Séré",
      it: "Quark",
      rm: "Quark",
    },
  },
  Raclettekäse: {
    group: "Milchprodukte",
    labels: {
      de: "Raclettekäse",
      en: "Raclette Cheese",
      fr: "Fromage à raclette",
      it: "Formaggio per raclette",
      rm: "Chaschiel da raclette",
    },
  },
  Rahm: {
    group: "Milchprodukte",
    labels: { de: "Rahm", en: "Cream", fr: "Crème", it: "Panna", rm: "Roma" },
  },
  Sauerrahm: {
    group: "Milchprodukte",
    labels: {
      de: "Sauerrahm",
      en: "Sour Cream",
      fr: "Crème acidulée",
      it: "Panna acida",
      rm: "Roma aspreta",
    },
  },
  Schafskäse: {
    group: "Milchprodukte",
    labels: {
      de: "Schafskäse",
      en: "Sheep Cheese",
      fr: "Fromage de brebis",
      it: "Formaggio di pecora",
      rm: "Chaschiel da nursa",
    },
  },
  Ziegenkäse: {
    group: "Milchprodukte",
    labels: {
      de: "Ziegenkäse",
      en: "Goat Cheese",
      fr: "Fromage de chèvre",
      it: "Formaggio di capra",
      rm: "Chaschiel da chavra",
    },
  },
  Ziegenmilch: {
    group: "Milchprodukte",
    labels: {
      de: "Ziegenmilch",
      en: "Goat Milk",
      fr: "Lait de chèvre",
      it: "Latte di capra",
      rm: "Latg da chavra",
    },
  },
  "Angus-Beef": {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Angus-Beef",
      en: "Angus Beef",
      fr: "Bœuf Angus",
      it: "Manzo Angus",
      rm: "Charn d'Angus",
    },
  },
  Büffel: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Büffel",
      en: "Buffalo",
      fr: "Buffle",
      it: "Bufalo",
      rm: "Bufel",
    },
  },
  Charolais: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Charolais",
      en: "Charolais Beef",
      fr: "Bœuf Charolais",
      it: "Manzo Charolais",
      rm: "Charn Charolais",
    },
  },
  Dexter: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Dexter",
      en: "Dexter Beef",
      fr: "Bœuf Dexter",
      it: "Manzo Dexter",
      rm: "Charn Dexter",
    },
  },
  Engadinerschaf: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Engadinerschaf",
      en: "Engadine Sheep",
      fr: "Mouton de l'Engadine",
      it: "Pecora engadinese",
      rm: "Nursa engiadinaisa",
    },
  },
  "Galloway-Rind": {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Galloway-Rind",
      en: "Galloway Beef",
      fr: "Bœuf Galloway",
      it: "Manzo Galloway",
      rm: "Charn Galloway",
    },
  },
  Gans: {
    group: "Fleisch und Geflügel",
    labels: { de: "Gans", en: "Goose", fr: "Oie", it: "Oca", rm: "Auca" },
  },
  Gitzi: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Gitzi",
      en: "Kid Goat",
      fr: "Cabri",
      it: "Capretto",
      rm: "Uget",
    },
  },
  Hirsch: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Hirsch",
      en: "Venison",
      fr: "Cerf",
      it: "Cervo",
      rm: "Tschierv",
    },
  },
  Hochlandrind: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Hochlandrind",
      en: "Highland Cattle",
      fr: "Bœuf Highland",
      it: "Bovino Highland",
      rm: "Vatga da las otezzas",
    },
  },
  Jungrind: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Jungrind",
      en: "Young Beef",
      fr: "Jeune bœuf",
      it: "Vitellone",
      rm: "Manz giuven",
    },
  },
  Kalb: {
    group: "Fleisch und Geflügel",
    labels: { de: "Kalb", en: "Veal", fr: "Veau", it: "Vitello", rm: "Vadè" },
  },
  Kaninchen: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Kaninchen",
      en: "Rabbit",
      fr: "Lapin",
      it: "Coniglio",
      rm: "Cunigl",
    },
  },
  Lamm: {
    group: "Fleisch und Geflügel",
    labels: { de: "Lamm", en: "Lamb", fr: "Agneau", it: "Agnello", rm: "Agné" },
  },
  "Piemonteser Rind": {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Piemonteser Rind",
      en: "Piemontese Beef",
      fr: "Bœuf piémontais",
      it: "Manzo piemontese",
      rm: "Charn piemontaisa",
    },
  },
  Poulet: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Poulet",
      en: "Chicken",
      fr: "Poulet",
      it: "Pollo",
      rm: "Poulet",
    },
  },
  Rind: {
    group: "Fleisch und Geflügel",
    labels: { de: "Rind", en: "Beef", fr: "Bœuf", it: "Manzo", rm: "Bov" },
  },
  Schaf: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Schaf",
      en: "Sheep",
      fr: "Mouton",
      it: "Pecora",
      rm: "Nursa",
    },
  },
  Schwein: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Schwein",
      en: "Pork",
      fr: "Porc",
      it: "Maiale",
      rm: "Portg",
    },
  },
  Truthahn: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Truthahn",
      en: "Turkey",
      fr: "Dinde",
      it: "Tacchino",
      rm: "Dindi",
    },
  },
  Wild: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Wild",
      en: "Game",
      fr: "Gibier",
      it: "Selvaggina",
      rm: "Selvaschina",
    },
  },
  Wollschwein: {
    group: "Fleisch und Geflügel",
    labels: {
      de: "Wollschwein",
      en: "Mangalica Pig",
      fr: "Porc laineux",
      it: "Maiale lanuto",
      rm: "Portg da launa",
    },
  },
  Apfelessig: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Apfelessig",
      en: "Apple Cider Vinegar",
      fr: "Vinaigre de pomme",
      it: "Aceto di mele",
      rm: "Aschieu da maila",
    },
  },
  Birnensirup: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Birnensirup",
      en: "Pear Syrup",
      fr: "Sirop de poire",
      it: "Sciroppo di pere",
      rm: "Sirup da piras",
    },
  },
  Dörrbohnen: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Dörrbohnen",
      en: "Dried Beans",
      fr: "Haricots séchés",
      it: "Fagioli secchi",
      rm: "Fasöls setgads",
    },
  },
  Dörrfrüchte: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Dörrfrüchte",
      en: "Dried Fruits",
      fr: "Fruits séchés",
      it: "Frutta secca",
      rm: "Fritga setgada",
    },
  },
  Eingemachtes: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Eingemachtes",
      en: "Preserves",
      fr: "Conserves",
      it: "Conserve",
      rm: "Conservas",
    },
  },
  Konfitüren: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Konfitüren",
      en: "Jams",
      fr: "Confitures",
      it: "Marmellate",
      rm: "Confituras",
    },
  },
  Mostbröckli: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Mostbröckli",
      en: "Air-dried Beef",
      fr: "Mostbröckli",
      it: "Carne secca di manzo",
      rm: "Charn setgada da bov",
    },
  },
  Rauchwürste: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Rauchwürste",
      en: "Smoked Sausages",
      fr: "Saucisses fumées",
      it: "Salsicce affumicate",
      rm: "Salsizs fimads",
    },
  },
  Speck: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Speck",
      en: "Bacon",
      fr: "Lard",
      it: "Pancetta",
      rm: "Spec",
    },
  },
  Trockenfleisch: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Trockenfleisch",
      en: "Dried Meat",
      fr: "Viande séchée",
      it: "Carne secca",
      rm: "Charn setgada",
    },
  },
  Trockenwürste: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Trockenwürste",
      en: "Dried Sausages",
      fr: "Saucisses sèches",
      it: "Salsicce secche",
      rm: "Salsizs setgads",
    },
  },
  Wurst: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Wurst",
      en: "Sausage",
      fr: "Saucisse",
      it: "Salsiccia",
      rm: "Salsiz",
    },
  },
  Wurstwaren: {
    group: "Verarbeitete und haltbare Produkte",
    labels: {
      de: "Wurstwaren",
      en: "Processed Sausages",
      fr: "Charcuterie",
      it: "Salumi",
      rm: "Products da salsiz",
    },
  },
  Birnel: {
    group: "Honig und Süßstoffe",
    labels: {
      de: "Birnel",
      en: "Pear Honey",
      fr: "Concentré de poire",
      it: "Concentrato di pere",
      rm: "Mel da piras",
    },
  },
  Blütenhonig: {
    group: "Honig und Süßstoffe",
    labels: {
      de: "Blütenhonig",
      en: "Blossom Honey",
      fr: "Miel de fleurs",
      it: "Miele di fiori",
      rm: "Mel da flurs",
    },
  },
  Holundersirup: {
    group: "Honig und Süßstoffe",
    labels: {
      de: "Holundersirup",
      en: "Elderberry Syrup",
      fr: "Sirop de sureau",
      it: "Sciroppo di sambuco",
      rm: "Sirup da sömbic",
    },
  },
  Honig: {
    group: "Honig und Süßstoffe",
    labels: { de: "Honig", en: "Honey", fr: "Miel", it: "Miele", rm: "Mel" },
  },
  Waldhonig: {
    group: "Honig und Süßstoffe",
    labels: {
      de: "Waldhonig",
      en: "Forest Honey",
      fr: "Miel de forêt",
      it: "Miele di bosco",
      rm: "Mel da god",
    },
  },
  "Apfelsaft / Süssmost": {
    group: "Getränke",
    labels: {
      de: "Apfelsaft / Süssmost",
      en: "Apple Juice / Cider",
      fr: "Jus de pomme / Cidre doux",
      it: "Succo di mela / Sidro",
      rm: "Most da maila",
    },
  },
  Apfelwein: {
    group: "Getränke",
    labels: {
      de: "Apfelwein",
      en: "Apple Wine",
      fr: "Cidre",
      it: "Sidro",
      rm: "Vin da maila",
    },
  },
  Destillate: {
    group: "Getränke",
    labels: {
      de: "Destillate",
      en: "Distillates",
      fr: "Distillats",
      it: "Distillati",
      rm: "Distillats",
    },
  },
  Essig: {
    group: "Getränke",
    labels: {
      de: "Essig",
      en: "Vinegar",
      fr: "Vinaigre",
      it: "Aceto",
      rm: "Aschieu",
    },
  },
  "Glace / Eiscreme": {
    group: "Getränke",
    labels: {
      de: "Glace / Eiscreme",
      en: "Ice Cream",
      fr: "Glace",
      it: "Gelato",
      rm: "Glatscha",
    },
  },
  Holunderblütensirup: {
    group: "Getränke",
    labels: {
      de: "Holunderblütensirup",
      en: "Elderflower Syrup",
      fr: "Sirop de fleurs de sureau",
      it: "Sciroppo di fiori di sambuco",
      rm: "Sirup da flurs da sömbic",
    },
  },
  Liköre: {
    group: "Getränke",
    labels: {
      de: "Liköre",
      en: "Liqueurs",
      fr: "Liqueurs",
      it: "Liquori",
      rm: "Liqueurs",
    },
  },
  Melissensirup: {
    group: "Getränke",
    labels: {
      de: "Melissensirup",
      en: "Lemon Balm Syrup",
      fr: "Sirop de mélisse",
      it: "Sciroppo di melissa",
      rm: "Sirup da melissa",
    },
  },
  Pfefferminzsirup: {
    group: "Getränke",
    labels: {
      de: "Pfefferminzsirup",
      en: "Peppermint Syrup",
      fr: "Sirop de menthe poivrée",
      it: "Sciroppo di menta piperita",
      rm: "Sirup da menta",
    },
  },
  Schnaps: {
    group: "Getränke",
    labels: {
      de: "Schnaps",
      en: "Brandy",
      fr: "Eau-de-vie",
      it: "Grappa",
      rm: "Schnaps",
    },
  },
  Sirup: {
    group: "Getränke",
    labels: {
      de: "Sirup",
      en: "Syrup",
      fr: "Sirop",
      it: "Sciroppo",
      rm: "Sirup",
    },
  },
  Bauernbrot: {
    group: "Backwaren und Gebäck",
    labels: {
      de: "Bauernbrot",
      en: "Farmhouse Bread",
      fr: "Pain paysan",
      it: "Pane contadino",
      rm: "Paun pur",
    },
  },
  Brot: {
    group: "Backwaren und Gebäck",
    labels: { de: "Brot", en: "Bread", fr: "Pain", it: "Pane", rm: "Paun" },
  },
  Gebäck: {
    group: "Backwaren und Gebäck",
    labels: {
      de: "Gebäck",
      en: "Pastry",
      fr: "Pâtisserie",
      it: "Prodotti da forno",
      rm: "Pastizzaria",
    },
  },
  "Kuchen und Süsses": {
    group: "Backwaren und Gebäck",
    labels: {
      de: "Kuchen und Süsses",
      en: "Cakes and Sweets",
      fr: "Gâteaux et douceurs",
      it: "Torte e dolci",
      rm: "Tortas e dultscharias",
    },
  },
  Meringue: {
    group: "Backwaren und Gebäck",
    labels: {
      de: "Meringue",
      en: "Meringue",
      fr: "Meringue",
      it: "Meringa",
      rm: "Meringue",
    },
  },
  Zopf: {
    group: "Backwaren und Gebäck",
    labels: {
      de: "Zopf",
      en: "Plaited Bread",
      fr: "Tresse",
      it: "Treccia",
      rm: "Zopf",
    },
  },
  Blumen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Blumen",
      en: "Flowers",
      fr: "Fleurs",
      it: "Fiori",
      rm: "Flurs",
    },
  },
  Dahlien: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Dahlien",
      en: "Dahlias",
      fr: "Dahlias",
      it: "Dalie",
      rm: "Dahlias",
    },
  },
  Gladiolen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Gladiolen",
      en: "Gladioli",
      fr: "Glaïeuls",
      it: "Gladioli",
      rm: "Gladiolas",
    },
  },
  Goldmelissen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Goldmelissen",
      en: "Bee Balm",
      fr: "Monardes",
      it: "Monarde",
      rm: "Goldmelissas",
    },
  },
  Hortensien: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Hortensien",
      en: "Hydrangeas",
      fr: "Hortensias",
      it: "Ortensie",
      rm: "Hortensias",
    },
  },
  Kresse: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Kresse",
      en: "Cress",
      fr: "Cresson",
      it: "Crescione",
      rm: "Crescha",
    },
  },
  "Kräuter und Gewürze": {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Kräuter und Gewürze",
      en: "Herbs and Spices",
      fr: "Herbes et épices",
      it: "Erbe e spezie",
      rm: "Jarvas e spezias",
    },
  },
  Lavendel: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Lavendel",
      en: "Lavender",
      fr: "Lavande",
      it: "Lavanda",
      rm: "Lavendel",
    },
  },
  Lilien: {
    group: "Blumen und Pflanzen",
    labels: { de: "Lilien", en: "Lilies", fr: "Lis", it: "Gigli", rm: "Gigls" },
  },
  Minze: {
    group: "Blumen und Pflanzen",
    labels: { de: "Minze", en: "Mint", fr: "Menthe", it: "Menta", rm: "Menta" },
  },
  Narzissen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Narzissen",
      en: "Daffodils",
      fr: "Narcisses",
      it: "Narcisi",
      rm: "Narcissas",
    },
  },
  Osterglocken: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Osterglocken",
      en: "Easter Lilies",
      fr: "Jonquilles",
      it: "Narcisi trombone",
      rm: "Narcissas da Pasca",
    },
  },
  Pfingstrosen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Pfingstrosen",
      en: "Peonies",
      fr: "Pivoines",
      it: "Peonie",
      rm: "Peonias",
    },
  },
  Rosen: {
    group: "Blumen und Pflanzen",
    labels: { de: "Rosen", en: "Roses", fr: "Roses", it: "Rose", rm: "Rosas" },
  },
  Sonnenblumen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Sonnenblumen",
      en: "Sunflowers",
      fr: "Tournesols",
      it: "Girasoli",
      rm: "Flurs dal sulegl",
    },
  },
  Tannenzweige: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Tannenzweige",
      en: "Fir Branches",
      fr: "Branches de sapin",
      it: "Rami di abete",
      rm: "Roms da pign",
    },
  },
  Tulpen: {
    group: "Blumen und Pflanzen",
    labels: {
      de: "Tulpen",
      en: "Tulips",
      fr: "Tulipes",
      it: "Tulipani",
      rm: "Tulipanas",
    },
  },
  Baumnüsse: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Baumnüsse",
      en: "Walnuts",
      fr: "Noix",
      it: "Noci",
      rm: "Nuschs",
    },
  },
  Haselnüsse: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Haselnüsse",
      en: "Hazelnuts",
      fr: "Noisettes",
      it: "Nocciole",
      rm: "Nuschillas",
    },
  },
  Kastanien: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Kastanien",
      en: "Chestnuts",
      fr: "Châtaignes",
      it: "Castagne",
      rm: "Chastognas",
    },
  },
  Leinöl: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Leinöl",
      en: "Linseed Oil",
      fr: "Huile de lin",
      it: "Olio di lino",
      rm: "Ieli da glin",
    },
  },
  Mandeln: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Mandeln",
      en: "Almonds",
      fr: "Amandes",
      it: "Mandorle",
      rm: "Mandels",
    },
  },
  Nussöl: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Nussöl",
      en: "Nut Oil",
      fr: "Huile de noix",
      it: "Olio di noci",
      rm: "Ieli da nuschs",
    },
  },
  "Nüssler / Feldsalat": {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Nüssler / Feldsalat",
      en: "Lamb's Lettuce",
      fr: "Mâche",
      it: "Songino",
      rm: "Salata da nuschs",
    },
  },
  Rapsöl: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Rapsöl",
      en: "Rapeseed Oil",
      fr: "Huile de colza",
      it: "Olio di colza",
      rm: "Ieli da raps",
    },
  },
  Sonnenblumenöl: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Sonnenblumenöl",
      en: "Sunflower Oil",
      fr: "Huile de tournesol",
      it: "Olio di girasole",
      rm: "Ieli da flurs dal sulegl",
    },
  },
  Ölsamen: {
    group: "Nüsse, Samen und Öle",
    labels: {
      de: "Ölsamen",
      en: "Oilseeds",
      fr: "Oléagineux",
      it: "Semi oleosi",
      rm: "Sems da ieli",
    },
  },
  Dinkel: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Dinkel",
      en: "Spelt",
      fr: "Épeautre",
      it: "Farro",
      rm: "Spelta",
    },
  },
  Gerste: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Gerste",
      en: "Barley",
      fr: "Orge",
      it: "Orzo",
      rm: "Iarschan",
    },
  },
  Getreide: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Getreide",
      en: "Grains",
      fr: "Céréales",
      it: "Cereali",
      rm: "Graun",
    },
  },
  Maismehl: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Maismehl",
      en: "Cornmeal",
      fr: "Farine de maïs",
      it: "Farina di mais",
      rm: "Farina da mais",
    },
  },
  Mehl: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Mehl",
      en: "Flour",
      fr: "Farine",
      it: "Farina",
      rm: "Farina",
    },
  },
  Müesli: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Müesli",
      en: "Muesli",
      fr: "Müesli",
      it: "Muesli",
      rm: "Müesli",
    },
  },
  Polenta: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Polenta",
      en: "Polenta",
      fr: "Polenta",
      it: "Polenta",
      rm: "Polenta",
    },
  },
  Roggen: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Roggen",
      en: "Rye",
      fr: "Seigle",
      it: "Segale",
      rm: "Sejel",
    },
  },
  UrDinkel: {
    group: "Getreide und Cerealien",
    labels: {
      de: "UrDinkel",
      en: "Ancient Spelt",
      fr: "Épeautre ancien",
      it: "Farro antico",
      rm: "Spelta antica",
    },
  },
  Weizen: {
    group: "Getreide und Cerealien",
    labels: {
      de: "Weizen",
      en: "Wheat",
      fr: "Blé",
      it: "Frumento",
      rm: "Furment",
    },
  },
  Austernseitlinge: {
    group: "Fisch und Meeresfrüchte",
    labels: {
      de: "Austernseitlinge",
      en: "Oyster Mushrooms",
      fr: "Pleurotes",
      it: "Funghi cardoncelli",
      rm: "Pleurots",
    },
  },
  Fisch: {
    group: "Fisch und Meeresfrüchte",
    labels: {
      de: "Fisch",
      en: "Fish",
      fr: "Poisson",
      it: "Pesce",
      rm: "Pesch",
    },
  },
  Forelle: {
    group: "Fisch und Meeresfrüchte",
    labels: {
      de: "Forelle",
      en: "Trout",
      fr: "Truite",
      it: "Trota",
      rm: "Tritga",
    },
  },
  Brennholz: {
    group: "Sonstiges",
    labels: {
      de: "Brennholz",
      en: "Fuelwood",
      fr: "Bois de chauffage",
      it: "Legna da ardere",
      rm: "Lain da fieu",
    },
  },
  Chemineeholz: {
    group: "Sonstiges",
    labels: {
      de: "Chemineeholz",
      en: "Firewood",
      fr: "Bois de cheminée",
      it: "Legna da camino",
      rm: "Lain da chemin",
    },
  },
  Finnenkerze: {
    group: "Sonstiges",
    labels: {
      de: "Finnenkerze",
      en: "Finn Candle",
      fr: "Bougie finlandaise",
      it: "Candela finlandese",
      rm: "Chandaila finlandaisa",
    },
  },
  Forstwaren: {
    group: "Sonstiges",
    labels: {
      de: "Forstwaren",
      en: "Forest Products",
      fr: "Produits forestiers",
      it: "Prodotti forestali",
      rm: "Products forestals",
    },
  },
  Geschenkideen: {
    group: "Sonstiges",
    labels: {
      de: "Geschenkideen",
      en: "Gift Ideas",
      fr: "Idées cadeaux",
      it: "Idee regalo",
      rm: "Ideas da regal",
    },
  },
  Gärmost: {
    group: "Sonstiges",
    labels: {
      de: "Gärmost",
      en: "Fermented Apple Juice",
      fr: "Moût fermenté",
      it: "Mosto fermentato",
      rm: "Most fermentà",
    },
  },
  Holzofenbrot: {
    group: "Sonstiges",
    labels: {
      de: "Holzofenbrot",
      en: "Wood-fired Bread",
      fr: "Pain au feu de bois",
      it: "Pane cotto a legna",
      rm: "Paun da furn a lain",
    },
  },
  Wachteleier: {
    group: "Sonstiges",
    labels: {
      de: "Wachteleier",
      en: "Quail Eggs",
      fr: "Œufs de caille",
      it: "Uova di quaglia",
      rm: "Ovs da qualia",
    },
  },
  Weihnachtsbäume: {
    group: "Sonstiges",
    labels: {
      de: "Weihnachtsbäume",
      en: "Christmas Trees",
      fr: "Sapins de Noël",
      it: "Alberi di Natale",
      rm: "Pigns da Nadal",
    },
  },
  Öl: {
    group: "Sonstiges",
    labels: { de: "Öl", en: "Oil", fr: "Huile", it: "Olio", rm: "Ieli" },
  },
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
