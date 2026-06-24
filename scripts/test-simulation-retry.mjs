#!/usr/bin/env node
/** Retry des 2 scenarios qui ont echoue */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = "C:\\Users\\lucas\\AppData\\Local\\Temp\\sim_test";
const OUT_DIR = resolve(__dirname, "../public/simulation-tests");
const API_URL = "https://coverswap.fr/api/simulation";

const TEST_IDENTITY = {
  name: "TEST AUTO 2026-04-25",
  phone: "+33000000001",
  email: "test-auto-sim@example.com",
};

const SCENARIOS = [
  {
    project_type: "mur-plafond",
    photo: "mur.jpg",
    label: "Mur + Lacquered White (retry)",
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
    label: "Bureau + Orangey Wenge bois (retry)",
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
  const buf = readFileSync(`${TMP_DIR}\\${filename}`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function buildPayload(scenario) {
  const payload = {
    ...TEST_IDENTITY,
    project_type: scenario.project_type,
    photo_base64: photoToBase64(scenario.photo),
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
      console.log(`    error: ${data.error || data.message}`);
      console.log(`    reason: ${data.reason || "-"}`);
      return { ok: false, elapsed, status: res.status };
    }

    if (!data.image) {
      console.log(`    [FAIL] Pas d'image`);
      return { ok: false, elapsed };
    }

    const b64 = data.image.replace(/^data:image\/\w+;base64,/, "");
    const outPath = `${OUT_DIR}/output_${scenario.project_type}.png`;
    writeFileSync(outPath, Buffer.from(b64, "base64"));

    console.log(`    [OK] ${elapsed}s -> ${outPath}`);
    return { ok: true, elapsed, output: outPath };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`    [FAIL] Exception apres ${elapsed}s: ${err.message}`);
    return { ok: false, elapsed, error: err.message };
  }
}

async function main() {
  for (let i = 0; i < SCENARIOS.length; i++) {
    await runScenario(SCENARIOS[i], i);
  }
}

main();
