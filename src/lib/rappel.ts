/**
 * « Être rappelé » (mission 16, partie 4) : trois créneaux proposés après le rendu — « Ce soir 18 h »,
 * « Demain 10 h », « Demain 18 h » —, en heure de Paris quel que soit le fuseau du téléphone. Les règles sont celles
 * du CRM (`crm/src/lib/commercial/quand.ts › rappelDuCreneau`), qui date le rappel à la réception : « ce soir » après
 * 17 h 30 devient demain 18 h ; un samedi ou un dimanche passe au lundi, même heure. Le site n'envoie que le CODE du
 * créneau ; il calcule ici les libellés (« Lundi 10 h » le week-end) et la phrase de confirmation. Pur, sans DOM.
 */

export const CRENEAUX_RAPPEL = ["ce-soir-18h", "demain-10h", "demain-18h"] as const;
export type CreneauRappel = (typeof CRENEAUX_RAPPEL)[number];
export type OptionRappel = { code: CreneauRappel; libelle: string; le: Date };

export function estCreneauRappel(valeur: unknown): valeur is CreneauRappel {
  return typeof valeur === "string" && (CRENEAUX_RAPPEL as readonly string[]).includes(valeur);
}

const PARTIES_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

type HeureMurale = { annee: number; mois: number; jour: number; heure: number; minute: number; seconde: number };

/** Ce qu'affiche une horloge de Paris à cet instant. */
function murale(instant: Date): HeureMurale {
  const parties = PARTIES_PARIS.formatToParts(instant);
  const valeur = (type: Intl.DateTimeFormatPartTypes) => Number(parties.find((p) => p.type === type)?.value ?? "0");
  return { annee: valeur("year"), mois: valeur("month"), jour: valeur("day"), heure: valeur("hour") % 24, minute: valeur("minute"), seconde: valeur("second") };
}

function decalageParis(instant: Date): number {
  const m = murale(instant);
  return Date.UTC(m.annee, m.mois - 1, m.jour, m.heure, m.minute, m.seconde) - Math.floor(instant.getTime() / 1000) * 1000;
}

/** « J+n à HH:MM, heure de Paris », J étant le jour de `maintenant` à Paris (la même fonction que le CRM). */
export function aHeureParis(maintenant: Date, joursPlusTard: number, heure: number, minute = 0): Date {
  const m = murale(maintenant);
  const voulue = Date.UTC(m.annee, m.mois - 1, m.jour + joursPlusTard, heure, minute);
  const essai = voulue - decalageParis(new Date(voulue));
  return new Date(voulue - decalageParis(new Date(essai)));
}

/** L'instant du rappel pour ce créneau (mêmes règles que le CRM). */
export function rappelDuCreneau(creneau: CreneauRappel, maintenant: Date): Date {
  const limite = aHeureParis(maintenant, 0, 17, 30);
  const [jours, heure] = creneau === "ce-soir-18h" ? [maintenant.getTime() < limite.getTime() ? 0 : 1, 18] : creneau === "demain-10h" ? [1, 10] : [1, 18];
  const m = murale(maintenant);
  const jourSemaine = new Date(Date.UTC(m.annee, m.mois - 1, m.jour + jours)).getUTCDay();
  return aHeureParis(maintenant, jours + (jourSemaine === 6 ? 2 : jourSemaine === 0 ? 1 : 0), heure);
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Le jour et l'heure d'un rappel, en mots : `{ jour: "demain", heure: "10 h" }` ; « ce soir » pour ce soir. */
function enMots(le: Date, maintenant: Date): { jour: string; heure: string } {
  const vise = murale(le);
  const aujourdhui = murale(maintenant);
  const jourVise = Date.UTC(vise.annee, vise.mois - 1, vise.jour);
  const ecart = Math.round((jourVise - Date.UTC(aujourdhui.annee, aujourdhui.mois - 1, aujourdhui.jour)) / 86_400_000);
  const heure = `${vise.heure} h${vise.minute ? ` ${String(vise.minute).padStart(2, "0")}` : ""}`;
  const jour = ecart === 0 ? (vise.heure >= 18 ? "ce soir" : "aujourd'hui") : ecart === 1 ? "demain" : JOURS[new Date(jourVise).getUTCDay()];
  return { jour, heure };
}

/** « Ce soir 18 h », « Demain 10 h », « Lundi 10 h » : le libellé du bouton. */
export function libelleRappel(le: Date, maintenant: Date): string {
  const { jour, heure } = enMots(le, maintenant);
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${heure}`;
}

/** « Lucas vous appelle demain à 10 h. » : la confirmation, après l'envoi. */
export function phraseRappel(le: Date, maintenant: Date): string {
  const { jour, heure } = enMots(le, maintenant);
  return `Lucas vous appelle ${jour} à ${heure}.`;
}

/**
 * Les créneaux à proposer maintenant, dans l'ordre du temps. Deux codes qui tombent au même instant (samedi : « ce
 * soir » et « demain 18 h » donnent tous deux lundi 18 h ; après 17 h 30 : demain 18 h deux fois) ne font qu'un
 * bouton : le premier code est gardé, le CRM les date pareil.
 */
export function creneauxRappel(maintenant: Date): OptionRappel[] {
  const vus = new Set<number>();
  const options: OptionRappel[] = [];
  for (const code of CRENEAUX_RAPPEL) {
    const le = rappelDuCreneau(code, maintenant);
    if (vus.has(le.getTime())) continue;
    vus.add(le.getTime());
    options.push({ code, libelle: libelleRappel(le, maintenant), le });
  }
  return options.sort((a, b) => a.le.getTime() - b.le.getTime());
}
