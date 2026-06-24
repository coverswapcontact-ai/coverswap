#!/usr/bin/env node
/**
 * Test E2E du simulateur — 5 projets × couleur unie ou bois
 * Lance 5 simulations en série pour respecter le rate limit.
 *
 * Usage: node scripts/test-simulation.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = process.env.TMP_DIR || "C:\\Users\\lucas\\AppData\\Local\\Temp\\sim_test";
const OUT_DIR = resolve(__dirname, "../public/simulation-tests");
mkdirSync(OUT_DIR, { recursive: true });

const API_URL = process.env.SIM_API_URL || "https://coverswap.fr/api/simulation";

// Identité partagée pour dedup CRM (évite de polluer avec 5 leads)
const TEST_IDENTITY = {
  name: "TEST AUTO 2026-04-25",
  phone: "+33000000001",
  email: "test-auto-sim@example.com",
};

// 5 scénarios — un par projet, focus sur fidélité couleur
const SCENARIOS = [
  {
    project_type: "cuisine",
    photo: "cuisine.jpg",
    label: "Cuisine + Lacquered Black faรงades",
    zones: {
      zone3: {
        ref: "J5",
        name: "Lacquered Black",
        famille: "couleur",
        finition: "Soft",
        categorie: "Color",
        tags: ["couleur", "noir"],
        image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/j5_47a739f4e4.jpg",
        label: "Faรงades",
      },
    },
  },
  {
    project_type: "salle-de-bain",
    photo: "sdb.jpg",
    label: "SDB + Ultra White carrelage",
    zones: {
      zone2: {
        ref: "J3",
        name: "Ultra White",
        famille: "couleur",
        finition: "Soft",
        categorie: "Color",
        tags: ["couleur", "blanc"],
        image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/j3_8180ab9384.jpg",
        label: "Carrelage mural",
      },
    },
  },
  {
    project_type: "meubles",
    photo: "meubles.jpg",
    label: "Dressing + Black Mat faรงades",
    zones: {
      zone1: {
        ref: "K1",
        name: "Black Mat",
        famille: "couleur",
        finition: "Soft",
        categorie: "Color",
        tags: ["couleur", "noir", "mat"],
        image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/k1_6dc839de4a.jpg",
        label: "Faรงades / Portes",
      },
    },
  },
  {
    project_type: "mur-plafond",
    photo: "mur.jpg",
    label: "Mur + Lacquered White",
    zones: {
      zone1: {
        ref: "J4",
        name: "Lacquered White",
        famille: "couleur",
        finition: "Soft",
        categorie: "Color",
        tags: ["couleur", "blanc"],
        image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/j4_c5ad05fbc9.jpg",
        label: "Mur principal",
      },
    },
  },
  {
    project_type: "professionnel",
    photo: "pro.jpg",
    label: "Bureau + Orangey Wenge bois",
    zones: {
      zone1: {
        ref: "A4",
        name: "Orangey Wenge",
        famille: "bois",
        finition: "Soft",
        categorie: "Dark",
        tags: ["wenge", "fonce"],
        image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/a4_ae69ca9971.jpg",
        label: "Bureau",
      },
    },
  },
];

function photoToBase64(filename) {
  const buf = readFileSync(`${TMP_DIR}/${filename}`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function buildPayload(scenario) {
  const payload = {
    ...TEST_IDENTITY,
    project_type: scenario.project_type,
    photo_base64: photoToBase64(scenario.photo),
    message: `Test automatique simulateur ${scenario.project_type}`,
  };
  for (const [zone, data] of Object.entries(scenario.zones)) {
    payload[`${zone}_ref`] = data.ref;
    payload[`${zone}_name`] = data.name;
    payload[`${zone}_famille`] = data.famille;
    payload[`${zone}_finition`] = data.finition;
    payload[`${zone}_categorie`] = data.categorie;
    payload[`${zone}_tags`] = data.tags;
    payload[`${zone}_image`] = data.image;
    payload[`${zone}_label`] = data.label;
  }
  return payload;
}

async function runScenario(scenario, idx) {
  const start = Date.now();
  console.log(`\n[${idx + 1}/${SCENARIOS.length}] ${scenario.label}`);
  console.log(`    photo: ${scenario.photo}, project: ${scenario.project_type}`);

  const payload = buildPayload(scenario);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await res.json();

    if (!res.ok) {
      console.log(`    [FAIL] HTTP ${res.status} apres ${elapsed}s`);
      console.log(`    error: ${data.error || data.message || "unknown"}`);
      console.log(`    reason: ${data.reason || "-"}`);
      return { ok: false, elapsed, status: res.status, error: data.error };
    }

    if (!data.image) {
      console.log(`    [FAIL] Pas d'image dans la reponse apres ${elapsed}s`);
      return { ok: false, elapsed, status: res.status };
    }

    // Sauvegarde le PNG
    const b64 = data.image.replace(/^data:image\/\w+;base64,/, "");
    const outPath = `${OUT_DIR}/output_${scenario.project_type}.png`;
    writeFileSync(outPath, Buffer.from(b64, "base64"));

    console.log(`    [OK] ${elapsed}s -> ${outPath}`);
    return { ok: true, elapsed, status: res.status, output: outPath };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`    [FAIL] Exception apres ${elapsed}s: ${err.message}`);
    return { ok: false, elapsed, error: err.message };
  }
}

async function main() {
  console.log(`Test E2E simulateur CoverSwap`);
  console.log(`API: ${API_URL}`);
  console.log(`Photos: ${TMP_DIR}`);
  console.log(`Outputs: ${OUT_DIR}`);
  console.log(`Identity: ${TEST_IDENTITY.email}`);

  const results = [];
  for (let i = 0; i < SCENARIOS.length; i++) {
    const r = await runScenario(SCENARIOS[i], i);
    results.push({ ...r, scenario: SCENARIOS[i].label });
  }

  console.log(`\n=== RESUME ===`);
  for (const r of results) {
    const status = r.ok ? "OK  " : "FAIL";
    console.log(`[${status}] ${r.scenario.padEnd(40)} ${r.elapsed}s`);
  }
  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n${okCount}/${SCENARIOS.length} simulations reussies`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
