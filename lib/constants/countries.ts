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
  // Afrique (54 pays)
  { code: "DZ", name: "Algérie", nameEn: "Algeria", nameFr: "Algérie", nameMg: "Alzeria", flag: "🇩🇿", dialCode: "+213", continent: "Africa" },
  { code: "AO", name: "Angola", nameEn: "Angola", nameFr: "Angola", nameMg: "Angola", flag: "🇦🇴", dialCode: "+244", continent: "Africa" },
  { code: "BJ", name: "Bénin", nameEn: "Benin", nameFr: "Bénin", nameMg: "Benin", flag: "🇧🇯", dialCode: "+229", continent: "Africa" },
  { code: "BW", name: "Botswana", nameEn: "Botswana", nameFr: "Botswana", nameMg: "Botsoana", flag: "🇧🇼", dialCode: "+267", continent: "Africa" },
  { code: "BF", name: "Burkina Faso", nameEn: "Burkina Faso", nameFr: "Burkina Faso", nameMg: "Burkina Faso", flag: "🇧🇫", dialCode: "+226", continent: "Africa" },
  { code: "BI", name: "Burundi", nameEn: "Burundi", nameFr: "Burundi", nameMg: "Borondi", flag: "🇧🇮", dialCode: "+257", continent: "Africa" },
  { code: "CM", name: "Cameroun", nameEn: "Cameroon", nameFr: "Cameroun", nameMg: "Kamerona", flag: "🇨🇲", dialCode: "+237", continent: "Africa" },
  { code: "CV", name: "Cap-Vert", nameEn: "Cape Verde", nameFr: "Cap-Vert", nameMg: "Cape Verde", flag: "🇨🇻", dialCode: "+238", continent: "Africa" },
  { code: "CF", name: "République centrafricaine", nameEn: "Central African Republic", nameFr: "République centrafricaine", nameMg: "Repoblika Afrika Afovoany", flag: "🇨🇫", dialCode: "+236", continent: "Africa" },
  { code: "TD", name: "Tchad", nameEn: "Chad", nameFr: "Tchad", nameMg: "Tsady", flag: "🇹🇩", dialCode: "+235", continent: "Africa" },
  { code: "KM", name: "Comores", nameEn: "Comoros", nameFr: "Comores", nameMg: "Komoro", flag: "🇰🇲", dialCode: "+269", continent: "Africa" },
  { code: "CG", name: "Congo", nameEn: "Congo", nameFr: "Congo", nameMg: "Kôngo", flag: "🇨🇬", dialCode: "+242", continent: "Africa" },
  { code: "CD", name: "République démocratique du Congo", nameEn: "Democratic Republic of Congo", nameFr: "République démocratique du Congo", nameMg: "Repoblika Demokratikan'i Kôngo", flag: "🇨🇩", dialCode: "+243", continent: "Africa" },
  { code: "CI", name: "Côte d'Ivoire", nameEn: "Ivory Coast", nameFr: "Côte d'Ivoire", nameMg: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", continent: "Africa" },
  { code: "DJ", name: "Djibouti", nameEn: "Djibouti", nameFr: "Djibouti", nameMg: "Djiboti", flag: "🇩🇯", dialCode: "+253", continent: "Africa" },
  { code: "EG", name: "Égypte", nameEn: "Egypt", nameFr: "Égypte", nameMg: "Ejipta", flag: "🇪🇬", dialCode: "+20", continent: "Africa" },
  { code: "GQ", name: "Guinée équatoriale", nameEn: "Equatorial Guinea", nameFr: "Guinée équatoriale", nameMg: "Guinea Ekoatorialy", flag: "🇬🇶", dialCode: "+240", continent: "Africa" },
  { code: "ER", name: "Érythrée", nameEn: "Eritrea", nameFr: "Érythrée", nameMg: "Eritrea", flag: "🇪🇷", dialCode: "+291", continent: "Africa" },
  { code: "SZ", name: "Eswatini", nameEn: "Eswatini", nameFr: "Eswatini", nameMg: "Esoatiny", flag: "🇸🇿", dialCode: "+268", continent: "Africa" },
  { code: "ET", name: "Éthiopie", nameEn: "Ethiopia", nameFr: "Éthiopie", nameMg: "Etiopia", flag: "🇪🇹", dialCode: "+251", continent: "Africa" },
  { code: "GA", name: "Gabon", nameEn: "Gabon", nameFr: "Gabon", nameMg: "Gabon", flag: "🇬🇦", dialCode: "+241", continent: "Africa" },
  { code: "GM", name: "Gambie", nameEn: "Gambia", nameFr: "Gambie", nameMg: "Gambia", flag: "🇬🇲", dialCode: "+220", continent: "Africa" },
  { code: "GH", name: "Ghana", nameEn: "Ghana", nameFr: "Ghana", nameMg: "Gana", flag: "🇬🇭", dialCode: "+233", continent: "Africa" },
  { code: "GN", name: "Guinée", nameEn: "Guinea", nameFr: "Guinée", nameMg: "Ginea", flag: "🇬🇳", dialCode: "+224", continent: "Africa" },
  { code: "GW", name: "Guinée-Bissau", nameEn: "Guinea-Bissau", nameFr: "Guinée-Bissau", nameMg: "Ginea-Bisao", flag: "🇬🇼", dialCode: "+245", continent: "Africa" },
  { code: "KE", name: "Kenya", nameEn: "Kenya", nameFr: "Kenya", nameMg: "Kenya", flag: "🇰🇪", dialCode: "+254", continent: "Africa" },
  { code: "LS", name: "Lesotho", nameEn: "Lesotho", nameFr: "Lesotho", nameMg: "Lesoto", flag: "🇱🇸", dialCode: "+266", continent: "Africa" },
  { code: "LR", name: "Libéria", nameEn: "Liberia", nameFr: "Libéria", nameMg: "Liberia", flag: "🇱🇷", dialCode: "+231", continent: "Africa" },
  { code: "LY", name: "Libye", nameEn: "Libya", nameFr: "Libye", nameMg: "Libya", flag: "🇱🇾", dialCode: "+218", continent: "Africa" },
  { code: "MG", name: "Madagascar", nameEn: "Madagascar", nameFr: "Madagascar", nameMg: "Madagasikara", flag: "🇲🇬", dialCode: "+261", continent: "Africa" },
  { code: "MW", name: "Malawi", nameEn: "Malawi", nameFr: "Malawi", nameMg: "Malawi", flag: "🇲🇼", dialCode: "+265", continent: "Africa" },
  { code: "ML", name: "Mali", nameEn: "Mali", nameFr: "Mali", nameMg: "Mali", flag: "🇲🇱", dialCode: "+223", continent: "Africa" },
  { code: "MR", name: "Mauritanie", nameEn: "Mauritania", nameFr: "Mauritanie", nameMg: "Maoritania", flag: "🇲🇷", dialCode: "+222", continent: "Africa" },
  { code: "MU", name: "Maurice", nameEn: "Mauritius", nameFr: "Maurice", nameMg: "Maorisy", flag: "🇲🇺", dialCode: "+230", continent: "Africa" },
  { code: "YT", name: "Mayotte", nameEn: "Mayotte", nameFr: "Mayotte", nameMg: "Mayotte", flag: "🇾🇹", dialCode: "+262", continent: "Africa" },
  { code: "MA", name: "Maroc", nameEn: "Morocco", nameFr: "Maroc", nameMg: "Maroka", flag: "🇲🇦", dialCode: "+212", continent: "Africa" },
  { code: "MZ", name: "Mozambique", nameEn: "Mozambique", nameFr: "Mozambique", nameMg: "Mozambika", flag: "🇲🇿", dialCode: "+258", continent: "Africa" },
  { code: "NA", name: "Namibie", nameEn: "Namibia", nameFr: "Namibie", nameMg: "Namibia", flag: "🇳🇦", dialCode: "+264", continent: "Africa" },
  { code: "NE", name: "Niger", nameEn: "Niger", nameFr: "Niger", nameMg: "Niger", flag: "🇳🇪", dialCode: "+227", continent: "Africa" },
  { code: "NG", name: "Nigeria", nameEn: "Nigeria", nameFr: "Nigéria", nameMg: "Nizeria", flag: "🇳🇬", dialCode: "+234", continent: "Africa" },
  { code: "RE", name: "La Réunion", nameEn: "Reunion", nameFr: "La Réunion", nameMg: "Larénion", flag: "🇷🇪", dialCode: "+262", continent: "Africa" },
  { code: "RW", name: "Rwanda", nameEn: "Rwanda", nameFr: "Rwanda", nameMg: "Roanda", flag: "🇷🇼", dialCode: "+250", continent: "Africa" },
  { code: "ST", name: "Sao Tomé-et-Principe", nameEn: "Sao Tome and Principe", nameFr: "Sao Tomé-et-Principe", nameMg: "São Tomé sy Príncipe", flag: "🇸🇹", dialCode: "+239", continent: "Africa" },
  { code: "SN", name: "Sénégal", nameEn: "Senegal", nameFr: "Sénégal", nameMg: "Senegaly", flag: "🇸🇳", dialCode: "+221", continent: "Africa" },
  { code: "SC", name: "Seychelles", nameEn: "Seychelles", nameFr: "Seychelles", nameMg: "Sechela", flag: "🇸🇨", dialCode: "+248", continent: "Africa" },
  { code: "SL", name: "Sierra Leone", nameEn: "Sierra Leone", nameFr: "Sierra Leone", nameMg: "Sierra Leone", flag: "🇸🇱", dialCode: "+232", continent: "Africa" },
  { code: "SO", name: "Somalie", nameEn: "Somalia", nameFr: "Somalie", nameMg: "Somalia", flag: "🇸🇴", dialCode: "+252", continent: "Africa" },
  { code: "ZA", name: "Afrique du Sud", nameEn: "South Africa", nameFr: "Afrique du Sud", nameMg: "Afrika Atsimo", flag: "🇿🇦", dialCode: "+27", continent: "Africa" },
  { code: "SS", name: "Soudan du Sud", nameEn: "South Sudan", nameFr: "Soudan du Sud", nameMg: "Sodan Atsimo", flag: "🇸🇸", dialCode: "+211", continent: "Africa" },
  { code: "SD", name: "Soudan", nameEn: "Sudan", nameFr: "Soudan", nameMg: "Sodan", flag: "🇸🇩", dialCode: "+249", continent: "Africa" },
  { code: "TZ", name: "Tanzanie", nameEn: "Tanzania", nameFr: "Tanzanie", nameMg: "Tanzania", flag: "🇹🇿", dialCode: "+255", continent: "Africa" },
  { code: "TG", name: "Togo", nameEn: "Togo", nameFr: "Togo", nameMg: "Togo", flag: "🇹🇬", dialCode: "+228", continent: "Africa" },
  { code: "TN", name: "Tunisie", nameEn: "Tunisia", nameFr: "Tunisie", nameMg: "Tonizia", flag: "🇹🇳", dialCode: "+216", continent: "Africa" },
  { code: "UG", name: "Ouganda", nameEn: "Uganda", nameFr: "Ouganda", nameMg: "Oganda", flag: "🇺🇬", dialCode: "+256", continent: "Africa" },
  { code: "EH", name: "Sahara occidental", nameEn: "Western Sahara", nameFr: "Sahara occidental", nameMg: "Sahara Andrefana", flag: "🇪🇭", dialCode: "+212", continent: "Africa" },
  { code: "ZM", name: "Zambie", nameEn: "Zambia", nameFr: "Zambie", nameMg: "Zambia", flag: "🇿🇲", dialCode: "+260", continent: "Africa" },
  { code: "ZW", name: "Zimbabwe", nameEn: "Zimbabwe", nameFr: "Zimbabwe", nameMg: "Zimbabwe", flag: "🇿🇼", dialCode: "+263", continent: "Africa" },

  // Asie (48 pays)
  { code: "AF", name: "Afghanistan", nameEn: "Afghanistan", nameFr: "Afghanistan", nameMg: "Afghanistana", flag: "🇦🇫", dialCode: "+93", continent: "Asia" },
  { code: "AM", name: "Arménie", nameEn: "Armenia", nameFr: "Arménie", nameMg: "Armenia", flag: "🇦🇲", dialCode: "+374", continent: "Asia" },
  { code: "AZ", name: "Azerbaïdjan", nameEn: "Azerbaijan", nameFr: "Azerbaïdjan", nameMg: "Azerbaijana", flag: "🇦🇿", dialCode: "+994", continent: "Asia" },
  { code: "BH", name: "Bahreïn", nameEn: "Bahrain", nameFr: "Bahreïn", nameMg: "Bahrain", flag: "🇧🇭", dialCode: "+973", continent: "Asia" },
  { code: "BD", name: "Bangladesh", nameEn: "Bangladesh", nameFr: "Bangladesh", nameMg: "Bangladesy", flag: "🇧🇩", dialCode: "+880", continent: "Asia" },
  { code: "BT", name: "Bhoutan", nameEn: "Bhutan", nameFr: "Bhoutan", nameMg: "Bhotana", flag: "🇧🇹", dialCode: "+975", continent: "Asia" },
  { code: "BN", name: "Brunéi", nameEn: "Brunei", nameFr: "Brunéi", nameMg: "Brunei", flag: "🇧🇳", dialCode: "+673", continent: "Asia" },
  { code: "KH", name: "Cambodge", nameEn: "Cambodia", nameFr: "Cambodge", nameMg: "Kambodza", flag: "🇰🇭", dialCode: "+855", continent: "Asia" },
  { code: "CN", name: "Chine", nameEn: "China", nameFr: "Chine", nameMg: "Sina", flag: "🇨🇳", dialCode: "+86", continent: "Asia" },
  { code: "CY", name: "Chypre", nameEn: "Cyprus", nameFr: "Chypre", nameMg: "Sypra", flag: "🇨🇾", dialCode: "+357", continent: "Asia" },
  { code: "GE", name: "Géorgie", nameEn: "Georgia", nameFr: "Géorgie", nameMg: "Jeorjia", flag: "🇬🇪", dialCode: "+995", continent: "Asia" },
  { code: "IN", name: "Inde", nameEn: "India", nameFr: "Inde", nameMg: "India", flag: "🇮🇳", dialCode: "+91", continent: "Asia" },
  { code: "ID", name: "Indonésie", nameEn: "Indonesia", nameFr: "Indonésie", nameMg: "Indonezia", flag: "🇮🇩", dialCode: "+62", continent: "Asia" },
  { code: "IR", name: "Iran", nameEn: "Iran", nameFr: "Iran", nameMg: "Iran", flag: "🇮🇷", dialCode: "+98", continent: "Asia" },
  { code: "IQ", name: "Irak", nameEn: "Iraq", nameFr: "Irak", nameMg: "Irak", flag: "🇮🇶", dialCode: "+964", continent: "Asia" },
  { code: "IL", name: "Israël", nameEn: "Israel", nameFr: "Israël", nameMg: "Israely", flag: "🇮🇱", dialCode: "+972", continent: "Asia" },
  { code: "JP", name: "Japon", nameEn: "Japan", nameFr: "Japon", nameMg: "Japana", flag: "🇯🇵", dialCode: "+81", continent: "Asia" },
  { code: "JO", name: "Jordanie", nameEn: "Jordan", nameFr: "Jordanie", nameMg: "Jordania", flag: "🇯🇴", dialCode: "+962", continent: "Asia" },
  { code: "KZ", name: "Kazakhstan", nameEn: "Kazakhstan", nameFr: "Kazakhstan", nameMg: "Kazakhstana", flag: "🇰🇿", dialCode: "+7", continent: "Asia" },
  { code: "KW", name: "Koweït", nameEn: "Kuwait", nameFr: "Koweït", nameMg: "Kowety", flag: "🇰🇼", dialCode: "+965", continent: "Asia" },
  { code: "KG", name: "Kirghizistan", nameEn: "Kyrgyzstan", nameFr: "Kirghizistan", nameMg: "Kirgizistana", flag: "🇰🇬", dialCode: "+996", continent: "Asia" },
  { code: "LA", name: "Laos", nameEn: "Laos", nameFr: "Laos", nameMg: "Laos", flag: "🇱🇦", dialCode: "+856", continent: "Asia" },
  { code: "LB", name: "Liban", nameEn: "Lebanon", nameFr: "Liban", nameMg: "Libana", flag: "🇱🇧", dialCode: "+961", continent: "Asia" },
  { code: "MY", name: "Malaisie", nameEn: "Malaysia", nameFr: "Malaisie", nameMg: "Malaizia", flag: "🇲🇾", dialCode: "+60", continent: "Asia" },
  { code: "MV", name: "Maldives", nameEn: "Maldives", nameFr: "Maldives", nameMg: "Maldiva", flag: "🇲🇻", dialCode: "+960", continent: "Asia" },
  { code: "MN", name: "Mongolie", nameEn: "Mongolia", nameFr: "Mongolie", nameMg: "Mongolia", flag: "🇲🇳", dialCode: "+976", continent: "Asia" },
  { code: "MM", name: "Birmanie", nameEn: "Myanmar", nameFr: "Birmanie", nameMg: "Myanmara", flag: "🇲🇲", dialCode: "+95", continent: "Asia" },
  { code: "NP", name: "Népal", nameEn: "Nepal", nameFr: "Népal", nameMg: "Nepaly", flag: "🇳🇵", dialCode: "+977", continent: "Asia" },
  { code: "KP", name: "Corée du Nord", nameEn: "North Korea", nameFr: "Corée du Nord", nameMg: "Korea Avaratra", flag: "🇰🇵", dialCode: "+850", continent: "Asia" },
  { code: "OM", name: "Oman", nameEn: "Oman", nameFr: "Oman", nameMg: "Oman", flag: "🇴🇲", dialCode: "+968", continent: "Asia" },
  { code: "PK", name: "Pakistan", nameEn: "Pakistan", nameFr: "Pakistan", nameMg: "Pakistana", flag: "🇵🇰", dialCode: "+92", continent: "Asia" },
  { code: "PS", name: "Palestine", nameEn: "Palestine", nameFr: "Palestine", nameMg: "Palestina", flag: "🇵🇸", dialCode: "+970", continent: "Asia" },
  { code: "PH", name: "Philippines", nameEn: "Philippines", nameFr: "Philippines", nameMg: "Filipina", flag: "🇵🇭", dialCode: "+63", continent: "Asia" },
  { code: "QA", name: "Qatar", nameEn: "Qatar", nameFr: "Qatar", nameMg: "Qatar", flag: "🇶🇦", dialCode: "+974", continent: "Asia" },
  { code: "SA", name: "Arabie saoudite", nameEn: "Saudi Arabia", nameFr: "Arabie saoudite", nameMg: "Arabia Saodita", flag: "🇸🇦", dialCode: "+966", continent: "Asia" },
  { code: "SG", name: "Singapour", nameEn: "Singapore", nameFr: "Singapour", nameMg: "Singaporo", flag: "🇸🇬", dialCode: "+65", continent: "Asia" },
  { code: "KR", name: "Corée du Sud", nameEn: "South Korea", nameFr: "Corée du Sud", nameMg: "Korea Atsimo", flag: "🇰🇷", dialCode: "+82", continent: "Asia" },
  { code: "LK", name: "Sri Lanka", nameEn: "Sri Lanka", nameFr: "Sri Lanka", nameMg: "Sri Lanka", flag: "🇱🇰", dialCode: "+94", continent: "Asia" },
  { code: "SY", name: "Syrie", nameEn: "Syria", nameFr: "Syrie", nameMg: "Syria", flag: "🇸🇾", dialCode: "+963", continent: "Asia" },
  { code: "TW", name: "Taïwan", nameEn: "Taiwan", nameFr: "Taïwan", nameMg: "Taioana", flag: "🇹🇼", dialCode: "+886", continent: "Asia" },
  { code: "TJ", name: "Tadjikistan", nameEn: "Tajikistan", nameFr: "Tadjikistan", nameMg: "Tadjikistana", flag: "🇹🇯", dialCode: "+992", continent: "Asia" },
  { code: "TH", name: "Thaïlande", nameEn: "Thailand", nameFr: "Thaïlande", nameMg: "Tailandy", flag: "🇹🇭", dialCode: "+66", continent: "Asia" },
  { code: "TL", name: "Timor oriental", nameEn: "Timor-Leste", nameFr: "Timor oriental", nameMg: "Timor Atsinanana", flag: "🇹🇱", dialCode: "+670", continent: "Asia" },
  { code: "TR", name: "Turquie", nameEn: "Turkey", nameFr: "Turquie", nameMg: "Torkia", flag: "🇹🇷", dialCode: "+90", continent: "Asia" },
  { code: "TM", name: "Turkménistan", nameEn: "Turkmenistan", nameFr: "Turkménistan", nameMg: "Turkmenistana", flag: "🇹🇲", dialCode: "+993", continent: "Asia" },
  { code: "AE", name: "Émirats arabes unis", nameEn: "United Arab Emirates", nameFr: "Émirats arabes unis", nameMg: "Emirà Arabo Mitambatra", flag: "🇦🇪", dialCode: "+971", continent: "Asia" },
  { code: "UZ", name: "Ouzbékistan", nameEn: "Uzbekistan", nameFr: "Ouzbékistan", nameMg: "Ouzbekistana", flag: "🇺🇿", dialCode: "+998", continent: "Asia" },
  { code: "VN", name: "Vietnam", nameEn: "Vietnam", nameFr: "Vietnam", nameMg: "Vietnam", flag: "🇻🇳", dialCode: "+84", continent: "Asia" },
  { code: "YE", name: "Yémen", nameEn: "Yemen", nameFr: "Yémen", nameMg: "Yemen", flag: "🇾🇪", dialCode: "+967", continent: "Asia" },

  // Europe (51 pays)
  { code: "AL", name: "Albanie", nameEn: "Albania", nameFr: "Albanie", nameMg: "Albania", flag: "🇦🇱", dialCode: "+355", continent: "Europe" },
  { code: "AD", name: "Andorre", nameEn: "Andorra", nameFr: "Andorre", nameMg: "Andora", flag: "🇦🇩", dialCode: "+376", continent: "Europe" },
  { code: "AT", name: "Autriche", nameEn: "Austria", nameFr: "Autriche", nameMg: "Aotrisy", flag: "🇦🇹", dialCode: "+43", continent: "Europe" },
  { code: "BY", name: "Biélorussie", nameEn: "Belarus", nameFr: "Biélorussie", nameMg: "Belarosy", flag: "🇧🇾", dialCode: "+375", continent: "Europe" },
  { code: "BE", name: "Belgique", nameEn: "Belgium", nameFr: "Belgique", nameMg: "Belzika", flag: "🇧🇪", dialCode: "+32", continent: "Europe" },
  { code: "BA", name: "Bosnie-Herzégovine", nameEn: "Bosnia and Herzegovina", nameFr: "Bosnie-Herzégovine", nameMg: "Bosnia sy Herzegovina", flag: "🇧🇦", dialCode: "+387", continent: "Europe" },
  { code: "BG", name: "Bulgarie", nameEn: "Bulgaria", nameFr: "Bulgarie", nameMg: "Bolgaria", flag: "🇧🇬", dialCode: "+359", continent: "Europe" },
  { code: "HR", name: "Croatie", nameEn: "Croatia", nameFr: "Croatie", nameMg: "Kroasia", flag: "🇭🇷", dialCode: "+385", continent: "Europe" },
  { code: "CY", name: "Chypre", nameEn: "Cyprus", nameFr: "Chypre", nameMg: "Sypra", flag: "🇨🇾", dialCode: "+357", continent: "Europe" },
  { code: "CZ", name: "République tchèque", nameEn: "Czech Republic", nameFr: "République tchèque", nameMg: "Tsekia", flag: "🇨🇿", dialCode: "+420", continent: "Europe" },
  { code: "DK", name: "Danemark", nameEn: "Denmark", nameFr: "Danemark", nameMg: "Danemarka", flag: "🇩🇰", dialCode: "+45", continent: "Europe" },
  { code: "EE", name: "Estonie", nameEn: "Estonia", nameFr: "Estonie", nameMg: "Estonia", flag: "🇪🇪", dialCode: "+372", continent: "Europe" },
  { code: "FO", name: "Îles Féroé", nameEn: "Faroe Islands", nameFr: "Îles Féroé", nameMg: "Nosy Faroe", flag: "🇫🇴", dialCode: "+298", continent: "Europe" },
  { code: "FI", name: "Finlande", nameEn: "Finland", nameFr: "Finlande", nameMg: "Finlandy", flag: "🇫🇮", dialCode: "+358", continent: "Europe" },
  { code: "FR", name: "France", nameEn: "France", nameFr: "France", nameMg: "Frantsa", flag: "🇫🇷", dialCode: "+33", continent: "Europe" },
  { code: "GE", name: "Géorgie", nameEn: "Georgia", nameFr: "Géorgie", nameMg: "Jeorjia", flag: "🇬🇪", dialCode: "+995", continent: "Europe" },
  { code: "DE", name: "Allemagne", nameEn: "Germany", nameFr: "Allemagne", nameMg: "Alemaina", flag: "🇩🇪", dialCode: "+49", continent: "Europe" },
  { code: "GI", name: "Gibraltar", nameEn: "Gibraltar", nameFr: "Gibraltar", nameMg: "Gibraltara", flag: "🇬🇮", dialCode: "+350", continent: "Europe" },
  { code: "GR", name: "Grèce", nameEn: "Greece", nameFr: "Grèce", nameMg: "Gresy", flag: "🇬🇷", dialCode: "+30", continent: "Europe" },
  { code: "GL", name: "Groenland", nameEn: "Greenland", nameFr: "Groenland", nameMg: "Groenlanda", flag: "🇬🇱", dialCode: "+299", continent: "Europe" },
  { code: "HU", name: "Hongrie", nameEn: "Hungary", nameFr: "Hongrie", nameMg: "Hongria", flag: "🇭🇺", dialCode: "+36", continent: "Europe" },
  { code: "IS", name: "Islande", nameEn: "Iceland", nameFr: "Islande", nameMg: "Islandy", flag: "🇮🇸", dialCode: "+354", continent: "Europe" },
  { code: "IE", name: "Irlande", nameEn: "Ireland", nameFr: "Irlande", nameMg: "Irlandy", flag: "🇮🇪", dialCode: "+353", continent: "Europe" },
  { code: "IT", name: "Italie", nameEn: "Italy", nameFr: "Italie", nameMg: "Italia", flag: "🇮🇹", dialCode: "+39", continent: "Europe" },
  { code: "XK", name: "Kosovo", nameEn: "Kosovo", nameFr: "Kosovo", nameMg: "Kosovo", flag: "🇽🇰", dialCode: "+383", continent: "Europe" },
  { code: "LV", name: "Lettonie", nameEn: "Latvia", nameFr: "Lettonie", nameMg: "Letonia", flag: "🇱🇻", dialCode: "+371", continent: "Europe" },
  { code: "LI", name: "Liechtenstein", nameEn: "Liechtenstein", nameFr: "Liechtenstein", nameMg: "Liechtenstein", flag: "🇱🇮", dialCode: "+423", continent: "Europe" },
  { code: "LT", name: "Lituanie", nameEn: "Lithuania", nameFr: "Lituanie", nameMg: "Litoania", flag: "🇱🇹", dialCode: "+370", continent: "Europe" },
  { code: "LU", name: "Luxembourg", nameEn: "Luxembourg", nameFr: "Luxembourg", nameMg: "Losamborga", flag: "🇱🇺", dialCode: "+352", continent: "Europe" },
  { code: "MT", name: "Malte", nameEn: "Malta", nameFr: "Malte", nameMg: "Malta", flag: "🇲🇹", dialCode: "+356", continent: "Europe" },
  { code: "MD", name: "Moldavie", nameEn: "Moldova", nameFr: "Moldavie", nameMg: "Moldavia", flag: "🇲🇩", dialCode: "+373", continent: "Europe" },
  { code: "MC", name: "Monaco", nameEn: "Monaco", nameFr: "Monaco", nameMg: "Monako", flag: "🇲🇨", dialCode: "+377", continent: "Europe" },
  { code: "ME", name: "Monténégro", nameEn: "Montenegro", nameFr: "Monténégro", nameMg: "Montenegro", flag: "🇲🇪", dialCode: "+382", continent: "Europe" },
  { code: "NL", name: "Pays-Bas", nameEn: "Netherlands", nameFr: "Pays-Bas", nameMg: "Holanda", flag: "🇳🇱", dialCode: "+31", continent: "Europe" },
  { code: "MK", name: "Macédoine du Nord", nameEn: "North Macedonia", nameFr: "Macédoine du Nord", nameMg: "Makedonia Avaratra", flag: "🇲🇰", dialCode: "+389", continent: "Europe" },
  { code: "NO", name: "Norvège", nameEn: "Norway", nameFr: "Norvège", nameMg: "Nôrvezy", flag: "🇳🇴", dialCode: "+47", continent: "Europe" },
  { code: "PL", name: "Pologne", nameEn: "Poland", nameFr: "Pologne", nameMg: "Pôlôna", flag: "🇵🇱", dialCode: "+48", continent: "Europe" },
  { code: "PT", name: "Portugal", nameEn: "Portugal", nameFr: "Portugal", nameMg: "Pôrtogaly", flag: "🇵🇹", dialCode: "+351", continent: "Europe" },
  { code: "RO", name: "Roumanie", nameEn: "Romania", nameFr: "Roumanie", nameMg: "Romania", flag: "🇷🇴", dialCode: "+40", continent: "Europe" },
  { code: "RU", name: "Russie", nameEn: "Russia", nameFr: "Russie", nameMg: "Rosia", flag: "🇷🇺", dialCode: "+7", continent: "Europe" },
  { code: "SM", name: "Saint-Marin", nameEn: "San Marino", nameFr: "Saint-Marin", nameMg: "San Marino", flag: "🇸🇲", dialCode: "+378", continent: "Europe" },
  { code: "RS", name: "Serbie", nameEn: "Serbia", nameFr: "Serbie", nameMg: "Serbia", flag: "🇷🇸", dialCode: "+381", continent: "Europe" },
  { code: "SK", name: "Slovaquie", nameEn: "Slovakia", nameFr: "Slovaquie", nameMg: "Slovakia", flag: "🇸🇰", dialCode: "+421", continent: "Europe" },
  { code: "SI", name: "Slovénie", nameEn: "Slovenia", nameFr: "Slovénie", nameMg: "Slovenia", flag: "🇸🇮", dialCode: "+386", continent: "Europe" },
  { code: "ES", name: "Espagne", nameEn: "Spain", nameFr: "Espagne", nameMg: "Espaina", flag: "🇪🇸", dialCode: "+34", continent: "Europe" },
  { code: "SE", name: "Suède", nameEn: "Sweden", nameFr: "Suède", nameMg: "Soeda", flag: "🇸🇪", dialCode: "+46", continent: "Europe" },
  { code: "CH", name: "Suisse", nameEn: "Switzerland", nameFr: "Suisse", nameMg: "Soisa", flag: "🇨🇭", dialCode: "+41", continent: "Europe" },
  { code: "UA", name: "Ukraine", nameEn: "Ukraine", nameFr: "Ukraine", nameMg: "Okraina", flag: "🇺🇦", dialCode: "+380", continent: "Europe" },
  { code: "GB", name: "Royaume-Uni", nameEn: "United Kingdom", nameFr: "Royaume-Uni", nameMg: "Fanjakana Mitambatra", flag: "🇬🇧", dialCode: "+44", continent: "Europe" },
  { code: "VA", name: "Vatican", nameEn: "Vatican City", nameFr: "Vatican", nameMg: "Vatikana", flag: "🇻🇦", dialCode: "+379", continent: "Europe" },

  // Amérique du Nord (23 pays)
  { code: "AG", name: "Antigua-et-Barbuda", nameEn: "Antigua and Barbuda", nameFr: "Antigua-et-Barbuda", nameMg: "Antigua sy Barbuda", flag: "🇦🇬", dialCode: "+1", continent: "North America" },
  { code: "BS", name: "Bahamas", nameEn: "Bahamas", nameFr: "Bahamas", nameMg: "Bahamas", flag: "🇧🇸", dialCode: "+1", continent: "North America" },
  { code: "BB", name: "Barbade", nameEn: "Barbados", nameFr: "Barbade", nameMg: "Barbady", flag: "🇧🇧", dialCode: "+1", continent: "North America" },
  { code: "BZ", name: "Belize", nameEn: "Belize", nameFr: "Belize", nameMg: "Belize", flag: "🇧🇿", dialCode: "+501", continent: "North America" },
  { code: "CA", name: "Canada", nameEn: "Canada", nameFr: "Canada", nameMg: "Kanada", flag: "🇨🇦", dialCode: "+1", continent: "North America" },
  { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", nameFr: "Costa Rica", nameMg: "Kosta Rika", flag: "🇨🇷", dialCode: "+506", continent: "North America" },
  { code: "CU", name: "Cuba", nameEn: "Cuba", nameFr: "Cuba", nameMg: "Kioba", flag: "🇨🇺", dialCode: "+53", continent: "North America" },
  { code: "DM", name: "Dominique", nameEn: "Dominica", nameFr: "Dominique", nameMg: "Dominika", flag: "🇩🇲", dialCode: "+1", continent: "North America" },
  { code: "DO", name: "République dominicaine", nameEn: "Dominican Republic", nameFr: "République dominicaine", nameMg: "Repoblika Dominikanina", flag: "🇩🇴", dialCode: "+1", continent: "North America" },
  { code: "SV", name: "Salvador", nameEn: "El Salvador", nameFr: "Salvador", nameMg: "El Salvador", flag: "🇸🇻", dialCode: "+503", continent: "North America" },
  { code: "GD", name: "Grenade", nameEn: "Grenada", nameFr: "Grenade", nameMg: "Grenady", flag: "🇬🇩", dialCode: "+1", continent: "North America" },
  { code: "GT", name: "Guatemala", nameEn: "Guatemala", nameFr: "Guatemala", nameMg: "Goatemala", flag: "🇬🇹", dialCode: "+502", continent: "North America" },
  { code: "HT", name: "Haïti", nameEn: "Haiti", nameFr: "Haïti", nameMg: "Haiti", flag: "🇭🇹", dialCode: "+509", continent: "North America" },
  { code: "HN", name: "Honduras", nameEn: "Honduras", nameFr: "Honduras", nameMg: "Hondoras", flag: "🇭🇳", dialCode: "+504", continent: "North America" },
  { code: "JM", name: "Jamaïque", nameEn: "Jamaica", nameFr: "Jamaïque", nameMg: "Jamaika", flag: "🇯🇲", dialCode: "+1", continent: "North America" },
  { code: "MX", name: "Mexique", nameEn: "Mexico", nameFr: "Mexique", nameMg: "Meksika", flag: "🇲🇽", dialCode: "+52", continent: "North America" },
  { code: "NI", name: "Nicaragua", nameEn: "Nicaragua", nameFr: "Nicaragua", nameMg: "Nikaragoa", flag: "🇳🇮", dialCode: "+505", continent: "North America" },
  { code: "PA", name: "Panama", nameEn: "Panama", nameFr: "Panama", nameMg: "Panama", flag: "🇵🇦", dialCode: "+507", continent: "North America" },
  { code: "KN", name: "Saint-Christophe-et-Niévès", nameEn: "Saint Kitts and Nevis", nameFr: "Saint-Christophe-et-Niévès", nameMg: "Saint-Christophe sy Nevis", flag: "🇰🇳", dialCode: "+1", continent: "North America" },
  { code: "LC", name: "Sainte-Lucie", nameEn: "Saint Lucia", nameFr: "Sainte-Lucie", nameMg: "Sainte-Lucie", flag: "🇱🇨", dialCode: "+1", continent: "North America" },
  { code: "VC", name: "Saint-Vincent-et-les-Grenadines", nameEn: "Saint Vincent and the Grenadines", nameFr: "Saint-Vincent-et-les-Grenadines", nameMg: "Saint-Vincent sy Grenadines", flag: "🇻🇨", dialCode: "+1", continent: "North America" },
  { code: "TT", name: "Trinité-et-Tobago", nameEn: "Trinidad and Tobago", nameFr: "Trinité-et-Tobago", nameMg: "Trinidad sy Tobago", flag: "🇹🇹", dialCode: "+1", continent: "North America" },
  { code: "US", name: "États-Unis", nameEn: "United States", nameFr: "États-Unis", nameMg: "Etazonia", flag: "🇺🇸", dialCode: "+1", continent: "North America" },

  // Amérique du Sud (12 pays)
  { code: "AR", name: "Argentine", nameEn: "Argentina", nameFr: "Argentine", nameMg: "Arzantina", flag: "🇦🇷", dialCode: "+54", continent: "South America" },
  { code: "BO", name: "Bolivie", nameEn: "Bolivia", nameFr: "Bolivie", nameMg: "Bolivia", flag: "🇧🇴", dialCode: "+591", continent: "South America" },
  { code: "BR", name: "Brésil", nameEn: "Brazil", nameFr: "Brésil", nameMg: "Brezila", flag: "🇧🇷", dialCode: "+55", continent: "South America" },
  { code: "CL", name: "Chili", nameEn: "Chile", nameFr: "Chili", nameMg: "Silia", flag: "🇨🇱", dialCode: "+56", continent: "South America" },
  { code: "CO", name: "Colombie", nameEn: "Colombia", nameFr: "Colombie", nameMg: "Kôlômbia", flag: "🇨🇴", dialCode: "+57", continent: "South America" },
  { code: "EC", name: "Équateur", nameEn: "Ecuador", nameFr: "Équateur", nameMg: "Ekoatera", flag: "🇪🇨", dialCode: "+593", continent: "South America" },
  { code: "GY", name: "Guyana", nameEn: "Guyana", nameFr: "Guyana", nameMg: "Goiana", flag: "🇬🇾", dialCode: "+592", continent: "South America" },
  { code: "PY", name: "Paraguay", nameEn: "Paraguay", nameFr: "Paraguay", nameMg: "Paragoay", flag: "🇵🇾", dialCode: "+595", continent: "South America" },
  { code: "PE", name: "Pérou", nameEn: "Peru", nameFr: "Pérou", nameMg: "Pero", flag: "🇵🇪", dialCode: "+51", continent: "South America" },
  { code: "SR", name: "Suriname", nameEn: "Suriname", nameFr: "Suriname", nameMg: "Soriname", flag: "🇸🇷", dialCode: "+597", continent: "South America" },
  { code: "UY", name: "Uruguay", nameEn: "Uruguay", nameFr: "Uruguay", nameMg: "Orogoay", flag: "🇺🇾", dialCode: "+598", continent: "South America" },
  { code: "VE", name: "Venezuela", nameEn: "Venezuela", nameFr: "Venezuela", nameMg: " Venezoela", flag: "🇻🇪", dialCode: "+58", continent: "South America" },

  // Océanie (14 pays)
  { code: "AU", name: "Australie", nameEn: "Australia", nameFr: "Australie", nameMg: "Aostralia", flag: "🇦🇺", dialCode: "+61", continent: "Oceania" },
  { code: "FJ", name: "Fidji", nameEn: "Fiji", nameFr: "Fidji", nameMg: "Fidji", flag: "🇫🇯", dialCode: "+679", continent: "Oceania" },
  { code: "KI", name: "Kiribati", nameEn: "Kiribati", nameFr: "Kiribati", nameMg: "Kiribati", flag: "🇰🇮", dialCode: "+686", continent: "Oceania" },
  { code: "MH", name: "Îles Marshall", nameEn: "Marshall Islands", nameFr: "Îles Marshall", nameMg: "Nosy Marshall", flag: "🇲🇭", dialCode: "+692", continent: "Oceania" },
  { code: "FM", name: "Micronésie", nameEn: "Micronesia", nameFr: "Micronésie", nameMg: "Mikrônezia", flag: "🇫🇲", dialCode: "+691", continent: "Oceania" },
  { code: "NR", name: "Nauru", nameEn: "Nauru", nameFr: "Nauru", nameMg: "Naoro", flag: "🇳🇷", dialCode: "+674", continent: "Oceania" },
  { code: "NZ", name: "Nouvelle-Zélande", nameEn: "New Zealand", nameFr: "Nouvelle-Zélande", nameMg: "Nouvelle Zélande", flag: "🇳🇿", dialCode: "+64", continent: "Oceania" },
  { code: "PW", name: "Palaos", nameEn: "Palau", nameFr: "Palaos", nameMg: "Palao", flag: "🇵🇼", dialCode: "+680", continent: "Oceania" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", nameEn: "Papua New Guinea", nameFr: "Papouasie-Nouvelle-Guinée", nameMg: "Papouasie-Nouvelle Guinée", flag: "🇵🇬", dialCode: "+675", continent: "Oceania" },
  { code: "WS", name: "Samoa", nameEn: "Samoa", nameFr: "Samoa", nameMg: "Samoa", flag: "🇼🇸", dialCode: "+685", continent: "Oceania" },
  { code: "SB", name: "Îles Salomon", nameEn: "Solomon Islands", nameFr: "Îles Salomon", nameMg: "Nosy Salomon", flag: "🇸🇧", dialCode: "+677", continent: "Oceania" },
  { code: "TO", name: "Tonga", nameEn: "Tonga", nameFr: "Tonga", nameMg: "Tonga", flag: "🇹🇴", dialCode: "+676", continent: "Oceania" },
  { code: "TV", name: "Tuvalu", nameEn: "Tuvalu", nameFr: "Tuvalu", nameMg: "To valo", flag: "🇹🇻", dialCode: "+688", continent: "Oceania" },
  { code: "VU", name: "Vanuatu", nameEn: "Vanuatu", nameFr: "Vanuatu", nameMg: "Vanoato", flag: "🇻🇺", dialCode: "+678", continent: "Oceania" },
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
  { code: "MG", flag: "🇲🇬", name: "Madagascar", nameEn: "Madagascar", nameFr: "Madagascar", nameMg: "Madagasikara" },
  { code: "FR", flag: "🇫🇷", name: "France", nameEn: "France", nameFr: "France", nameMg: "Frantsa" },
  { code: "US", flag: "🇺🇸", name: "USA", nameEn: "USA", nameFr: "États-Unis", nameMg: "Etazonia" },
  { code: "GB", flag: "🇬🇧", name: "UK", nameEn: "UK", nameFr: "Royaume-Uni", nameMg: "Fanjakana Mitambatra" },
  { code: "CA", flag: "🇨🇦", name: "Canada", nameEn: "Canada", nameFr: "Canada", nameMg: "Kanada" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", nameEn: "South Africa", nameFr: "Afrique du Sud", nameMg: "Afrika Atsimo" },
  { code: "SN", flag: "🇸🇳", name: "Senegal", nameEn: "Senegal", nameFr: "Sénégal", nameMg: "Senegaly" },
  { code: "CI", flag: "🇨🇮", name: "Ivory Coast", nameEn: "Ivory Coast", nameFr: "Côte d'Ivoire", nameMg: "Côte d'Ivoire" },
  { code: "DE", flag: "🇩🇪", name: "Germany", nameEn: "Germany", nameFr: "Allemagne", nameMg: "Alemaina" },
  { code: "IT", flag: "🇮🇹", name: "Italy", nameEn: "Italy", nameFr: "Italie", nameMg: "Italia" },
  { code: "ES", flag: "🇪🇸", name: "Spain", nameEn: "Spain", nameFr: "Espagne", nameMg: "Espaina" },
  { code: "PT", flag: "🇵🇹", name: "Portugal", nameEn: "Portugal", nameFr: "Portugal", nameMg: "Pôrtogaly" },
]

// Obtenir tous les continents uniques
export const CONTINENTS = [...new Set(COUNTRIES.map(country => country.continent))]

// Fonction pour rechercher un pays par code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(country => country.code === code)
}

// Fonction pour rechercher des pays par nom
export function searchCountries(query: string, lang: string = 'en'): Country[] {
  const searchTerm = query.toLowerCase()
  return COUNTRIES.filter(country => {
    const name = getCountryName(country, lang).toLowerCase()
    const code = country.code.toLowerCase()
    const dialCode = country.dialCode
    return name.includes(searchTerm) || code.includes(searchTerm) || dialCode.includes(searchTerm)
  })
}