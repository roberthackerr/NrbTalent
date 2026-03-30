// app/[lang]/search/page.tsx
import { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { SearchPageContent } from './SearchPageContent'
import { Suspense } from 'react'

interface SearchPageProps {
  params: { lang: Locale }
  searchParams: { 
    q?: string
    type?: 'all' | 'projects' | 'freelancers' | 'clients' | 'posts' | 'teams'
    page?: string
    sort?: string
  }
}

// Métadonnées statiques pour SEO
export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || ''
  const type = searchParams.type || 'all'
  const lang = params.lang
  
  const getTitle = () => {
    if (query) {
      if (type === 'projects') return `${query} - Projets | NRBTalents`
      if (type === 'freelancers') return `${query} - Freelances | NRBTalents`
      if (type === 'clients') return `${query} - Clients | NRBTalents`
      if (type === 'posts') return `${query} - Publications | NRBTalents`
      return `${query} - Recherche | NRBTalents`
    }
    return lang === 'fr' ? 'Recherche | NRBTalents' : lang === 'en' ? 'Search | NRBTalents' : 'Fikarohana | NRBTalents'
  }
  
  const getDescription = () => {
    if (query) {
      if (type === 'projects') return `Découvrez ${query} : des projets freelance correspondant à vos compétences. Postulez dès maintenant.`
      if (type === 'freelancers') return `Trouvez ${query} : des freelances talentueux pour vos projets. Contactez-les gratuitement.`
      if (type === 'clients') return `Explorez ${query} : des clients recherchant des talents pour leurs projets.`
      if (type === 'posts') return `Lisez ${query} : des articles et publications sur le monde du freelance.`
      return `Résultats de recherche pour "${query}" sur NRBTalents.`
    }
    return 'Recherchez des projets, freelances, clients et publications sur NRBTalents'
  }
  
  return {
    title: getTitle(),
    description: getDescription(),
    openGraph: {
      title: getTitle(),
      description: getDescription(),
      type: 'website',
      locale: lang,
      siteName: 'NRBTalents',
      url: `https://nrbtalents.com/${lang}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    },
    alternates: {
      canonical: `/${lang}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
      languages: {
        fr: `/fr/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
        en: `/en/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
        mg: `/mg/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
      },
    },
  }
}

export default function SearchPage({ params, searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mx-auto mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}