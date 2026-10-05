import { classeTexteTeinte, styleTeinte, type FondTexte, type TeintePrestation } from "@/lib/teintes-prestations";

/**
 * Le grand numéro d'une étape (« 01 », « 02 »…), site 3.0, lot B3 : Playfair 900 en 64 px (`.grand-numero`).
 * À l'encre (au papier sur un bloc encre), ou à la teinte de la prestation quand elle y tient 4,5:1
 * (`texteAutorise` de `lib/teintes-prestations`). JAMAIS le rouge, réservé aux actions : un numéro n'est pas un
 * bouton (testé). Décoratif (`aria-hidden`) : la liste ordonnée qui le porte dit déjà l'ordre aux lecteurs d'écran.
 * Un nombre est écrit sur deux chiffres (3 → « 03 »). Composant serveur.
 */
export function GrandNumero({ valeur, teinte, sur = "papier", className }: { valeur: number | string; teinte?: TeintePrestation | null; sur?: FondTexte; className?: string }) {
  const texte = typeof valeur === "number" ? String(valeur).padStart(2, "0") : valeur;
  return (
    <span className={`grand-numero ${classeTexteTeinte(teinte, sur)}${className ? ` ${className}` : ""}`} aria-hidden="true" style={styleTeinte(teinte)}>
      {texte}
    </span>
  );
}
