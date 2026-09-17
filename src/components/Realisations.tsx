import Link from "next/link";
import { ENTREPRISE } from "@/lib/entreprise";
import { chargerPublications, libelleProjet, type Publication } from "@/lib/publications";

/**
 * Réalisations (photos après chantier, éventuellement avant) et avis clients
 * publiés depuis le CRM. Sur l'accueil (`apercu`), la section n'existe que s'il
 * y a quelque chose à montrer : pas de vitrine vide, pas de photo d'illustration
 * présentée comme un chantier.
 */
function Etoiles({ note }: { note: number }) {
  return (
    <span aria-label={`${note} sur 5`} className="text-rouge tracking-tight">
      {"★".repeat(note)}
      <span className="text-white/20">{"★".repeat(5 - note)}</span>
    </span>
  );
}

function CarteRealisation({ p }: { p: Publication }) {
  const legende = [libelleProjet(p.typeProjet), p.ville].filter(Boolean).join(" · ");
  return (
    <article className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
      <div className={`grid ${p.photoAvant ? "grid-cols-2" : "grid-cols-1"} gap-px bg-white/10`}>
        {p.photoAvant ? (
          <figure className="relative aspect-4/3 bg-gris-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photoAvant} alt={`Avant — ${p.titre}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <figcaption className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">Avant</figcaption>
          </figure>
        ) : null}
        <figure className="relative aspect-4/3 bg-gris-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photoApres ?? ""} alt={`Après — ${p.titre}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <figcaption className="absolute top-2 left-2 rounded-full bg-rouge px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">Après</figcaption>
        </figure>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold">{p.titre}</h3>
        {legende ? <p className="text-xs text-gris-500 mt-0.5">{legende}</p> : null}
        {p.texte ? <p className="text-sm text-gris-400 mt-2 leading-relaxed">{p.texte}</p> : null}
      </div>
    </article>
  );
}

function CarteAvis({ p }: { p: Publication }) {
  return (
    <blockquote className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {p.note ? <Etoiles note={p.note} /> : null}
      <p className="text-gris-200 leading-relaxed mt-2">« {p.texte} »</p>
      <footer className="text-xs text-gris-500 mt-3">
        {[p.auteur, p.ville, libelleProjet(p.typeProjet)].filter(Boolean).join(" · ")}
      </footer>
    </blockquote>
  );
}

export default async function Realisations({ apercu = false }: { apercu?: boolean }) {
  const { realisations, avis } = await chargerPublications();
  if (apercu && realisations.length === 0 && avis.length === 0) return null;
  const listeRealisations = apercu ? realisations.slice(0, 3) : realisations;
  const listeAvis = apercu ? avis.slice(0, 3) : avis;

  return (
    <section className="section-padding pt-0 bg-noir">
      <div className="container-custom space-y-10">
        {listeRealisations.length > 0 ? (
          <div>
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="font-display text-3xl sm:text-4xl font-bold">{apercu ? "Nos dernières réalisations" : "Réalisations"}</h2>
              {apercu ? (
                <Link href="/realisations" className="text-sm text-gris-400 hover:text-white transition-colors shrink-0">
                  Toutes les réalisations →
                </Link>
              ) : null}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listeRealisations.map((p) => (
                <CarteRealisation key={p.id} p={p} />
              ))}
            </div>
          </div>
        ) : !apercu ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="font-display text-2xl font-bold mb-2">Les premières réalisations arrivent</h2>
            <p className="text-gris-400 max-w-xl mx-auto">
              Chaque chantier terminé est photographié ; les photos paraissent ici avec l&apos;accord des clients. En attendant, nos poses sont visibles sur{" "}
              <a href={ENTREPRISE.reseaux.instagram} target="_blank" rel="noopener noreferrer" className="text-rouge underline hover:text-white">
                Instagram
              </a>
              .
            </p>
          </div>
        ) : null}
        {listeAvis.length > 0 ? (
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">{apercu ? "Ils l'ont fait" : "Avis clients"}</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {listeAvis.map((p) => (
                <CarteAvis key={p.id} p={p} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
