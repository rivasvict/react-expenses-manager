// GENERATED from src/themes/catalog/*.json by `npm run tokens:build` — do not edit.

import tokens from "../styles/tokens.json";
import midnightGold from "./catalog/midnight-gold.json";
import allHallows from "./catalog/all-hallows.json";
import catppuccin from "./catalog/catppuccin.json";
import digitalRain from "./catalog/digital-rain.json";
import flexokiLight from "./catalog/flexoki-light.json";
import gruvbox from "./catalog/gruvbox.json";
import moonPrism from "./catalog/moon-prism.json";
import nord from "./catalog/nord.json";
import ocarina from "./catalog/ocarina.json";
import pumpkinKing from "./catalog/pumpkin-king.json";
import snowglobe from "./catalog/snowglobe.json";
import superSaiyan from "./catalog/super-saiyan.json";
import tokyoNight from "./catalog/tokyo-night.json";
import wisteria from "./catalog/wisteria.json";
import yuletide from "./catalog/yuletide.json";
import type { Theme } from "./theme.types";

export const DEFAULT_THEME_ID = "midnight-gold";

// The default theme first, then the others by id.
export const THEME_CATALOG = [
  {
    ...midnightGold,
    color: tokens.color,
    chart: tokens.chart,
    shadow: tokens.shadow,
  },
  allHallows,
  catppuccin,
  digitalRain,
  flexokiLight,
  gruvbox,
  moonPrism,
  nord,
  ocarina,
  pumpkinKing,
  snowglobe,
  superSaiyan,
  tokyoNight,
  wisteria,
  yuletide,
] as Theme[];
