export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">Politique de confidentialité</h1>
        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gris-300">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Collecte des données</h2>
            <p>Les données personnelles collectées via nos formulaires (nom, email, téléphone, photos) sont utilisées exclusivement pour traiter vos demandes de simulation et de devis.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Utilisation des données</h2>
            <p>Vos données sont traitées pour :</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Générer votre simulation IA personnalisée</li>
              <li>Vous contacter concernant votre projet</li>
              <li>Établir un devis adapté à vos besoins</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Conservation</h2>
            <p>Vos données sont conservées pendant une durée maximale de 3 ans à compter de votre dernière interaction avec CoverSwap.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Vos droits</h2>
            <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données. Contactez-nous à contact@coverswap.fr.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
