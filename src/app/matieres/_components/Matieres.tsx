"use client";

import Link from "@/components/LienSite";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useFavoris } from "@/app/simulateur/_components/useFavoris";
import { IconeCoeur, IconeLoupe } from "@/components/espace/Illustrations";
import { Cartel } from "@/components/revue/Cartel";
import { VignetteEchantillon } from "@/components/revue/Echantillon";
import { Bouton } from "@/components/simulation/Bouton";
import { BoutonFavori, CHAMP_RECHERCHE } from "@/components/simulation/ElementsCatalogue";
import { cx, useLiensDeFeuille } from "@/components/simulation/Feuille";
import { Lien } from "@/components/simulation/Lien";
import { PleinEcran } from "@/components/simulation/PleinEcran";
import { GRILLE_ECHANTILLONS, SqueletteTuiles } from "@/components/simulation/Squelette";
import { differer } from "@/lib/differer";
import { cheminFamille, cheminMatiere } from "@/lib/familles-matieres";
import { DELAI_RECHERCHE_MS, MATIERES_PAR_PAGE, chargerCatalogue, estAffine, etatListeMatieres, filtrerMatieres, lienEssayer, lireAdresseMatieres, type FiltreMatieres, type Matiere, type Tiroir } from "@/lib/matieres";
import { urlEchantillon } from "@/lib/simulateur/generation-client";
import { TEINTES, trierParTeinte, type Teinte } from "@/lib/teintes";

/**
 * Le présentoir de /matieres (site 3.0, lot D2 ; énoncé, phase D ; mission 16, partie 5), la partie qui bouge :
 *  - les sept familles en TIROIRS (une pastille chacune, quatre teintes de son nuancier en pastilles CSS, son nombre ;
 *    plus « Tout » et « Favoris »), collés sous l'en-tête : le tiroir ouvert est le filtre de famille ;
 *  - les filtres teinte, finition (les trois qui ne sont pas « Standard ») et « Vue dans une ambiance », la recherche
 *    par nom ou référence (`recherche-finitions`, différée de 150 ms) ;
 *  - chaque matière en ÉCHANTILLON physique (`VignetteEchantillon` : la vraie vignette du CRM en `?l=320`, chargée à
 *    la demande, coin arrondi, ombre légère, la couleur de la matière dessous) avec son cartel « Nom · RÉF · famille ·
 *    finition », RANGÉE PAR TEINTE (`trierParTeinte`, hors du filtre), 30 par 30 (« Voir plus ») ;
 *  - un échantillon ouvre la matière EN GRAND (`PleinEcran` + `ZoomImage`, l'échantillon entier) : son cartel, « Vue
 *    dans » (liens de PAGE vers `/inspirations#<id>`, pour qu'une ambiance de la suite masquée s'ouvre : `:target`),
 *    « Essayer sur ma photo » (`depuis=matieres`), les favoris et, depuis le lot D4, « Voir la fiche de … »
 *    (`/matieres/<famille>/<REF>`).
 * Le serveur rend les 30 premières du nuancier (« Tout ») ; le catalogue entier arrive ensuite (`chargerCatalogue`)
 * et prend le relais dans le même ordre (rien ne saute). L'adresse (`?famille=`, `?ref=`) est lue sans
 * `useSearchParams` (qui ferait rendre toute la page côté client) : `?ref=` ouvre la matière en grand UNE fois.
 */

const ecouterAdresse = (rappel: () => void) => {
  window.addEventListener("popstate", rappel);
  return () => window.removeEventListener("popstate", rappel);
};
const rechercheDeLAdresse = () => window.location.search;
const rechercheServeur = () => "";

const PASTILLE = "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)]";
const CHOIX = "min-h-[44px] w-full appearance-none rounded-[var(--rayon-sm)] border bg-blanc py-2 pr-10 pl-3.5 text-[15px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre";
/** Les échantillons dont la vignette part tout de suite : la première rangée à 1 440 px (5), les premières au téléphone. */
const PREMIERE_RANGEE = 5;
/**
 * Ce qui reste visible sous l'en-tête (60 px + trait) et la barre des tiroirs collée (≈ 69 px), plus l'anneau de
 * focus : un échantillon atteint au clavier (Maj+Tab) s'arrête dessous, pas derrière.
 */
const SOUS_LES_BARRES = "scroll-mt-[140px] lg:scroll-mt-[200px]";

function Chevron() {
  return (
    <svg className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-encre-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Matieres({ premieres, tiroirs, finitions, vueDans = {} }: { premieres: Matiere[]; tiroirs: Tiroir[]; /** Les finitions du filtre (hors « Standard »), avec leur nombre. */ finitions: { id: string; libelle: string; nombre: number }[]; /** Pour chaque référence, les ambiances de /inspirations où elle apparaît (séries 1 et 2). */ vueDans?: Record<string, { id: string; titre: string }[]> }) {
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
  // Mission 16 (partie 6) : `saisie` suit la frappe, `recherche` (le filtre des 497 matières) 150 ms après la dernière touche.
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheDifferee] = useState(() => differer(setRecherche, DELAI_RECHERCHE_MS));
  useEffect(() => () => rechercheDifferee.annuler(), [rechercheDifferee]);
  const saisir = (valeur: string) => {
    setSaisie(valeur);
    rechercheDifferee.appeler(valeur);
  };
  // « Effacer » disparaît avec la saisie : le focus revient dans le champ, pas sur la page.
  const champRecherche = useRef<HTMLInputElement>(null);
  const effacer = () => {
    rechercheDifferee.annuler();
    setSaisie("");
    setRecherche("");
    champRecherche.current?.focus();
  };

  // L'affinage : teinte, finition, « vue dans une ambiance ».
  const [teinte, setTeinte] = useState<Teinte | null>(null);
  const [finition, setFinition] = useState<string | null>(null);
  const [enAmbiance, setEnAmbiance] = useState(false);
  const vues = useMemo(() => Object.keys(vueDans), [vueDans]);
  const ambiance = enAmbiance ? vues : null;
  const affine = estAffine({ teinte, finition, ambiance });
  const precisions = [teinte, finitions.find((f) => f.id === finition)?.libelle, enAmbiance ? "vues dans une ambiance" : null].filter((x): x is string => !!x);
  const toutRemettre = () => {
    setTeinte(null);
    setFinition(null);
    setEnAmbiance(false);
  };

  const [limite, setLimite] = useState(MATIERES_PAR_PAGE);
  const [agrandie, setAgrandie] = useState<Matiere | null>(null);

  // `?ref=` : la matière s'ouvre en grand une fois (état ajusté pendant le rendu).
  const [refOuverte, setRefOuverte] = useState<string | null>(null);
  if (adresse.ouverte && refOuverte !== adresse.ouverte.id) {
    setRefOuverte(adresse.ouverte.id);
    setAgrandie(adresse.ouverte);
  }

  // Nouveau tiroir, nouveau filtre, nouvelle recherche : on repart du premier lot.
  const cle = `${filtre}|${recherche}|${teinte}|${finition}|${enAmbiance}`;
  const [cleFiltre, setCleFiltre] = useState(cle);
  if (cleFiltre !== cle) {
    setCleFiltre(cle);
    setLimite(MATIERES_PAR_PAGE);
  }

  // Le tri par teinte se fait HORS du filtre : `filtrerMatieres` garde l'ordre du catalogue (la feuille du simulateur le lit aussi).
  const filtrees = useMemo(() => (catalogue ? trierParTeinte(filtrerMatieres(catalogue, { filtre, recherche, favoris, teinte, finition, ambiance })) : null), [catalogue, filtre, recherche, favoris, teinte, finition, ambiance]);
  // Premier lot du serveur, squelette, échec, compte, « Voir plus » : règles pures (`lib/matieres › etatListeMatieres`).
  const { visibles, attend: attendCatalogue, reste, message } = etatListeMatieres({ filtrees, probleme, filtre, recherche, premieres, familles: tiroirs, limite, affine, precisions });

  /* ── La matière en grand : le focus revient sur son échantillon à la fermeture ; le lien part une fois le plein écran fermé. ── */
  const declencheur = useRef<HTMLElement | null>(null);
  const fermer = useCallback(() => setAgrandie(null), []);
  const aller = useLiensDeFeuille(agrandie !== null, fermer);
  useEffect(() => {
    if (agrandie || !declencheur.current) return;
    const tuile = declencheur.current;
    declencheur.current = null;
    if (tuile.isConnected) tuile.focus({ preventScroll: true });
  }, [agrandie]);

  const tiroirOuvert = tiroirs.find((t) => t.id === filtre && t.id !== "tout") ?? null;
  const choix: Tiroir[] = [...tiroirs, { id: "favoris", libelle: "Favoris", nombre: favoris.length, teintes: [] }];

  return (
    <div>
      {/* ── Les tiroirs (collés sous l'en-tête) ── */}
      {/* La barre va d'un bord à l'autre ; le groupe défilant garde une marge intérieure : l'anneau de focus des pastilles du bout n'est pas rogné. */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-trait bg-fond md:-mx-6">
        <div role="group" aria-label="Familles de matières" className="flex items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:px-6 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {choix.map((f) => {
            const actif = filtre === f.id;
            return (
              <button key={f.id} type="button" aria-pressed={actif} onClick={() => setFiltreChoisi(f.id)} className={cx(PASTILLE, actif ? "border-encre bg-encre text-blanc" : "border-trait bg-blanc text-encre hover:border-encre")}>
                {f.teintes.length ? (
                  <span aria-hidden="true" className="flex -space-x-1.5">
                    {f.teintes.map((hex, i) => (
                      <span key={i} className={cx("h-4 w-4 rounded-full ring-2", actif ? "ring-encre" : "ring-blanc")} style={{ backgroundColor: hex }} />
                    ))}
                  </span>
                ) : f.id === "favoris" ? (
                  <span aria-hidden="true" className="flex">
                    <IconeCoeur taille={16} plein={actif} />
                  </span>
                ) : null}
                <span>{f.libelle}</span>
                <span className={cx("text-[13px]", actif ? "text-blanc/70" : "text-encre-2")}>{f.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Teinte, finition, vue dans une ambiance ── */}
      <div className="grid grid-cols-2 gap-2 pt-5 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative sm:w-56">
          <label htmlFor="filtre-teinte" className="sr-only">
            Teinte
          </label>
          <select id="filtre-teinte" value={teinte ?? ""} onChange={(e) => setTeinte((e.target.value || null) as Teinte | null)} className={cx(CHOIX, teinte ? "border-encre font-medium" : "border-trait")}>
            <option value="">Teinte : toutes</option>
            {TEINTES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        <div className="relative sm:w-56">
          <label htmlFor="filtre-finition" className="sr-only">
            Finition
          </label>
          <select id="filtre-finition" value={finition ?? ""} onChange={(e) => setFinition(e.target.value || null)} className={cx(CHOIX, finition ? "border-encre font-medium" : "border-trait")}>
            <option value="">Finition : toutes</option>
            {finitions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.libelle} ({f.nombre})
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        <button type="button" aria-pressed={enAmbiance} onClick={() => setEnAmbiance((v) => !v)} className={cx(PASTILLE, "col-span-2 justify-center sm:justify-start", enAmbiance ? "border-encre bg-encre text-blanc" : "border-trait bg-blanc text-encre hover:border-encre")}>
          <span>Vue dans une ambiance</span>
          <span className={cx("text-[13px]", enAmbiance ? "text-blanc/70" : "text-encre-2")}>{vues.length}</span>
        </button>
        {affine ? (
          <button type="button" onClick={toutRemettre} className="col-span-2 min-h-[44px] px-1 text-left text-[14.5px] text-encre-2 underline underline-offset-4 hover:text-encre">
            Effacer les filtres
          </button>
        ) : null}
      </div>

      {/* ── Recherche ── */}
      <div className="pt-3 pb-2">
        <label htmlFor="recherche-matieres" className="sr-only">
          Chercher une matière par nom ou référence
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-encre-2">
            <IconeLoupe />
          </span>
          {/* type="text" : un champ « search » ajouterait la croix du navigateur à côté de « Effacer la recherche ». */}
          <input ref={champRecherche} id="recherche-matieres" type="text" inputMode="search" enterKeyHint="search" autoComplete="off" placeholder="Chêne, blanc, marbre, NF13…" value={saisie} onChange={(e) => saisir(e.target.value)} className={cx(CHAMP_RECHERCHE, "pr-12", SOUS_LES_BARRES)} />
          {saisie ? (
            <button type="button" onClick={effacer} aria-label="Effacer la recherche" className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        <p className="mt-3 min-h-[24px] text-[14.5px] text-encre-2" aria-live="polite">
          {message}
        </p>
        {/* Lot D3 : un tiroir ouvert mène à la page de sa famille (ce que c'est, où ça se pose, l'entretien, les limites). */}
        {tiroirOuvert ? (
          <Link href={cheminFamille(tiroirOuvert.id)} className="inline-flex min-h-[44px] items-center text-[14.5px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
            Tout savoir sur les {tiroirOuvert.libelle.toLowerCase()}
          </Link>
        ) : null}
      </div>

      {/* ── Les échantillons, rangés par teinte ── */}
      {visibles.length > 0 ? (
        <ul className={cx("mt-4", GRILLE_ECHANTILLONS)}>
          {visibles.map((m, rang) => {
            const favori = favoris.includes(m.id);
            return (
              <li key={m.id} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    declencheur.current = e.currentTarget;
                    setAgrandie(m);
                  }}
                  className={cx("group block w-full rounded-[var(--rayon-sm)] text-left", SOUS_LES_BARRES)}
                >
                  {/* Lot F6 : le nom du bouton est son texte (le cartel, puis « voir en grand » pour les lecteurs d'écran), plus un aria-label qui le doublait (WCAG 2.5.3). */}
                  <VignetteEchantillon matiere={m} priorite={rang < PREMIERE_RANGEE} className="transition-transform duration-[var(--duree-courte)] motion-safe:group-hover:-translate-y-0.5" />
                  <Cartel matiere={m} balise="span" className="mt-3" />
                  <span className="sr-only"> : voir en grand</span>
                </button>
                <BoutonFavori nom={m.nom} favori={favori} onBasculer={() => basculerFavori(m.id)} className={SOUS_LES_BARRES} />
              </li>
            );
          })}
        </ul>
      ) : null}
      {attendCatalogue ? (
        <div className="mt-4">
          <SqueletteTuiles nombre={10} grand />
        </div>
      ) : null}

      {reste > 0 ? (
        <div className="mt-12 flex justify-center">
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
              <Cartel matiere={agrandie} />
              {vueDans[agrandie.id]?.length ? (
                <p className="mt-3 text-[14.5px] text-encre-2">
                  Vue dans :{" "}
                  {vueDans[agrandie.id].map((a, i) => (
                    <span key={a.id}>
                      {i > 0 ? ", " : ""}
                      {/* Un lien de page, pas le routeur : l'ancre (`:target`) montre l'ambiance même dans la suite masquée de /inspirations. */}
                      <a href={`/inspirations#${a.id}`} className="font-medium text-encre underline underline-offset-4">
                        {a.titre}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
              {/* Lot D4 : la fiche de la matière (ses ambiances, ses voisines, « La voir en vrai chez moi »). */}
              <p className="mt-2">
                <Link href={cheminMatiere(agrandie.id, agrandie.famille)} onClick={aller(cheminMatiere(agrandie.id, agrandie.famille))} className="inline-flex min-h-[44px] items-center text-[14.5px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
                  Voir la fiche de {agrandie.nom}
                </Link>
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Lien href={lienEssayer(agrandie.id, "matieres")} onClick={aller(lienEssayer(agrandie.id, "matieres"))} plein>
                  Essayer sur ma photo
                </Lien>
                <Bouton variante="secondaire" plein aria-pressed={favoris.includes(agrandie.id)} onClick={() => basculerFavori(agrandie.id)}>
                  <span>
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
