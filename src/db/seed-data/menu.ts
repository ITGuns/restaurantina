/**
 * The complete RestauranTina menu, transcribed item for item from restaurantina-data.md §7.
 * Names, descriptions and prices are exactly as printed (Spanish, playful slang names).
 * English names/descriptions are left empty: the source flags translation as an open
 * question for the owner, who can add them under Admin → Menu.
 */
import { $, type SeedCategory } from "./types";

const guisados = "Con cualquiera de los siguientes guisados";

export const MENU: SeedCategory[] = [
  {
    name: "Desayunos",
    englishName: "Breakfast",
    slug: "desayunos",
    note: "Todos acompañados de frijoles con queso",
    englishNote: "All served with beans and cheese",
    items: [
      { name: "El Suculento", description: "Huevos revueltos con jamón", price: $(14.7) },
      { name: "El Mañanero", description: "Huevos revueltos con chorizo", price: $(14.7) },
      { name: "Mal Amansados", description: "Huevos rancheros en salsa", price: $(14.7) },
      { name: "El Maistro", description: "Huevos al albañil con mezcla de salsa roja", price: $(14.7) },
      { name: "Me Nortie", description: "Huevos a la mexicana con chile, tomate y cebolla", price: $(14.7) },
      { name: "Los Encabronados", description: "Huevos divorciados estrellados en salsa roja y verde", price: $(14.7) },
      { name: "El Encobijado", description: "Omelette con jamón y queso", price: $(14.7) },
      { name: "Pa' la Dieta", description: "Fruta con yogurt y granola", price: $(14.7) },
      { name: "Y las Queso", description: "Sincronizadas de jamón con queso", price: $(14.7) },
      { name: "Pa K Amarre", description: "Chilaquiles verdes o rojos con queso", price: $(14.7) },
      { name: "Los Ensillados", description: "Huevos estrellados montados con cualquier guisado del menú", price: $(18.9) },
      { name: "No Te Rajes", description: "Enchiladas verdes con queso", price: $(17.85) },
      { name: "Las Tóxicas", description: "Enchiladas rojas con queso", price: $(17.85) },
      { name: "El Panzón", description: "Bistec ranchero", price: $(17.85) },
      { name: "Los Esponjosos del Mal", description: "Hot cakes", price: $(8.4) },
    ],
  },
  {
    name: "Platillos",
    englishName: "Plates",
    slug: "platillos",
    note: "Servidos con arroz y frijoles",
    englishNote: "Served with rice and beans",
    items: [
      { name: "El Mitotero", description: "Carne de res en chile colorado", price: $(17.85) },
      { name: "La Milagrosa", description: "Milanesa de res", price: $(17.85), featured: true, popular: true },
      { name: "El Cochi", description: "Carne de puerco en salsa de chile verde", price: $(17.85) },
      { name: "El Argüendero", description: "Pollo en mole", price: $(17.85) },
      { name: "El Biscoqueto", description: "Bistec con papas", price: $(17.85) },
      { name: "Bien Mendigas", description: "Albóndigas en chipotle", price: $(17.85) },
      { name: "Nomás Mis Chicharrones Truenan", description: "Chicharrón en salsa verde", price: $(17.85) },
      { name: "El Chelimón (Filete a la Mantequilla)", description: "Filete de pescado a la mantequilla con arroz y ensalada", price: $(17.85) },
    ],
  },
  {
    name: "Comida",
    englishName: "Lunch",
    slug: "comida",
    items: [
      { name: "Pa Luego Es Tarde", description: "Comida corrida con guisado del día", price: $(16.8) },
      { name: "Ta Cañón", description: "Chile relleno de queso", price: $(17.85) },
      { name: "Las Flacuchas", description: "Flautas de carne de res", price: $(17.85) },
      { name: "No Te Rajes", description: "Enchiladas verdes con queso o pollo", price: $(17.85) },
      { name: "Las Tóxicas", description: "Enchiladas rojas con queso o pollo", price: $(17.85) },
      { name: "No Manches", description: "Enchiladas de chipotle", price: $(17.85), featured: true, popular: true },
      { name: "Los Conquistadores", description: "Tacos de pollo", price: $(16.8), priceNote: "Solos: $13.65" },
      { name: "Los Greñudos", description: "Tacos de deshebrada", price: $(16.8) },
      { name: "Los Pinchis", description: "3 tacos de picadillo", price: $(16.8) },
      { name: "Al Chingadazo", description: "Tacos de bistec", price: $(16.8) },
    ],
  },
  {
    name: "Burritos",
    slug: "burritos",
    note: guisados,
    englishNote: "With any of the following fillings",
    items: [
      { name: "Burrito Pólvora", description: "Frijoles con queso", price: $(5.25) },
      { name: "Burrito El Mitotero", description: "Res en chile colorado", price: $(5.25) },
      { name: "Burrito El Cochi", description: "Puerco en chile verde", price: $(5.25) },
      { name: "Burrito Ta Cañón", description: "Chile relleno", price: $(6.3), featured: true, popular: true },
      { name: "Burrito El Rufles", description: "Chicharrón prensado en salsa verde", price: $(6.3) },
      { name: "Burrito El Argüendero", description: "Mole", price: $(5.25) },
      { name: "Burrito Chiletina", description: "Carne molida con frijoles graneados y winnie en salsa roja", price: $(6.3) },
    ],
  },
  {
    name: "Chimichangas",
    slug: "chimichangas",
    note: guisados,
    englishNote: "With any of the following fillings",
    items: [
      { name: "Chimichanga Pólvora", description: "Frijoles con queso", price: $(5.25) },
      { name: "Chimichanga El Mitotero", description: "Res en chile colorado", price: $(5.25) },
      { name: "Chimichanga El Cochi", description: "Puerco en chile verde", price: $(5.25) },
      { name: "Chimichanga Ta Cañón", description: "Chile relleno", price: $(6.3) },
      { name: "Chimichanga El Rufles", description: "Chicharrón prensado en salsa verde", price: $(6.3) },
      { name: "Chimichanga El Argüendero", description: "Mole", price: $(5.25) },
      { name: "Chimichanga Chiletina", description: "Carne molida con frijoles graneados y winnie en salsa roja", price: $(6.3) },
    ],
  },
  {
    name: "Quesadillas",
    slug: "quesadillas",
    note: guisados,
    englishNote: "With any of the following fillings",
    items: [
      { name: "Quesadilla Pólvora", description: "Frijoles con queso", price: $(9.44) },
      { name: "Quesadilla El Mitotero", description: "Res en chile colorado", price: $(9.44) },
      { name: "Quesadilla El Cochi", description: "Puerco en chile verde", price: $(9.44) },
      { name: "Quesadilla Ta Cañón", description: "Chile relleno", price: $(9.44) },
      { name: "Quesadilla El Rufles", description: "Chicharrón prensado en salsa verde", price: $(9.44) },
      { name: "Quesadilla El Argüendero", description: "Mole", price: $(9.44) },
      { name: "Quesadilla Chiletina", description: "Carne molida con frijoles graneados y winnie en salsa roja", price: $(9.44) },
    ],
  },
  {
    name: "Pa' los Chamacos",
    englishName: "Kids",
    slug: "pa-los-chamacos",
    items: [
      { name: "Ahh Huevo", price: $(7.35) },
      { name: "Pulpitos", description: "Huevos con migas", price: $(7.35) },
      { name: "Y las Queso", description: "Quesadillas de harina y maíz", price: $(7.35) },
      { name: "El Orejón", description: "Mini burritos de frijoles", price: $(7.35) },
    ],
  },
  {
    name: "Extras",
    slug: "extras",
    items: [
      { name: "Tortillas de maíz (2)", price: $(1.05) },
      { name: "Tortillas de harina (1)", price: $(2.1) },
      { name: "Arroz", price: $(3.15) },
      { name: "Frijoles", price: $(3.15) },
      { name: "Salsa", price: $(3.15) },
      { name: "Totopos", price: $(3.15) },
      { name: "Papas fritas", price: $(3.15) },
      { name: "Pollo extra", price: $(4.2) },
      { name: "Queso", price: $(3.15) },
      { name: "Crema", price: $(3.15) },
      { name: "Aguacate", price: $(3.15) },
      { name: "Huevo extra (2)", price: $(4.2) },
      { name: "Chiles toreados (3)", price: $(3.15) },
      { name: "Chiletina", price: $(4.2) },
    ],
  },
  {
    name: "Bebidas",
    englishName: "Drinks",
    slug: "bebidas",
    items: [
      { name: "Sodas mexicanas", price: $(4.73) },
      { name: "Café", price: $(4.2) },
      { name: "Café de la olla", price: $(4.73), featured: true, popular: true },
      { name: "Chocolate caliente", price: $(4.73) },
      { name: "Agua del día", price: $(4.87) },
      { name: "Agua embotellada", price: $(3.68) },
    ],
  },
  {
    name: "Postres",
    englishName: "Desserts",
    slug: "postres",
    items: [
      { name: "El Delicioso", description: "Mostachón — pastel de galleta y nuez", price: $(7.35) },
      { name: "El Pecadito", description: "Mini pastel de tres leches — chocolate, vainilla o red velvet", price: $(7.35) },
    ],
  },
  {
    // Seen on Google / social posts, not on the online ordering menu (source §7).
    name: "Specials",
    slug: "specials",
    items: [
      { name: "Menudo", price: $(12.97), featured: true, popular: true },
      { name: "Pozole", price: $(11.55), featured: true, popular: true },
    ],
  },
];

export const MENU_ITEM_COUNT = MENU.reduce((n, c) => n + c.items.length, 0);
