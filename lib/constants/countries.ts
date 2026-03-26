// lib/constants/countries.ts
export interface Country {
  code: string
  name: string
  nameEn: string
  nameFr: string
  nameMg: string
  flag: string
  dialCode: string
  continent: string
}

export const COUNTRIES: Country[] = [
  // Afrique
  { code: "MG", name: "Madagascar", nameEn: "Madagascar", nameFr: "Madagascar", nameMg: "Madagasikara", flag: "🇲🇬", dialCode: "+261", continent: "Africa" },
  { code: "ZA", name: "Afrique du Sud", nameEn: "South Africa", nameFr: "Afrique du Sud", nameMg: "Afrika Atsimo", flag: "🇿🇦", dialCode: "+27", continent: "Africa" },
  { code: "NG", name: "Nigeria", nameEn: "Nigeria", nameFr: "Nigéria", nameMg: "Nizeria", flag: "🇳🇬", dialCode: "+234", continent: "Africa" },
  { code: "KE", name: "Kenya", nameEn: "Kenya", nameFr: "Kenya", nameMg: "Kenya", flag: "🇰🇪", dialCode: "+254", continent: "Africa" },
  { code: "SN", name: "Sénégal", nameEn: "Senegal", nameFr: "Sénégal", nameMg: "Senegaly", flag: "🇸🇳", dialCode: "+221", continent: "Africa" },
  { code: "CI", name: "Côte d'Ivoire", nameEn: "Ivory Coast", nameFr: "Côte d'Ivoire", nameMg: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", continent: "Africa" },
  { code: "CM", name: "Cameroun", nameEn: "Cameroon", nameFr: "Cameroun", nameMg: "Kamerona", flag: "🇨🇲", dialCode: "+237", continent: "Africa" },
  { code: "MA", name: "Maroc", nameEn: "Morocco", nameFr: "Maroc", nameMg: "Maroka", flag: "🇲🇦", dialCode: "+212", continent: "Africa" },
  { code: "TN", name: "Tunisie", nameEn: "Tunisia", nameFr: "Tunisie", nameMg: "Tonizia", flag: "🇹🇳", dialCode: "+216", continent: "Africa" },
  { code: "DZ", name: "Algérie", nameEn: "Algeria", nameFr: "Algérie", nameMg: "Alzeria", flag: "🇩🇿", dialCode: "+213", continent: "Africa" },
  { code: "EG", name: "Égypte", nameEn: "Egypt", nameFr: "Égypte", nameMg: "Ejipta", flag: "🇪🇬", dialCode: "+20", continent: "Africa" },
  { code: "GH", name: "Ghana", nameEn: "Ghana", nameFr: "Ghana", nameMg: "Gana", flag: "🇬🇭", dialCode: "+233", continent: "Africa" },
  { code: "UG", name: "Ouganda", nameEn: "Uganda", nameFr: "Ouganda", nameMg: "Oganda", flag: "🇺🇬", dialCode: "+256", continent: "Africa" },
  { code: "RW", name: "Rwanda", nameEn: "Rwanda", nameFr: "Rwanda", nameMg: "Roanda", flag: "🇷🇼", dialCode: "+250", continent: "Africa" },
  { code: "BJ", name: "Bénin", nameEn: "Benin", nameFr: "Bénin", nameMg: "Benin", flag: "🇧🇯", dialCode: "+229", continent: "Africa" },
  { code: "BF", name: "Burkina Faso", nameEn: "Burkina Faso", nameFr: "Burkina Faso", nameMg: "Burkina Faso", flag: "🇧🇫", dialCode: "+226", continent: "Africa" },
  { code: "MU", name: "Maurice", nameEn: "Mauritius", nameFr: "Maurice", nameMg: "Maorisy", flag: "🇲🇺", dialCode: "+230", continent: "Africa" },
  { code: "RE", name: "La Réunion", nameEn: "Reunion", nameFr: "La Réunion", nameMg: "Larénion", flag: "🇷🇪", dialCode: "+262", continent: "Africa" },
  { code: "KM", name: "Comores", nameEn: "Comoros", nameFr: "Comores", nameMg: "Komoro", flag: "🇰🇲", dialCode: "+269", continent: "Africa" },
  { code: "SC", name: "Seychelles", nameEn: "Seychelles", nameFr: "Seychelles", nameMg: "Sechela", flag: "🇸🇨", dialCode: "+248", continent: "Africa" },
  
  // Europe
  { code: "FR", name: "France", nameEn: "France", nameFr: "France", nameMg: "Frantsa", flag: "🇫🇷", dialCode: "+33", continent: "Europe" },
  { code: "BE", name: "Belgique", nameEn: "Belgium", nameFr: "Belgique", nameMg: "Belzika", flag: "🇧🇪", dialCode: "+32", continent: "Europe" },
  { code: "CH", name: "Suisse", nameEn: "Switzerland", nameFr: "Suisse", nameMg: "Soisa", flag: "🇨🇭", dialCode: "+41", continent: "Europe" },
  { code: "LU", name: "Luxembourg", nameEn: "Luxembourg", nameFr: "Luxembourg", nameMg: "Losamborga", flag: "🇱🇺", dialCode: "+352", continent: "Europe" },
  { code: "MC", name: "Monaco", nameEn: "Monaco", nameFr: "Monaco", nameMg: "Monako", flag: "🇲🇨", dialCode: "+377", continent: "Europe" },
  { code: "GB", name: "Royaume-Uni", nameEn: "United Kingdom", nameFr: "Royaume-Uni", nameMg: "Fanjakana Mitambatra", flag: "🇬🇧", dialCode: "+44", continent: "Europe" },
  { code: "DE", name: "Allemagne", nameEn: "Germany", nameFr: "Allemagne", nameMg: "Alemaina", flag: "🇩🇪", dialCode: "+49", continent: "Europe" },
  { code: "IT", name: "Italie", nameEn: "Italy", nameFr: "Italie", nameMg: "Italia", flag: "🇮🇹", dialCode: "+39", continent: "Europe" },
  { code: "ES", name: "Espagne", nameEn: "Spain", nameFr: "Espagne", nameMg: "Espaina", flag: "🇪🇸", dialCode: "+34", continent: "Europe" },
  { code: "PT", name: "Portugal", nameEn: "Portugal", nameFr: "Portugal", nameMg: "Pôrtogaly", flag: "🇵🇹", dialCode: "+351", continent: "Europe" },
  { code: "NL", name: "Pays-Bas", nameEn: "Netherlands", nameFr: "Pays-Bas", nameMg: "Holanda", flag: "🇳🇱", dialCode: "+31", continent: "Europe" },
  { code: "SE", name: "Suède", nameEn: "Sweden", nameFr: "Suède", nameMg: "Soeda", flag: "🇸🇪", dialCode: "+46", continent: "Europe" },
  { code: "NO", name: "Norvège", nameEn: "Norway", nameFr: "Norvège", nameMg: "Nôrvezy", flag: "🇳🇴", dialCode: "+47", continent: "Europe" },
  { code: "DK", name: "Danemark", nameEn: "Denmark", nameFr: "Danemark", nameMg: "Danemarka", flag: "🇩🇰", dialCode: "+45", continent: "Europe" },
  { code: "FI", name: "Finlande", nameEn: "Finland", nameFr: "Finlande", nameMg: "Finlandy", flag: "🇫🇮", dialCode: "+358", continent: "Europe" },
  { code: "IE", name: "Irlande", nameEn: "Ireland", nameFr: "Irlande", nameMg: "Irlandy", flag: "🇮🇪", dialCode: "+353", continent: "Europe" },
  { code: "AT", name: "Autriche", nameEn: "Austria", nameFr: "Autriche", nameMg: "Aotrisy", flag: "🇦🇹", dialCode: "+43", continent: "Europe" },
  { code: "PL", name: "Pologne", nameEn: "Poland", nameFr: "Pologne", nameMg: "Pôlôna", flag: "🇵🇱", dialCode: "+48", continent: "Europe" },
  { code: "CZ", name: "République tchèque", nameEn: "Czech Republic", nameFr: "République tchèque", nameMg: "Tsekia", flag: "🇨🇿", dialCode: "+420", continent: "Europe" },
  { code: "HU", name: "Hongrie", nameEn: "Hungary", nameFr: "Hongrie", nameMg: "Hongria", flag: "🇭🇺", dialCode: "+36", continent: "Europe" },
  
  // Amérique du Nord
  { code: "US", name: "États-Unis", nameEn: "United States", nameFr: "États-Unis", nameMg: "Etazonia", flag: "🇺🇸", dialCode: "+1", continent: "North America" },
  { code: "CA", name: "Canada", nameEn: "Canada", nameFr: "Canada", nameMg: "Kanada", flag: "🇨🇦", dialCode: "+1", continent: "North America" },
  { code: "MX", name: "Mexique", nameEn: "Mexico", nameFr: "Mexique", nameMg: "Meksika", flag: "🇲🇽", dialCode: "+52", continent: "North America" },
  
  // Amérique du Sud
  { code: "BR", name: "Brésil", nameEn: "Brazil", nameFr: "Brésil", nameMg: "Brezila", flag: "🇧🇷", dialCode: "+55", continent: "South America" },
  { code: "AR", name: "Argentine", nameEn: "Argentina", nameFr: "Argentine", nameMg: "Arzantina", flag: "🇦🇷", dialCode: "+54", continent: "South America" },
  { code: "CL", name: "Chili", nameEn: "Chile", nameFr: "Chili", nameMg: "Silia", flag: "🇨🇱", dialCode: "+56", continent: "South America" },
  { code: "CO", name: "Colombie", nameEn: "Colombia", nameFr: "Colombie", nameMg: "Kôlômbia", flag: "🇨🇴", dialCode: "+57", continent: "South America" },
  { code: "PE", name: "Pérou", nameEn: "Peru", nameFr: "Pérou", nameMg: "Pero", flag: "🇵🇪", dialCode: "+51", continent: "South America" },
  
  // Asie
  { code: "CN", name: "Chine", nameEn: "China", nameFr: "Chine", nameMg: "Sina", flag: "🇨🇳", dialCode: "+86", continent: "Asia" },
  { code: "JP", name: "Japon", nameEn: "Japan", nameFr: "Japon", nameMg: "Japana", flag: "🇯🇵", dialCode: "+81", continent: "Asia" },
  { code: "KR", name: "Corée du Sud", nameEn: "South Korea", nameFr: "Corée du Sud", nameMg: "Korea Atsimo", flag: "🇰🇷", dialCode: "+82", continent: "Asia" },
  { code: "IN", name: "Inde", nameEn: "India", nameFr: "Inde", nameMg: "India", flag: "🇮🇳", dialCode: "+91", continent: "Asia" },
  { code: "ID", name: "Indonésie", nameEn: "Indonesia", nameFr: "Indonésie", nameMg: "Indonezia", flag: "🇮🇩", dialCode: "+62", continent: "Asia" },
  { code: "MY", name: "Malaisie", nameEn: "Malaysia", nameFr: "Malaisie", nameMg: "Malaizia", flag: "🇲🇾", dialCode: "+60", continent: "Asia" },
  { code: "SG", name: "Singapour", nameEn: "Singapore", nameFr: "Singapour", nameMg: "Singaporo", flag: "🇸🇬", dialCode: "+65", continent: "Asia" },
  { code: "TH", name: "Thaïlande", nameEn: "Thailand", nameFr: "Thaïlande", nameMg: "Tailandy", flag: "🇹🇭", dialCode: "+66", continent: "Asia" },
  { code: "VN", name: "Vietnam", nameEn: "Vietnam", nameFr: "Vietnam", nameMg: "Vietnam", flag: "🇻🇳", dialCode: "+84", continent: "Asia" },
  { code: "PH", name: "Philippines", nameEn: "Philippines", nameFr: "Philippines", nameMg: "Filipina", flag: "🇵🇭", dialCode: "+63", continent: "Asia" },
  
  // Océanie
  { code: "AU", name: "Australie", nameEn: "Australia", nameFr: "Australie", nameMg: "Aostralia", flag: "🇦🇺", dialCode: "+61", continent: "Oceania" },
  { code: "NZ", name: "Nouvelle-Zélande", nameEn: "New Zealand", nameFr: "Nouvelle-Zélande", nameMg: "Nouvelle Zélande", flag: "🇳🇿", dialCode: "+64", continent: "Oceania" },
  
  // Moyen-Orient
  { code: "AE", name: "Émirats arabes unis", nameEn: "United Arab Emirates", nameFr: "Émirats arabes unis", nameMg: "Emirà Arabo Mitambatra", flag: "🇦🇪", dialCode: "+971", continent: "Asia" },
  { code: "SA", name: "Arabie saoudite", nameEn: "Saudi Arabia", nameFr: "Arabie saoudite", nameMg: "Arabia Saodita", flag: "🇸🇦", dialCode: "+966", continent: "Asia" },
  { code: "IL", name: "Israël", nameEn: "Israel", nameFr: "Israël", nameMg: "Israely", flag: "🇮🇱", dialCode: "+972", continent: "Asia" },
  { code: "TR", name: "Turquie", nameEn: "Turkey", nameFr: "Turquie", nameMg: "Torkia", flag: "🇹🇷", dialCode: "+90", continent: "Asia" },
]

// Fonction utilitaire pour obtenir le nom du pays selon la langue
export function getCountryName(country: Country, lang: string): string {
  switch (lang) {
    case 'fr':
      return country.nameFr
    case 'mg':
      return country.nameMg
    default:
      return country.nameEn
  }
}

// Grouper les pays par continent
export const COUNTRIES_BY_CONTINENT = COUNTRIES.reduce((acc, country) => {
  if (!acc[country.continent]) {
    acc[country.continent] = []
  }
  acc[country.continent].push(country)
  return acc
}, {} as Record<string, Country[]>)

// Pays populaires (pour affichage rapide)
export const POPULAR_COUNTRIES = [
  { code: "MG", flag: "🇲🇬", name: "Madagascar" },
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "US", flag: "🇺🇸", name: "USA" },
  { code: "GB", flag: "🇬🇧", name: "UK" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "SN", flag: "🇸🇳", name: "Senegal" },
  { code: "CI", flag: "🇨🇮", name: "Ivory Coast" },
]