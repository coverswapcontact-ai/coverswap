import type { Metadata, Viewport } from "next";
import { BreadcrumbSchema, FAQSchema, HowToSchema } from "@/components/JsonLd";
import { FAQ_SIMULATEUR } from "@/data/faq";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_RENDU, DELAI_REPONSE, NB_REFERENCES } from "@/lib/offre";
import { chargerZonesSimulateur, zonesMaxEnLettres } from "@/lib/simulateur/zones";
import { chargerTarifs } from "@/lib/tarifs-site";
import { MOTS_CLES_DEVIS_EN_LIGNE } from "../comment-ca-marche/devis-en-ligne";
import { EnteteSimulateur } from "./_components/EnteteSimulateur";
import Simulateur from "./_components/Simulateur";

/**
 * Mission 16 (partie 4) : /devis est redirigée ici (301) ; son vocabulaire (« devis covering en ligne, gratuit, sans
 * engagement ») passe dans la description et les mots-clés. Ses textes entiers sont sur /comment-ca-marche.
 */
export const metadata: Metadata = {
  title: { absolute: "Simulateur de covering sur votre photo — gratuit, sans inscription | CoverSwap" },
  description: `Envoyez une photo de votre cuisine, salle de bain, meuble ou local, choisissez une matière parmi ${NB_REFERENCES} références Cover Styl', voyez le résultat en ${DELAI_RENDU}. Coordonnées demandées seulement pour recevoir le rendu et un devis covering en ligne, gratuit et sans engagement, ${DELAI_REPONSE}.`,
  keywords: `simulateur covering, simulation covering cuisine, ${MOTS_CLES_DEVIS_EN_LIGNE}`,
  alternates: { canonical: `${ENTREPRISE.site}/simulateur` },
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
  return (
    <div data-theme="simulation" data-page="simulateur" className="min-h-[100dvh] bg-fond text-encre">
      <HowToSchema name="Simuler un covering sur sa propre photo" description="Quatre étapes, sans inscription." etapes={ETAPES} dureeTotale="PT3M" />
      <FAQSchema faqs={FAQ_SIMULATEUR} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Simulateur", url: `${ENTREPRISE.site}/simulateur` }]} />
      <EnteteSimulateur />
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-16">
        <h1 className="sr-only">Simulateur de covering sur votre photo</h1>
        <Simulateur zones={zones} tarifs={tarifs} />
        <section className="mt-16 max-w-2xl border-t border-trait pt-10">
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
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
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
