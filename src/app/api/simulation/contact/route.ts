import { NextRequest, NextResponse } from "next/server";
import { MESSAGE_ECHEC_TOTAL, sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { getProject } from "@/lib/simulateur/projets";
import { validerContactSimulation } from "./validation";

/**
 * POST /api/simulation/contact — après le résultat du simulateur, la personne
 * laisse ses coordonnées : le lead est créé dans le CRM, ses simulations du
 * parcours (gardées côté CRM, désignées par identifiant et par parcours) lui
 * sont rattachées. Si la génération n'a pas abouti, la demande part quand même,
 * avec la photo et les finitions choisies : la simulation sera faite à la main.
 * Mission 15 : plus de rendu en base64 côté site (le chemin de secours Vercel
 * n'existe plus).
 *
 * Mission 16 (partie 4) : prénom et téléphone suffisent (e-mail facultatif) ;
 * partent aussi la fourchette vue et sa taille, le créneau de rappel choisi,
 * l'origine de la visite et la page d'entrée (`validation.ts`). La réponse porte
 * `lienEspace` — l'espace que le CRM vient d'ouvrir, que le navigateur AFFICHE :
 * le site n'envoie rien — et `rappelLe`, le rappel daté par le CRM. Le CRM n'ouvre
 * l'espace que si la demande porte `afficherLienEspace` (formulaire après un rendu ;
 * jamais la demande après un échec, dont l'écran ne montre pas de lien).
 * Relecture des phases D, E, F : `exemple` (pièce d'exemple du site) part au CRM ; sa photo jamais comme celle du visiteur.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ success: true });

  const validation = validerContactSimulation(body);
  if (!validation.ok) return NextResponse.json({ error: validation.erreur }, { status: 400 });
  const c = validation.contact;

  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });

  // Un seul mot (le prénom) : le CRM le prend aussi pour nom.
  const { prenom, nom: nomFamille } = splitName(c.nom);
  const projet = getProject(c.projet ?? "cuisine");

  const resultat = await sendLeadToCRM(
    {
      prenom,
      nom: nomFamille,
      telephone: c.telephone,
      email: c.email,
      ville: c.ville,
      codePostal: c.codePostal,
      source: "SITE_SIMULATEUR",
      typeProjet: projet.crmTypeProjet as CrmTypeProjet,
      referenceChoisie: c.referenceChoisie,
      message: typeof body.message === "string" ? body.message.trim().slice(0, 4000) || undefined : undefined,
      parcoursId: c.parcoursId,
      simulationIds: c.simulationIds,
      notes: c.echec
        ? `SIMULATION À RÉALISER À LA MAIN — la génération n'a pas abouti sur le site (${c.echec}). Projet ${projet.id}${c.references ? ` : ${c.references}` : ""}. ${c.exemple ? `Essai sur la pièce d'exemple ${c.exemple} : aucune photo du visiteur, la lui demander.` : c.photoAvant ? "Photo du visiteur jointe." : "Photo non transmise."}`
        : c.references
          ? `Simulation ${projet.id} : ${c.references}`
          : `Simulation ${projet.id}`,
      // Génération non aboutie (crédit épuisé, panne, photo refusée) : la photo du visiteur part avec sa demande. ~6 Mo au plus.
      photos: c.photoAvant && c.echec && !c.exemple ? [c.photoAvant] : undefined,
      // Relecture D, E, F : le CRM marque la simulation « pièce d'exemple » (un CRM d'avant ignore le champ).
      exemple: c.exemple,
      campagne: c.campagne,
      publicite: c.publicite,
      formulaire: c.formulaire,
      canal: c.canal,
      pageEntree: c.pageEntree,
      estimationMin: c.estimationMin,
      estimationMax: c.estimationMax,
      formatPiece: c.formatPiece,
      rappelCreneau: c.rappelCreneau,
      afficherLienEspace: c.afficherLienEspace,
      ...(c.consentementMail !== undefined ? { consentementMail: c.consentementMail, consentementTexte: c.consentementTexte } : {}),
    },
    { ipVisiteur: ip }
  );

  if (resultat.ok) {
    return NextResponse.json({ success: true, leadId: resultat.leadId ?? null, simulations: resultat.simulations ?? 0, photos: resultat.photos ?? 0, consentement: resultat.consentement ?? null, lienEspace: resultat.lienEspace ?? null, rappelLe: resultat.rappelLe ?? null });
  }
  if (resultat.emailFallback) return NextResponse.json({ success: true, leadId: null, viaMail: true, lienEspace: null, rappelLe: null });
  return NextResponse.json({ error: MESSAGE_ECHEC_TOTAL, reason: resultat.error }, { status: 502 });
}
