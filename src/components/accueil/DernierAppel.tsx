import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { BoutonWhatsApp } from "./BoutonWhatsApp";
import { FormulaireRappel } from "./FormulaireRappel";
import { ANCRES_ACCUEIL, TITRE_ACCUEIL, lienSimulerAccueil } from "./sections";

/**
 * Le dernier appel (mission 16, partie 3 ; site 3.0, lot B6) : la promesse de l'ouverture, en bloc ENCRE (jamais
 * rouge) ; le bouton principal rouge « Simuler ma pièce » (`depuis=accueil-final`), puis deux secondaires posés sur
 * l'encre (`sur-encre`) : « Être rappelé » (la feuille de rappel) et « Écrire sur WhatsApp ». Composant serveur (le
 * rappel et le clic WhatsApp sont clients).
 */
export function DernierAppel() {
  return (
    <Section id={ANCRES_ACCUEIL.dernierAppel} large differee ton="encre" titre={TITRE_ACCUEIL} intro="Une photo de votre pièce suffit pour commencer. Gratuit, sans e-mail ni téléphone.">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Lien href={lienSimulerAccueil("accueil-final")}>Simuler ma pièce</Lien>
        <FormulaireRappel depuis="accueil-final" variante="sur-encre" />
        <BoutonWhatsApp depuis="accueil-final" variante="sur-encre" />
      </div>
    </Section>
  );
}
