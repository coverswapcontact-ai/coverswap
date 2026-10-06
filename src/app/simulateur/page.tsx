import type { Metadata, Viewport } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { FAQSchema, HowToSchema, VideoSchema } from "@/components/JsonLd";
import { FAQ_SIMULATEUR } from "@/data/faq";
import { exemplesSimulateur } from "@/lib/exemples-simulateur";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import { sourcesPhoto } from "@/lib/images-preparees";
import { metadonneesPage } from "@/lib/metadonnees";
import { photosDesCartes } from "@/lib/photos-cartes";
import { DELAI_RENDU, DELAI_REPONSE, NB_REFERENCES } from "@/lib/offre";
import { chargerZonesSimulateur, zonesMaxEnLettres } from "@/lib/simulateur/zones";
import { chargerTarifs } from "@/lib/tarifs-site";
import { LIBELLES_VIDEO, VIDEOS } from "@/lib/videos";
import { MOTS_CLES_DEVIS_EN_LIGNE } from "../comment-ca-marche/devis-en-ligne";
import { EnteteSimulateur } from "./_components/EnteteSimulateur";
import Simulateur from "./_components/Simulateur";

/**
 * Mission 16 (partie 4) : /devis est redirigée ici (301) ; son vocabulaire (« devis covering en ligne, gratuit, sans
 * engagement ») passe dans la description et les mots-clés. Ses textes entiers sont sur /comment-ca-marche.
 * Partie 5 : métadonnées par `metadonneesPage` (Open Graph propre, description de 160 caractères au plus) ; la phrase
 * « coordonnées demandées seulement pour recevoir le rendu » reste dans la page (étape 4 du HowTo, FAQ).
 * Mission 22 (partie B) : la démo du simulateur (21 s, verticale) sur l'écran Pièce, au clic (« Voir la démo · 20 s »),
 * dans un cadre de téléphone à droite dès 1 024 px, en lien sous les cartes au téléphone ; l'affiche est résolue ici
 * (`sourcesPhoto`, comme les photos des cartes : le simulateur n'emporte pas le manifeste) et le `VideoObject` posé ici.
 */
const DESCRIPTION_SIMULATEUR = `Votre pièce avec une matière Cover Styl', sur votre photo, en ${DELAI_RENDU}. Puis un devis covering en ligne, gratuit et sans engagement, ${DELAI_REPONSE}.`;

export const metadata: Metadata = {
  ...metadonneesPage({ titre: "Simulateur de covering sur votre photo, gratuit | CoverSwap", description: DESCRIPTION_SIMULATEUR, chemin: "/simulateur" }),
  keywords: `simulateur covering, simulation covering cuisine, ${MOTS_CLES_DEVIS_EN_LIGNE}`,
};

/** Mission 15 : la page couvre la zone sûre de l'iPhone (bouton collé en bas, feuilles). La couleur de la barre vient du gabarit (mission 16 : une seule source). */
export const viewport: Viewport = { viewportFit: "cover" };

/** Les quatre étapes du HowTo et de « Comment ça marche » ; la limite de zones est celle du CRM. */
const etapesDe = (zonesMax: number) => [
  { titre: "Choisir la pièce", texte: "Cuisine, salle de bain, meubles, murs ou local professionnel." },
  { titre: "Photographier", texte: "Une photo de face, bien éclairée, toute la zone visible. Téléphone ou ordinateur, HEIC compris." },
  { titre: "Choisir les matières", texte: `Jusqu'à ${zonesMaxEnLettres(zonesMax)} zones, et pour chacune une matière parmi ${NB_REFERENCES} références Cover Styl'.` },
  { titre: "Voir le résultat", texte: `Le rendu s'affiche en avant / après en ${DELAI_RENDU} ; vous pouvez quitter la page, la simulation continue. Vos coordonnées ne sont demandées que pour le recevoir avec un devis.` },
];

export default async function PageSimulateur() {
  // Mission 16 (partie 4) : les tarifs publics du CRM pour l'estimation après le rendu (une heure en cache ; null → fourchettes).
  const [zones, tarifs] = await Promise.all([chargerZonesSimulateur(), chargerTarifs()]);
  const ETAPES = etapesDe(zones.zonesMax);
  // Lot E3 : les pièces d'exemple de l'écran Photo, seulement pour les pièces que le simulateur publie.
  const exemples = exemplesSimulateur({ pieces: zones.pieces.map((p) => p.id) });
  // Mission 22 (partie B) : la démo en vidéo de l'écran Pièce, son affiche résolue ici (le simulateur n'emporte pas le manifeste).
  const demo = { video: VIDEOS.demoSimulateur, affiche: sourcesPhoto(VIDEOS.demoSimulateur.affiche), libelle: LIBELLES_VIDEO.demoSimulateur };
  return (
    <div data-theme="simulation" data-page="simulateur" className="min-h-[100dvh] bg-fond text-encre">
      <HowToSchema name="Simuler un covering sur sa propre photo" description="Quatre étapes, sans inscription." etapes={ETAPES} dureeTotale="PT3M" />
      <FAQSchema faqs={FAQ_SIMULATEUR} />
      <VideoSchema video={VIDEOS.demoSimulateur} />
      <EnteteSimulateur />
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-16">
        <h1 className="sr-only">Simulateur de covering sur votre photo</h1>
        <Simulateur zones={zones} tarifs={tarifs} exemples={exemples} demo={demo} photosPieces={photosDesCartes(PHOTOS_PIECES)} />
        {/* Site 3.0 (lot F4) : le fil d'Ariane, visible et balisé, sous l'outil — le premier écran reste au simulateur. */}
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Simulateur", href: "/simulateur" }]} className="mt-16 mb-0" />
        <section className="mt-4 max-w-2xl border-t border-trait pt-10">
          <h2 className="font-display text-[22px] font-semibold">Comment ça marche</h2>
          <ol className="mt-5 space-y-4">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-encre font-display text-[14px] font-semibold text-encre">{i + 1}</span>
                <div>
                  <p className="text-[16px] font-semibold text-encre">{e.titre}</p>
                  <p className="text-[14.5px] leading-relaxed text-encre-2">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-[22px] font-semibold">Questions sur le simulateur</h2>
          <div className="mt-5 space-y-2.5">
            {FAQ_SIMULATEUR.map((f) => (
              <details key={f.q} className="group rounded-[var(--rayon-md)] border border-trait bg-white p-4">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
                  {f.q}
                  <span aria-hidden className="text-2xl leading-none text-encre-2 transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed text-encre-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
