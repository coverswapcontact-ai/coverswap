/**
 * L'entreprise : identité, coordonnées, horaires, réseaux, zone d'intervention.
 * Seule source pour tout ce que le site affirme sur CoverSwap ; les pages,
 * le pied de page, les pages légales et le balisage JSON-LD lisent ici.
 */
export const ENTREPRISE = {
  nom: "CoverSwap",
  formeJuridique: "Entrepreneur individuel",
  dirigeant: "Lucas Villemin",
  siret: "94518036200010",
  ape: "4334Z",
  tvaMention: "TVA non applicable, article 293 B du CGI",
  adresse: { rue: "73 rue Simone Veil", codePostal: "34470", ville: "Pérols", region: "Occitanie", pays: "France" },
  geo: { lat: 43.5567, lng: 3.9514 },
  telephone: "06 70 35 28 69",
  telephoneInternational: "+33670352869",
  email: "contact@coverswap.fr",
  site: "https://coverswap.fr",
  /** Lundi au vendredi, 8 h – 17 h ; week-end fermé. */
  horaires: { jours: "Lundi – vendredi", heures: "8 h – 17 h", ouverture: "08:00", fermeture: "17:00", joursIso: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  reseaux: {
    instagram: "https://www.instagram.com/cover.swap/",
    facebook: "https://www.facebook.com/coverswap",
    tiktok: "https://www.tiktok.com/@cover.swap",
    whatsapp: "https://wa.me/33670352869",
  },
  /** Fournisseur des films posés. */
  fournisseur: { marque: "Cover Styl'", distributeur: "Tego France" },
  /** Zone principale : Montpellier et sa métropole ; déplacements sur devis partout en France métropolitaine. */
  zone: { principale: "Montpellier et sa métropole", departement: "Hérault", etendue: "France métropolitaine, sur devis" },
} as const;

export const ADRESSE_LIGNE = `${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.codePostal} ${ENTREPRISE.adresse.ville}`;

/** Compatibilité avec l'ancien `SITE` de lib/constants. */
export const SITE = {
  name: ENTREPRISE.nom,
  tagline: "Rénover sans casser",
  url: ENTREPRISE.site,
  email: ENTREPRISE.email,
  phone: ENTREPRISE.telephone,
  address: ADRESSE_LIGNE,
  siret: ENTREPRISE.siret,
  ape: ENTREPRISE.ape,
  owner: ENTREPRISE.dirigeant,
} as const;
