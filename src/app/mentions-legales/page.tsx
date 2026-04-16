export default function MentionsLegales() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">Mentions légales</h1>
        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gris-300">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Éditeur du site</h2>
            <p>CoverSwap<br />Auto-entrepreneur<br />SIRET : 94518036200010 | APE : 4334Z<br />73 rue Simone Veil, 34470 Pérols<br />contact@coverswap.fr<br />06 70 35 28 69</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Directeur de la publication</h2>
            <p>Lucas Villemin</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Hébergement</h2>
            <p>Vercel Inc.<br />440 N Barranca Ave #4133<br />Covina, CA 91723, États-Unis</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Propriété intellectuelle</h2>
            <p>L&apos;ensemble du contenu de ce site (textes, images, vidéos, logos) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
