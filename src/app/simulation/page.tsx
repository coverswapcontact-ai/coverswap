"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import revetements from "@/data/revetements.json";
import { track } from "@/lib/analytics";
import { PROJECT_TYPES, getProject, createEmptyElements, type ProjectType } from "./projects";

/* ══════════════════════════════════════════════════════════════════
   DOWNLOAD — Génère une image brandée CoverSwap (avant/après + refs)
══════════════════════════════════════════════════════════════════ */
async function downloadSimulation(
  beforeSrc: string,
  afterSrc: string,
  elements: Record<string, ElementSelection>,
  userName: string,
  projectElements: { key: string; label: string; description: string }[] = [],
) {
  const W = 1200;
  const H = 1100;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  /* ── helpers ── */
  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawImageCover = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  try {
    /* ── fond ── */
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, H);

    /* ── barre rouge en haut ── */
    ctx.fillStyle = "#CC0000";
    ctx.fillRect(0, 0, W, 6);

    /* ── logo texte ── */
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.fillText("CoverSwap", 60, 70);
    ctx.fillStyle = "#CC0000";
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.fillText("Swap", 60 + ctx.measureText("Cover").width, 70);

    ctx.fillStyle = "#888888";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("RÉNOVATION ADHÉSIVE PREMIUM", 60, 92);

    /* ── date + nom ── */
    ctx.fillStyle = "#666666";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    ctx.textAlign = "right";
    ctx.fillText(dateStr, W - 60, 60);
    if (userName) {
      ctx.fillStyle = "#AAAAAA";
      ctx.font = "16px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Projet de ${userName}`, W - 60, 84);
    }
    ctx.textAlign = "left";

    /* ── titre ── */
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("Votre simulation Coverswap", 60, 150);

    /* ── ligne séparatrice ── */
    ctx.fillStyle = "#CC0000";
    ctx.fillRect(60, 168, 80, 3);

    /* ── images avant / après ── */
    const imgPadding = 60;
    const imgW = (W - imgPadding * 2 - 20) / 2; // 2 images côte à côte
    const imgH = 420;
    const imgY = 200;

    const [beforeImg, afterImg] = await Promise.all([loadImg(beforeSrc), loadImg(afterSrc)]);

    // Before
    ctx.save();
    roundRect(imgPadding, imgY, imgW, imgH, 16);
    ctx.clip();
    drawImageCover(beforeImg, imgPadding, imgY, imgW, imgH);
    ctx.restore();

    // After
    ctx.save();
    roundRect(imgPadding + imgW + 20, imgY, imgW, imgH, 16);
    ctx.clip();
    drawImageCover(afterImg, imgPadding + imgW + 20, imgY, imgW, imgH);
    ctx.restore();

    // Labels
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    roundRect(imgPadding + 12, imgY + 12, 72, 30, 15);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("AVANT", imgPadding + 24, imgY + 32);

    ctx.fillStyle = "#CC0000";
    roundRect(imgPadding + imgW + 32, imgY + 12, 72, 30, 15);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("APRÈS", imgPadding + imgW + 44, imgY + 32);

    /* ── références sélectionnées ── */
    const refY = imgY + imgH + 50;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.fillText("Références sélectionnées", 60, refY);

    ctx.fillStyle = "#CC0000";
    ctx.fillRect(60, refY + 12, 60, 3);

    const selectedEls = projectElements.filter((el) => elements[el.key]?.enabled && elements[el.key]?.ref);
    let cardX = 60;
    const cardY = refY + 40;
    const cardW = (W - 120 - (selectedEls.length - 1) * 16) / Math.max(selectedEls.length, 1);
    const cardH = 200;

    for (let i = 0; i < selectedEls.length; i++) {
      const el = selectedEls[i];
      const s = elements[el.key];
      const x = cardX + i * (cardW + 16);

      // Card background
      ctx.fillStyle = "#262626";
      roundRect(x, cardY, cardW, cardH, 12);
      ctx.fill();

      // Texture thumbnail
      try {
        const texImg = await loadImg(s.image);
        ctx.save();
        roundRect(x + 12, cardY + 12, cardW - 24, 100, 8);
        ctx.clip();
        drawImageCover(texImg, x + 12, cardY + 12, cardW - 24, 100);
        ctx.restore();
      } catch {
        ctx.fillStyle = "#333333";
        roundRect(x + 12, cardY + 12, cardW - 24, 100, 8);
        ctx.fill();
      }

      // Element label
      ctx.fillStyle = "#CC0000";
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.fillText(el.label.toUpperCase(), x + 12, cardY + 134);

      // Reference name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
      const name = s.name.length > 22 ? s.name.slice(0, 20) + "…" : s.name;
      ctx.fillText(name, x + 12, cardY + 156);

      // Reference ID
      ctx.fillStyle = "#888888";
      ctx.font = "13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Réf. ${s.ref}`, x + 12, cardY + 176);

      // Finition
      ctx.fillStyle = "#666666";
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      ctx.fillText(s.finition || s.famille, x + 12, cardY + 194);
    }

    /* ── footer ── */
    const footerY = H - 120;
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, footerY, W, 120);

    ctx.fillStyle = "#CC0000";
    ctx.fillRect(0, footerY, W, 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.fillText("CoverSwap", 60, footerY + 35);

    ctx.fillStyle = "#888888";
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillText("coverswap.fr  ·  06 70 35 28 69  ·  contact@coverswap.fr", 60, footerY + 58);
    ctx.fillText("73 rue Simone Veil, 34470 Pérols  ·  Lun-Ven 8h-17h", 60, footerY + 78);

    ctx.fillStyle = "#444444";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Simulation générée par IA — rendu indicatif, non contractuel", W - 60, footerY + 100);
    ctx.textAlign = "left";

    /* ── téléchargement ── */
    const link = document.createElement("a");
    link.download = `CoverSwap_Simulation_${dateStr.replace(/ /g, "_")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();

    track("simulation_downloaded", { refs: selectedEls.map((el) => elements[el.key].ref).join(",") });
  } catch (err) {
    console.error("Download failed:", err);
    alert("Impossible de générer le document. Veuillez réessayer.");
  }
}

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Reference {
  id: string;
  nom: string;
  famille: string;
  categorie: string;
  finition: string;
  image: string;
  tags: string[];
}

interface ElementSelection {
  enabled: boolean;
  ref: string;
  name: string;
  famille: string;
  finition: string;
  categorie: string;
  tags: string[];
  image: string;
}

// Clés génériques : zone1, zone2, zone3 — mappées dynamiquement par le projet choisi
type ZoneKey = string;

/* ══════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════ */
const FAMILLES = [
  { id: "bois", label: "Bois" },
  { id: "pierre", label: "Pierre" },
  { id: "couleur", label: "Couleur" },
  { id: "beton", label: "Béton" },
  { id: "metal", label: "Métal" },
  { id: "textile", label: "Textile" },
  { id: "paillettes", label: "Paillettes" },
];

const FAMILLE_COLORS: Record<string, string> = {
  bois: "bg-amber-700/80",
  couleur: "bg-rose-600/80",
  pierre: "bg-stone-500/80",
  beton: "bg-zinc-500/80",
  metal: "bg-slate-500/80",
  textile: "bg-purple-600/80",
  paillettes: "bg-yellow-500/80",
};

// ELEMENTS est maintenant dynamique : voir `currentProject.elements`

const ITEMS_PER_PAGE = 6;

/* ══════════════════════════════════════════════════════════════════
   REFERENCE PICKER SUB-COMPONENT
   Pagination légère (6 items/page) pour ne pas surcharger l'utilisateur
══════════════════════════════════════════════════════════════════ */
function ReferencePicker({
  selected,
  onSelect,
}: {
  selected: { ref: string; name: string; famille: string; image: string };
  onSelect: (ref: Reference) => void;
}) {
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (revetements as Reference[]).filter((r) => {
      if (familleFilter && r.famille !== familleFilter) return false;
      if (q) {
        const haystack = `${r.nom} ${r.id} ${r.famille} ${r.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, familleFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, familleFilter]);

  const handleFamilleClick = useCallback((id: string) => {
    setFamilleFilter((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="mt-3 space-y-3">
      {/* Search + Family row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 focus:ring-1 focus:ring-rouge/30 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FAMILLES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFamilleClick(f.id)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                familleFilter === f.id
                  ? "bg-rouge text-white"
                  : "bg-white/5 text-gris-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid — 6 items max */}
      {pageItems.length === 0 ? (
        <p className="text-sm text-gris-500 py-4 text-center">Aucun résultat</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {pageItems.map((ref) => {
            const isSelected = selected.ref === ref.id;
            return (
              <button
                key={ref.id}
                type="button"
                onClick={() => onSelect(ref)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] active:scale-95 ${
                  isSelected ? "border-rouge shadow-lg shadow-rouge/25 ring-1 ring-rouge/40" : "border-transparent hover:border-white/20"
                }`}
              >
                <div className="relative w-full aspect-square bg-gris-800">
                  <div className="absolute inset-0 bg-gris-700 animate-pulse" />
                  <Image
                    src={ref.image}
                    alt={ref.nom}
                    fill
                    sizes="(max-width: 640px) 45vw, 80px"
                    loading="lazy"
                    className="object-cover relative z-10"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-rouge/30 flex items-center justify-center">
                      <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-1.5 bg-white/5">
                  <p className="text-xs text-white truncate leading-tight">{ref.nom}</p>
                  <p className="text-[10px] text-gris-500 truncate">{ref.id} · {FAMILLES.find((f) => f.id === ref.famille)?.label || ref.famille}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm text-gris-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>
          <span className="text-xs text-gris-500">
            {page + 1} / {totalPages} <span className="text-gris-600">({filtered.length} textures)</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-sm text-gris-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function SimulationPage() {
  const [step, setStep] = useState(1);

  // Step 1: choix du type de projet
  const [projectId, setProjectId] = useState<string | null>(null);
  const currentProject: ProjectType = projectId ? getProject(projectId) : PROJECT_TYPES[0];

  // Scroll en haut à chaque changement d'étape
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [step]);

  // Step 2: Photo
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3: Element selections (dynamique par projet)
  const [elements, setElements] = useState<Record<string, ElementSelection>>(() =>
    createEmptyElements(PROJECT_TYPES[0])
  );

  // Reset elements quand le projet change
  useEffect(() => {
    if (projectId) {
      setElements(createEmptyElements(getProject(projectId)));
    }
  }, [projectId]);

  // Step 3: Contact
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [honeypot, setHoneypot] = useState("");

  // Step 4: Result
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [devisSent, setDevisSent] = useState(false);
  const [devisSending, setDevisSending] = useState(false);

  // Quota journalier de simulations
  const [quota, setQuota] = useState<{ limit: number; remaining: number; resetAt: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/simulation/quota", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && typeof data.remaining === "number") {
          setQuota({ limit: data.limit, remaining: data.remaining, resetAt: data.resetAt });
        }
      })
      .catch(() => {});

    // Reprise depuis le dropzone home : si une photo a été uploadée
    // sur la home page, on la pré-charge et on saute directement à l'étape 2.
    try {
      const pending = sessionStorage.getItem("coverswap_pending_photo");
      if (pending) {
        setPreview(pending);
        setProjectId("cuisine");
        setStep(3); // saute à l'étape revêtements directement
        sessionStorage.removeItem("coverswap_pending_photo");
      }
    } catch {
      /* sessionStorage indisponible — on reste à l'étape 1 */
    }

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Downscale client-side : évite les payloads énormes (sécurise le pipe)
     Cible: max 1600px côté long, JPEG q=0.85 → ~300–500 KB par photo,
     bien en-dessous de toutes les limites de body size Next/Vercel/Railway. */
  const downscaleImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read-failed"));
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new window.Image();
        img.onerror = () => reject(new Error("decode-failed"));
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const ratio = Math.min(MAX / width, MAX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(dataUrl); // fallback
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const jpg = canvas.toDataURL("image/jpeg", 0.85);
            // Si le JPEG est plus gros que l'original (rare, petites images), garde l'original
            resolve(jpg.length < dataUrl.length ? jpg : dataUrl);
          } catch {
            resolve(dataUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  /* ── Handlers ── */
  // Lit le fichier original en dataURL (sans downscale)
  const readOriginal = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read-failed"));
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 10 Mo.");
      return;
    }
    try {
      const [dataUrl, original] = await Promise.all([
        downscaleImage(file),
        readOriginal(file),
      ]);
      setPreview(dataUrl);
      setOriginalPhoto(original);
      track("simulation_photo_uploaded", { source: "page", size_kb: Math.round(file.size / 1024) });
    } catch {
      setError("Impossible de lire cette image. Essayez une autre photo.");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 10 Mo.");
      return;
    }
    try {
      const [dataUrl, original] = await Promise.all([
        downscaleImage(file),
        readOriginal(file),
      ]);
      setPreview(dataUrl);
      setOriginalPhoto(original);
      track("simulation_photo_uploaded", { source: "page_drop", size_kb: Math.round(file.size / 1024) });
    } catch {
      setError("Impossible de lire cette image. Essayez une autre photo.");
    }
  };

  const toggleElement = (key: ZoneKey) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const selectReference = (key: ZoneKey, ref: Reference) => {
    setElements((prev) => ({
      ...prev,
      [key]: { ...prev[key], ref: ref.id, name: ref.nom, famille: ref.famille, finition: ref.finition, categorie: ref.categorie, tags: ref.tags, image: ref.image },
    }));
  };

  const hasAnySelection = Object.values(elements).some((el) => el.enabled && el.ref);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setStep(5);

    // Construit le payload avec les zones génériques zone1/zone2/zone3
    const payload: Record<string, unknown> = {
      photo_base64: preview,
      photo_base64_original: originalPhoto,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      message: formData.message,
      project_type: currentProject.id,
      website: honeypot,
    };
    // Ajoute dynamiquement zone1_*, zone2_*, zone3_*
    for (const el of currentProject.elements) {
      const sel = elements[el.key];
      const enabled = sel?.enabled;
      payload[`${el.key}_ref`] = enabled ? sel.ref : "";
      payload[`${el.key}_name`] = enabled ? sel.name : "";
      payload[`${el.key}_label`] = el.label;
      payload[`${el.key}_famille`] = enabled ? sel.famille : "";
      payload[`${el.key}_finition`] = enabled ? sel.finition : "";
      payload[`${el.key}_categorie`] = enabled ? sel.categorie : "";
      payload[`${el.key}_tags`] = enabled ? sel.tags : [];
      payload[`${el.key}_image`] = enabled ? sel.image : "";
    }

    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Mise à jour du compteur de quota depuis la réponse
      if (data?.rateLimit) {
        setQuota({ limit: data.rateLimit.limit, remaining: data.rateLimit.remaining, resetAt: data.rateLimit.resetAt });
      } else {
        const limitHeader = res.headers.get("X-RateLimit-Limit");
        const remainingHeader = res.headers.get("X-RateLimit-Remaining");
        const resetHeader = res.headers.get("X-RateLimit-Reset");
        if (limitHeader && remainingHeader && resetHeader) {
          setQuota({
            limit: Number(limitHeader),
            remaining: Number(remainingHeader),
            resetAt: Number(resetHeader) * 1000,
          });
        }
      }

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        track("simulation_failed", {
          status: res.status,
          reason: data?.reason || "unknown",
        });
        return;
      }

      setResultImage(data.image || data.result_url || data.photo_url || null);
      track("simulation_generated", {
        project_type: currentProject.id,
        elements_count: Object.values(elements).filter((el) => el.enabled && el.ref).length,
      });
    } catch {
      setError("Service indisponible. Veuillez réessayer.");
      track("simulation_failed", { reason: "network" });
    } finally {
      setSubmitting(false);
    }
  };

  const requestDevis = async () => {
    if (devisSending || devisSent) return;
    setDevisSending(true);
    try {
      const devisPayload: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        project_type: currentProject.id,
        website: honeypot,
      };
      for (const el of currentProject.elements) {
        const sel = elements[el.key];
        devisPayload[`${el.key}_ref`] = sel?.enabled ? sel.ref : "";
        devisPayload[`${el.key}_name`] = sel?.enabled ? sel.name : "";
      }
      const res = await fetch("/api/devis-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(devisPayload),
      });
      if (res.ok) {
        setDevisSent(true);
        track("devis_direct_sent", { from: "simulation_result" });
      } else {
        setError("Envoi du devis impossible. Réessayez dans un instant.");
      }
    } catch {
      setError("Envoi du devis impossible. Réessayez dans un instant.");
    } finally {
      setDevisSending(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPreview(null);
    setProjectId(null);
    setElements(createEmptyElements(PROJECT_TYPES[0]));
    setFormData({ name: "", phone: "", email: "", message: "" });
    setHoneypot("");
    setError("");
    setResultImage(null);
    setSubmitting(false);
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rouge/10 border border-rouge/30 text-rouge text-xs font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-rouge animate-pulse" />
              Exclusivité Coverswap
            </span>
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Intelligence artificielle</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-4">
            Simulation <span className="text-rouge">{projectId ? currentProject.label : "Coverswap"}</span>
          </h1>
          <p className="text-gris-400 max-w-2xl mx-auto text-lg">
            {projectId
              ? `Envoyez une photo, choisissez vos revêtements Cover Styl' et recevez un rendu réaliste en moins de 60 secondes.`
              : `Choisissez votre type de projet, envoyez une photo et recevez un rendu IA réaliste en moins de 60 secondes.`
            }
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (s < step && step !== 5) setStep(s); }}
                  disabled={s >= step || step === 5}
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${
                    step > s
                      ? "bg-green-500/20 text-green-400 cursor-pointer hover:bg-green-500/30"
                      : step === s
                      ? "bg-rouge text-white"
                      : "bg-white/10 text-gris-500"
                  }`}
                >
                  {step > s ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </button>
                {s < 5 && (
                  <div className={`flex-1 h-0.5 ${step > s ? "bg-green-500/40" : "bg-white/10"} transition-colors`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gris-500">
            <span>Projet</span>
            <span>Photo</span>
            <span>Revêtements</span>
            <span>Infos</span>
            <span>Résultat</span>
          </div>
        </div>

        {/* ═══════════════ STEP 1: CHOIX DU PROJET ═══════════════ */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">1</span>
              Quel est votre projet ?
            </h2>
            <p className="text-gris-400 mb-8 ml-11">
              Sélectionnez le type de surface à rénover. Le simulateur s&apos;adapte automatiquement.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROJECT_TYPES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProjectId(p.id);
                    setStep(2);
                  }}
                  className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    projectId === p.id
                      ? "border-rouge bg-rouge/10"
                      : "border-white/10 bg-white/5 hover:border-rouge/40 hover:bg-white/10"
                  }`}
                >
                  <span className="text-3xl mb-3 block">{p.icon}</span>
                  <h3 className="font-display text-lg font-bold text-white mb-1">{p.label}</h3>
                  <p className="text-xs text-gris-400 leading-relaxed">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: UPLOAD PHOTO ═══════════════ */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">2</span>
              {currentProject.uploadHint}
            </h2>

            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-rouge/50 ${
                preview ? "border-rouge/30" : "border-white/20"
              } min-h-[320px] flex items-center justify-center`}
            >
              {preview ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Aperçu" className="max-h-[300px] mx-auto rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-noir/80 flex items-center justify-center text-white hover:bg-rouge transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gris-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gris-400 mb-2">Glissez votre photo ici ou cliquez</p>
                  <p className="text-gris-600 text-sm">JPG, PNG — Max 10 Mo</p>
                  <p className="text-gris-600 text-xs mt-3">💡 {currentProject.uploadTip}</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => { setError(""); setStep(3); }}
              disabled={!preview}
              className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
              <svg className="w-5 h-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══════════════ STEP 3: SELECT REFERENCES ═══════════════ */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">3</span>
              Choisissez vos revêtements
            </h2>
            <p className="text-gris-400 mb-8 ml-11">
              Sélectionnez les éléments que vous souhaitez modifier et choisissez une référence Cover Styl&apos; pour chacun.
            </p>

            <div className="space-y-6">
              {currentProject.elements.map((el) => {
                const selection = elements[el.key];
                if (!selection) return null;
                return (
                  <div key={el.key} className="glass-card p-5 sm:p-6">
                    {/* Header with toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">{el.label}</h3>
                        <p className="text-xs text-gris-500">{el.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleElement(el.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selection.enabled
                            ? "bg-rouge text-white"
                            : "bg-white/5 text-gris-400 hover:bg-white/10 hover:text-white border border-white/10"
                        }`}
                      >
                        {selection.enabled ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Modifier
                          </>
                        ) : (
                          "Inchangé"
                        )}
                      </button>
                    </div>

                    {/* Selected reference summary */}
                    {selection.enabled && selection.ref && (
                      <div className="flex items-center gap-3 mt-3 mb-1 bg-rouge/10 border border-rouge/20 rounded-lg px-3 py-2">
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image src={selection.image} alt={selection.name} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{selection.name}</p>
                          <p className="text-xs text-gris-400">Réf. {selection.ref}</p>
                        </div>
                      </div>
                    )}

                    {/* Reference picker */}
                    {selection.enabled && (
                      <ReferencePicker
                        selected={{ ref: selection.ref, name: selection.name, famille: selection.famille, image: selection.image }}
                        onSelect={(ref) => selectReference(el.key, ref)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary flex-1"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!hasAnySelection}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <svg className="w-5 h-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {!hasAnySelection && (
              <p className="text-xs text-gris-500 text-center mt-3">
                Activez au moins un élément et sélectionnez une référence pour continuer.
              </p>
            )}
          </div>
        )}

        {/* ═══════════════ STEP 4: CONTACT INFO ═══════════════ */}
        {step === 4 && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">4</span>
              Vos coordonnées
            </h2>

            <div className="glass-card p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-sm text-gris-400 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm text-gris-400 mb-1.5">Téléphone *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm text-gris-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                  placeholder="jean@email.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gris-400 mb-1.5">Description du projet</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge resize-none"
                  placeholder="Décrivez votre projet, dimensions, rendu souhaité..."
                />
              </div>

              {/* Honeypot */}
              <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Summary of selections */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Récapitulatif</h4>
                <div className="space-y-2">
                  {currentProject.elements.map((el) => {
                    const s = elements[el.key];
                    if (!s?.enabled || !s.ref) return null;
                    return (
                      <div key={el.key} className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image src={s.image} alt={s.name} fill className="object-cover" sizes="32px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gris-400">{el.label}</p>
                          <p className="text-sm text-white truncate">{s.name} ({s.ref})</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Quota journalier — affiché si on a la donnée */}
            {quota && (
              <div className={`mt-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm border ${
                quota.remaining === 0
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : quota.remaining <= 1
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-white/5 border-white/10 text-gris-300"
              }`}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {quota.remaining === 0 ? (
                  <span>
                    Quota atteint. Nouveau crédit demain — ou{" "}
                    <a href="/contact" className="underline font-medium hover:text-white">demandez un devis prioritaire</a>.
                  </span>
                ) : (
                  <span>
                    Il vous reste <strong className="text-white">{quota.remaining}</strong> simulation{quota.remaining > 1 ? "s" : ""} gratuite{quota.remaining > 1 ? "s" : ""} aujourd&apos;hui (sur {quota.limit}).
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-secondary flex-1"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formData.name || !formData.phone || !formData.email || (quota?.remaining === 0)}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Lancer la simulation
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 5: PROCESSING & RESULT ═══════════════ */}
        {step === 5 && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {submitting ? (
              /* Loading state */
              <div className="text-center py-16">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rouge animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-rouge/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  </div>
                </div>
                <h2 className="font-display text-3xl font-bold mb-4">
                  Notre IA génère votre simulation...
                </h2>
                <p className="text-gris-400 text-lg mb-2">
                  Cela peut prendre 1 à 2 minutes
                </p>
                <p className="text-gris-500 text-sm">
                  Ne fermez pas cette page
                </p>

                {/* Animated dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-rouge"
                      style={{
                        animation: "pulse 1.4s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : error ? (
              /* Error state */
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold mb-3">Oups, une erreur est survenue</h2>
                <p className="text-gris-400 mb-8">{error}</p>
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={() => { setError(""); setStep(4); }} className="btn-secondary">
                    Retour
                  </button>
                  <button type="button" onClick={handleSubmit} className="btn-primary">
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              /* Result */
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-2">Votre simulation est prête !</h2>
                  <p className="text-gris-400">Comparez l&apos;avant et l&apos;après</p>
                </div>

                {/* Before / After comparison */}
                {resultImage && preview ? (
                  <BeforeAfterSlider
                    beforeImage={preview}
                    afterImage={resultImage}
                    beforeLabel="AVANT"
                    afterLabel="APRÈS"
                    height="h-[400px] md:h-[500px]"
                  />
                ) : (
                  /* Fallback: side-by-side or just the before */
                  <div className="grid md:grid-cols-2 gap-4">
                    {preview && (
                      <div className="glass-card p-3">
                        <p className="text-xs text-gris-500 uppercase tracking-wider mb-2">Avant</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Avant" className="w-full rounded-lg object-contain max-h-[400px]" />
                      </div>
                    )}
                    {resultImage && (
                      <div className="glass-card p-3">
                        <p className="text-xs text-rouge uppercase tracking-wider mb-2">Après</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resultImage} alt="Après" className="w-full rounded-lg object-contain max-h-[400px]" />
                      </div>
                    )}
                    {!resultImage && (
                      <div className="glass-card p-6 flex items-center justify-center">
                        <p className="text-gris-400 text-center">
                          Votre simulation a été envoyée. Vous recevrez le résultat par SMS dans quelques minutes.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected references summary */}
                <div className="glass-card p-5 mt-6">
                  <h3 className="font-display text-lg font-bold mb-4">Références sélectionnées</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {currentProject.elements.map((el) => {
                      const s = elements[el.key];
                      if (!s?.enabled || !s.ref) return null;
                      return (
                        <div key={el.key} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image src={s.image} alt={s.name} fill className="object-cover" sizes="48px" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gris-500">{el.label}</p>
                            <p className="text-sm font-medium text-white truncate">{s.name}</p>
                            <p className="text-xs text-gris-400">Réf. {s.ref}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    type="button"
                    onClick={requestDevis}
                    disabled={devisSending || devisSent}
                    className="btn-primary flex-1 text-center disabled:opacity-90 disabled:cursor-default"
                  >
                    {devisSent ? (
                      <>
                        <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Devis envoyé — on vous rappelle
                      </>
                    ) : devisSending ? (
                      "Envoi..."
                    ) : (
                      <>
                        Demander un devis
                        <svg className="w-5 h-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {resultImage && preview && (
                    <button
                      type="button"
                      onClick={() => downloadSimulation(preview, resultImage, elements, formData.name, currentProject.elements)}
                      className="group flex-1 inline-flex items-center justify-center gap-2 bg-white/5 border-2 border-white/20 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-white/10 hover:border-rouge/50 hover:scale-105 active:scale-95 uppercase tracking-wider"
                    >
                      <svg className="w-5 h-5 group-hover:text-rouge transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger mon projet
                    </button>
                  )}
                  <a
                    href="https://wa.me/33670352869?text=Bonjour%2C%20je%20viens%20de%20faire%20une%20simulation%20sur%20votre%20site%20et%20j%27aimerais%20en%20discuter."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-1 inline-flex items-center justify-center gap-2 bg-green-600/20 border-2 border-green-500/30 text-green-400 font-bold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-green-600/30 hover:border-green-500/50 hover:scale-105 active:scale-95 uppercase tracking-wider"
                    onClick={() => track("whatsapp_clicked", { source: "simulation_result" })}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.702-1.398A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.993-1.953l-.42-.306-2.791.83.755-2.853-.326-.478A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    Échanger sur WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1"
                  >
                    Nouvelle simulation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
