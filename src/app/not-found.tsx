import { Lien } from "@/components/simulation/Lien";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-fond px-4 py-[var(--espace-5)]">
      <div className="max-w-md text-center">
        <p className="surtitre">Erreur 404</p>
        <h1 className="titre-1 mt-2 text-encre">Page introuvable</h1>
        <p className="texte-2 mt-4">La page que vous recherchez n&apos;existe pas ou a été déplacée.</p>
        <div className="mt-8">
          <Lien href="/">Retour à l&apos;accueil</Lien>
        </div>
      </div>
    </div>
  );
}
