import { ENTREPRISE } from "@/lib/entreprise";
import { PRESTATIONS } from "@/data/prestations";
import { articles } from "@/data/blog-articles";
import { ZONES, getZoneSlug } from "@/data/zones";
import { DELAI_REPONSE, FOURCHETTES, GARANTIE_ANS, NB_REFERENCES, PRIX_EXPLICATION, PRIX_PLAGE, euros } from "@/lib/offre";

/**
 * /llms.txt — la fiche de l'entreprise pour les moteurs génératifs : ce que
 * nous faisons, pour qui, à quel prix, où, avec les pages à lire. Rien ici qui
 * ne soit déjà sur le site ; tout vient de la source unique.
 */
export const dynamic = "force-static";

export function GET() {
  const s = ENTREPRISE.site;
  const lignes = [
    `# ${ENTREPRISE.nom}`,
    "",
    `> Rénovation intérieure par covering adhésif (films Cover Styl') à ${ENTREPRISE.zone.principale}, ${ENTREPRISE.zone.departement}, et partout en ${ENTREPRISE.zone.etendue}. Entrepreneur individuel : ${ENTREPRISE.dirigeant}, ${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.codePostal} ${ENTREPRISE.adresse.ville}. SIRET ${ENTREPRISE.siret}.`,
    "",
    "## Ce que nous faisons",
    "",
    "Nous recouvrons des surfaces existantes — façades de cuisine, plans de travail, crédences, carrelage mural de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels, vitrages — d'un film adhésif texturé posé à chaud, sans démontage ni gravats. Le film se retire sans abîmer le support. Pose en sous-traitance pour cuisinistes, agenceurs et entreprises générales.",
    "",
    "## Faits vérifiables",
    "",
    `- Prix : au mètre linéaire de film posé (jamais au mètre carré), fourni et posé, ${PRIX_PLAGE}. ${PRIX_EXPLICATION} Ordres de grandeur par projet : cuisine complète ${euros(FOURCHETTES.cuisine.min)} à ${euros(FOURCHETTES.cuisine.max)} ; salle de bain ${euros(FOURCHETTES.sdb.min)} à ${euros(FOURCHETTES.sdb.max)} ; meuble seul dès ${euros(FOURCHETTES.meuble.min)} ; locaux professionnels sur devis. ${ENTREPRISE.tvaMention}.`,
    `- Délais : devis gratuit ${DELAI_REPONSE} ; pose en une journée pour une cuisine ou une salle de bain courante ; pièce utilisable le soir même.`,
    `- Garantie : ${GARANTIE_ANS} ans sur les films et la pose (décollement, décoloration en usage normal).`,
    `- Matériaux : films Cover Styl', ${NB_REFERENCES} références (bois, pierre, béton, couleurs unies, métal, textile, paillettes), résistants à l'humidité et au nettoyage courant ; retrait à chaud sans trace.`,
    `- Simulateur : rendu sur la photo du visiteur en moins d'une minute, gratuit, sans inscription : ${s}/simulateur`,
    `- Contact : ${ENTREPRISE.telephone}, ${ENTREPRISE.email}, ${ENTREPRISE.horaires.jours} ${ENTREPRISE.horaires.heures}.`,
    "",
    "## Prestations",
    "",
    ...PRESTATIONS.map((p) => `- [${p.nom}](${s}/prestations/${p.slug}) : ${p.accroche}`),
    "",
    "## Guides",
    "",
    ...articles.map((a) => `- [${a.title}](${s}/blog/${a.slug}) : ${a.excerpt}`),
    "",
    "## Zones d'intervention",
    "",
    ...ZONES.map((z) => `- [${z.ville}](${s}/zones/${getZoneSlug(z)})`),
    "",
    "## Autres pages",
    "",
    `- [Devis gratuit](${s}/devis)`,
    `- [Réalisations et avis](${s}/realisations)`,
    `- [Catalogue Cover Styl'](${s}/revetements)`,
    `- [Questions fréquentes](${s}/#faq)`,
    `- [Conditions générales de vente](${s}/cgv) · [Politique de confidentialité](${s}/politique-confidentialite) · [Mentions légales](${s}/mentions-legales)`,
    "",
  ];
  return new Response(lignes.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
