import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { BoutonWhatsApp } from "./BoutonWhatsApp";
import { ANCRES_ACCUEIL, TITRE_ACCUEIL, lienSimulerCuisine } from "./sections";

/**
 * 8. Dernier appel (mission 16, partie 3) : la phrase de l'ouverture, le même
 * bouton principal, WhatsApp en secondaire. Composant serveur (seul le bouton
 * WhatsApp est client, pour compter le clic).
 */
export function DernierAppel() {
  return (
    <Section id={ANCRES_ACCUEIL.dernierAppel} differee fond="fond-2" titre={TITRE_ACCUEIL}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Lien href={lienSimulerCuisine("accueil-final")}>Simuler ma cuisine</Lien>
        <BoutonWhatsApp depuis="accueil-final" />
      </div>
    </Section>
  );
}
