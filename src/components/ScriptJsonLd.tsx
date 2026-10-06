/**
 * Un bloc JSON-LD (`<script type="application/ld+json">`), sans dépendance : `JsonLd.tsx` (le balisage du site) et les
 * composants qui posent leur propre `ImageObject` (`CarteAmbiance`, `CarteRealisation`…) le partagent.
 */
export function Script({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Site 3.0 (lot B6) : une donnée structurée déjà écrite par la page (l'`ImageObject` d'une ouverture) ; rien si `null`. */
export function DonneesStructurees({ data }: { data: Record<string, unknown> | null }) {
  return data ? <Script data={data} /> : null;
}
