"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useFavoris } from "@/app/simulateur/_components/useFavoris";
import { IconeCoeur, IconeLoupe } from "@/components/espace/Illustrations";
import { Bouton } from "@/components/simulation/Bouton";
import { BoutonFavori, CHAMP_RECHERCHE } from "@/components/simulation/ElementsCatalogue";
import { cx, useLiensDeFeuille } from "@/components/simulation/Feuille";
import { Lien } from "@/components/simulation/Lien";
import { PleinEcran } from "@/components/simulation/PleinEcran";
import { GRILLE_TUILES_GRANDES, SqueletteTuiles } from "@/components/simulation/Squelette";
import { TuileFilm } from "@/components/simulation/TuileFilm";
import { libelleFamille } from "@/lib/familles-matieres";
import { MATIERES_PAR_PAGE, chargerCatalogue, etatListeMatieres, filtrerMatieres, lienEssayer, lireAdresseMatieres, type ChoixFamille, type FiltreMatieres, type Matiere } from "@/lib/matieres";
import { urlEchantillon, urlVignette } from "@/lib/simulateur/generation-client";

/**
 * La page Matières (mission 16, partie 5), la partie qui bouge : familles en filtres, recherche en français
 * (`recherche-finitions`), favoris (`useFavoris`, ceux du simulateur), tuiles `TuileFilm` (vignettes de 320 px du CRM)
 * en 3 colonnes sur téléphone, 5 sur ordinateur, « Voir plus » par lots de 30. Une tuile ouvre la matière EN GRAND
 * (`PleinEcran` + `ZoomImage`, l'échantillon entier du CRM) avec son nom, sa référence, sa famille et le bouton
 * principal « Essayer sur ma photo » → `/simulateur?ref=<ref>`.
 *  - Le serveur rend le premier lot (« Tout », 30 matières : référencement) ; le catalogue entier arrive ensuite
 *    (`chargerCatalogue`, un fichier à part) et prend le relais, dans le même ordre (rien ne saute).
 *  - L'adresse (`?famille=`, `?ref=`) est lue sans `useSearchParams` (qui ferait rendre toute la page côté client) :
 *    le rendu serveur montre « Tout », le client applique l'adresse après l'hydratation. `?ref=` ouvre la matière en
 *    grand UNE fois (fermée, elle ne se rouvre pas au retour d'historique) ; inconnue, rien ne s'ouvre.
 */

const ecouterAdresse = (rappel: () => void) => {
  window.addEventListener("popstate", rappel);
  return () => window.removeEventListener("popstate", rappel);
};
const rechercheDeLAdresse = () => window.location.search;
const rechercheServeur = () => "";

const PASTILLE = "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)]";
/**
 * Ce qui reste visible sous l'en-tête (60 px + trait) et la barre des familles collée (≈ 69 px), plus l'anneau de
 * focus : une tuile atteinte au clavier (Maj+Tab) s'arrête dessous, pas derrière.
 */
const SOUS_LES_BARRES = "scroll-mt-[140px]";

export function Matieres({ premieres, familles }: { premieres: Matiere[]; familles: ChoixFamille[] }) {
  const rechercheAdresse = useSyncExternalStore(ecouterAdresse, rechercheDeLAdresse, rechercheServeur);
  const [catalogue, setCatalogue] = useState<Matiere[] | null>(null);
  const [probleme, setProbleme] = useState(false);
  const { favoris, charger: chargerFavoris, basculer: basculerFavori } = useFavoris();

  // Le catalogue entier (et les favoris gardés dans ce navigateur) juste après l'hydratation.
  useEffect(() => {
    let actif = true;
    chargerCatalogue()
      .then((liste) => {
        if (!actif) return;
        setCatalogue(liste);
        chargerFavoris();
      })
      .catch(() => {
        if (!actif) return;
        setProbleme(true);
        chargerFavoris();
      });
    return () => {
      actif = false;
    };
  }, [chargerFavoris]);

  const adresse = lireAdresseMatieres(rechercheAdresse, catalogue);
  const [filtreChoisi, setFiltreChoisi] = useState<FiltreMatieres | null>(null);
  const filtre = filtreChoisi ?? adresse.famille;
  const [recherche, setRecherche] = useState("");
  const [limite, setLimite] = useState(MATIERES_PAR_PAGE);
  const [agrandie, setAgrandie] = useState<Matiere | null>(null);

  // `?ref=` : la matière s'ouvre en grand une fois (état ajusté pendant le rendu).
  const [refOuverte, setRefOuverte] = useState<string | null>(null);
  if (adresse.ouverte && refOuverte !== adresse.ouverte.id) {
    setRefOuverte(adresse.ouverte.id);
    setAgrandie(adresse.ouverte);
  }

  // Nouveau filtre, nouvelle recherche : on repart du premier lot.
  const [cleFiltre, setCleFiltre] = useState(`${filtre}|${recherche}`);
  if (cleFiltre !== `${filtre}|${recherche}`) {
    setCleFiltre(`${filtre}|${recherche}`);
    setLimite(MATIERES_PAR_PAGE);
  }

  const filtrees = useMemo(() => (catalogue ? filtrerMatieres(catalogue, { filtre, recherche, favoris }) : null), [catalogue, filtre, recherche, favoris]);
  // Premier lot du serveur, squelette, échec, compte, « Voir plus » : règles pures (`lib/matieres › etatListeMatieres`).
  const { visibles, attend: attendCatalogue, reste, message } = etatListeMatieres({ filtrees, probleme, filtre, recherche, premieres, familles, limite });

  /* ── La matière en grand : le focus revient sur sa tuile à la fermeture ; le lien part une fois le plein écran fermé. ── */
  const declencheur = useRef<HTMLElement | null>(null);
  const fermer = useCallback(() => setAgrandie(null), []);
  const aller = useLiensDeFeuille(agrandie !== null, fermer);
  useEffect(() => {
    if (agrandie || !declencheur.current) return;
    const tuile = declencheur.current;
    declencheur.current = null;
    if (tuile.isConnected) tuile.focus({ preventScroll: true });
  }, [agrandie]);

  const choix: { id: FiltreMatieres; libelle: string; nombre: number | null }[] = [...familles, { id: "favoris", libelle: "Favoris", nombre: favoris.length }];

  return (
    <div>
      {/* ── Familles (collées sous l'en-tête) ── */}
      {/* La barre va d'un bord à l'autre ; le groupe défilant garde une marge intérieure : l'anneau de focus des pastilles du bout n'est pas rogné. */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-trait bg-fond md:-mx-6">
        <div role="group" aria-label="Familles de matières" className="flex items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:px-6 [&::-webkit-scrollbar]:hidden">
          {choix.map((f) => {
            const actif = filtre === f.id;
            return (
              <button key={f.id} type="button" aria-pressed={actif} onClick={() => setFiltreChoisi(f.id)} className={cx(PASTILLE, actif ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre")}>
                <span>{f.libelle}</span>
                <span className={cx("text-[13px]", actif ? "text-blanc/70" : "text-encre-2")}>{f.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recherche ── */}
      <div className="pt-6 pb-2">
        <label htmlFor="recherche-matieres" className="sr-only">
          Chercher une matière
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-encre-2">
            <IconeLoupe />
          </span>
          {/* type="text" : un champ « search » ajouterait la croix du navigateur à côté de « Effacer la recherche ». */}
          <input id="recherche-matieres" type="text" inputMode="search" enterKeyHint="search" autoComplete="off" placeholder="Chêne, blanc, marbre, noir mat…" value={recherche} onChange={(e) => setRecherche(e.target.value)} className={cx(CHAMP_RECHERCHE, "pr-12", SOUS_LES_BARRES)} />
          {recherche ? (
            <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        <p className="mt-3 min-h-[24px] text-[14.5px] text-encre-2" aria-live="polite">
          {message}
        </p>
      </div>

      {/* ── Tuiles ── */}
      {visibles.length > 0 ? (
        <ul className={cx("mt-4", GRILLE_TUILES_GRANDES)}>
          {visibles.map((m) => {
            const favori = favoris.includes(m.id);
            return (
              <li key={m.id} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    declencheur.current = e.currentTarget;
                    setAgrandie(m);
                  }}
                  aria-label={`${m.nom}, référence ${m.id}, ${libelleFamille(m.famille)} : voir en grand`}
                  className={cx("block w-full rounded-[var(--rayon-md)] text-left transition-opacity duration-[var(--duree-courte)] hover:opacity-85", SOUS_LES_BARRES)}
                >
                  <TuileFilm ref={m.id} nom={m.nom} libelle={libelleFamille(m.famille)} vignette={urlVignette(m.id)} taille="grand" />
                </button>
                <BoutonFavori nom={m.nom} favori={favori} onBasculer={() => basculerFavori(m.id)} className={SOUS_LES_BARRES} />
              </li>
            );
          })}
        </ul>
      ) : null}
      {attendCatalogue ? (
        <div className="mt-4">
          <SqueletteTuiles nombre={15} grand />
        </div>
      ) : null}

      {reste > 0 ? (
        <div className="mt-10 flex justify-center">
          <Bouton variante="secondaire" onClick={() => setLimite((l) => l + MATIERES_PAR_PAGE)}>
            Voir plus ({reste})
          </Bouton>
        </div>
      ) : null}

      {/* ── La matière en grand ── */}
      <PleinEcran
        ouvert={agrandie !== null}
        onFermer={fermer}
        apres={agrandie ? urlEchantillon(agrandie.id) : ""}
        avant={null}
        alt={agrandie ? `Échantillon ${agrandie.nom}, référence ${agrandie.id}` : ""}
        libelle={agrandie ? `${agrandie.nom} en grand` : "Matière en grand"}
        modale
        pied={
          agrandie ? (
            <div className="mx-auto w-full max-w-xl">
              <p className="text-[17px] font-semibold text-encre">{agrandie.nom}</p>
              <p className="texte-2 mt-0.5">
                Réf. {agrandie.id} · {libelleFamille(agrandie.famille)}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Lien href={lienEssayer(agrandie.id)} onClick={aller(lienEssayer(agrandie.id))} plein>
                  Essayer sur ma photo
                </Lien>
                <Bouton variante="secondaire" plein aria-pressed={favoris.includes(agrandie.id)} onClick={() => basculerFavori(agrandie.id)}>
                  <span className={favoris.includes(agrandie.id) ? "text-accent" : ""}>
                    <IconeCoeur plein={favoris.includes(agrandie.id)} />
                  </span>
                  {favoris.includes(agrandie.id) ? "Dans mes favoris" : "Ajouter à mes favoris"}
                </Bouton>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
