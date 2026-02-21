// components/reviews/ReviewSystem.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Award, 
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  Heart,
  Flag,
  Send,
  X,
  ChevronDown,
  Filter,
  Search
} from 'lucide-react'

// Types
interface Review {
  id: string
  projectId: string
  projectTitle: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar?: string
  reviewerRole: 'client' | 'freelancer'
  reviewedId: string
  rating: number
  comment: string
  strengths: string[]
  wouldRecommend: boolean
  verified: boolean
  helpfulCount: number
  createdAt: string
  response?: {
    id: string
    content: string
    createdAt: string
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  recommendationRate: number
  categoryAverages: {
    communication: number
    quality: number
    deadlines: number
    professionalism: number
  }
}

interface ReviewFilters {
  rating: number | null
  sortBy: 'newest' | 'highest' | 'lowest' | 'helpful'
  hasResponse: boolean | null
  verifiedOnly: boolean
  keyword: string
}

// Composant principal
export function ReviewSystem({ 
  userId,
  userRole,
  isOwnProfile = false 
}: {
  userId: string
  userRole: 'freelancer' | 'client' | 'freelance'
  isOwnProfile?: boolean
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [filters, setFilters] = useState<ReviewFilters>({
    rating: null,
    sortBy: 'newest',
    hasResponse: null,
    verifiedOnly: false,
    keyword: ''
  })
// Dans votre composant ReviewSystem
const [canReview, setCanReview] = useState<boolean>(false)
const [reviewInfo, setReviewInfo] = useState<any>(null)
const [reviewCheckLoading, setReviewCheckLoading] = useState(false)

useEffect(() => {
  checkCanReview()
}, [userId])

const checkCanReview = async () => {
  if (isOwnProfile) return
  
  setReviewCheckLoading(true)
  try {
    const response = await fetch(`/api/users/${userId}/reviews/can-review`)
    const data = await response.json()
    
    if (data.canReview) {
      setCanReview(true)
      setReviewInfo(data)
    } else {
      setCanReview(false)
      // Afficher le message d'erreur
      console.log("Impossible de noter:", data.reason)
    }
  } catch (error) {
    console.error('Erreur vérification:', error)
  } finally {
    setReviewCheckLoading(false)
  }
}

// Modifier le bouton d'affichage du formulaire :
{!isOwnProfile && (
  <button
    onClick={() => {
      if (!canReview) {
        // Afficher un message expliquant pourquoi
        alert("Vous devez avoir eu un contrat récent avec cette personne pour laisser un avis")
        return
      }
      setShowReviewForm(true)
    }}
    disabled={!canReview || reviewCheckLoading}
    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
      canReview
        ? 'bg-sky-600 text-white hover:bg-sky-700'
        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
    }`}
  >
    <MessageSquare className="w-4 h-4" />
    {reviewCheckLoading ? 'Vérification...' : 'Laisser un avis'}
  </button>
)}
  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [userId, filters])

  const fetchReviews = async () => {
    try {
      const query = new URLSearchParams({
        ...filters,
        rating: filters.rating?.toString() || '',
        hasResponse: filters.hasResponse?.toString() || ''
      }).toString()

      const response = await fetch(`/api/users/${userId}/reviews?${query}`)
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/reviews/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSubmitReview = async (reviewData: any) => {
    try {
      const response = await fetch(`/api/users/${userId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })
      
      if (response.ok) {
        setShowReviewForm(false)
        fetchReviews()
        fetchStats()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/users/${userId}/reviews/${reviewId}/helpful`, {
        method: 'POST'
      })
      fetchReviews()
    } catch (error) {
      console.error('Error marking helpful:', error)
    }
  }

  const handleReport = async (reviewId: string, reason: string) => {
    try {
      await fetch(`/api/users/${userId}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
    } catch (error) {
      console.error('Error reporting review:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Avis clients</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {stats?.totalReviews || 0} avis vérifiés
            </p>
          </div>
          
          {!isOwnProfile && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Laisser un avis
            </button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Note moyenne */}
            <div className="text-center">
              <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.floor(stats.averageRating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Note moyenne
              </p>
            </div>

            {/* Taux de recommandation */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2 flex items-center justify-center gap-2">
                {stats.recommendationRate}%
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Recommandent
              </p>
            </div>

            {/* Distribution des notes */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                Distribution des notes
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{rating}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            >
              <option value="newest">Plus récent</option>
              <option value="highest">Meilleures notes</option>
              <option value="lowest">Moins bonnes notes</option>
              <option value="helpful">Plus utiles</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.rating || ''}
              onChange={(e) => setFilters({...filters, rating: e.target.value ? parseInt(e.target.value) : null})}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            >
              <option value="">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles et plus</option>
              <option value="3">3 étoiles et plus</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={filters.verifiedOnly}
              onChange={(e) => setFilters({...filters, verifiedOnly: e.target.checked})}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="verifiedOnly" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Avis vérifiés uniquement
            </label>
          </div>

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les avis..."
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={() => handleHelpful(review.id)}
              onReport={(reason) => handleReport(review.id, reason)}
              isOwnProfile={isOwnProfile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {isOwnProfile 
              ? "Vous n'avez pas encore reçu d'avis."
              : "Soyez le premier à laisser un avis !"
            }
          </p>
        </div>
      )}

      {/* Formulaire de review */}
{showReviewForm && (
  <ReviewForm
    userId={userId}
    userRole={userRole}
    contractId={reviewInfo?.contract?.id} // ← PASSER LE contractId
    onSubmit={handleSubmitReview}
    onCancel={() => setShowReviewForm(false)}
  />
)}
    </div>
  )
}

// Composant de carte d'avis
function ReviewCard({ 
  review, 
  onHelpful, 
  onReport,
  isOwnProfile 
}: { 
  review: Review
  onHelpful: () => void
  onReport: (reason: string) => void
  isOwnProfile: boolean
}) {
  const [showFullComment, setShowFullComment] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const isLongComment = review.comment.length > 300

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {review.reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {review.reviewerName}
              </h4>
              {review.verified && (
                <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Vérifié
                </span>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400">
                • {review.reviewerRole === 'client' ? 'Client' : 'Freelancer'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span>
                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span>• Projet : {review.projectTitle}</span>
            </div>
          </div>
        </div>
{review.verified && (
  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs">
    <Shield className="w-3 h-3" />
    <span>Avis vérifié</span>
    <div className="ml-1 group relative">
      <span className="cursor-help">ℹ️</span>
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs text-gray-600 dark:text-gray-300 shadow-lg z-10">
        Cet avis provient d'une collaboration vérifiée avec paiement effectué
      </div>
    </div>
  </div>
)}
        {!isOwnProfile && (
          <div className="relative">
            <button
              onClick={() => setShowReportDialog(!showReportDialog)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <Flag className="w-4 h-4" />
            </button>
            
            {showReportDialog && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-3">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Signaler cet avis</h4>
                <div className="space-y-2 mb-3">
                  {['Inapproprié', 'Faux', 'Spam', 'Autre'].map((reason) => (
                    <label key={reason} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-sky-600"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onReport(reportReason)
                      setShowReportDialog(false)
                      setReportReason('')
                    }}
                    disabled={!reportReason}
                    className="flex-1 bg-red-600 text-white text-sm py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Signaler
                  </button>
                  <button
                    onClick={() => setShowReportDialog(false)}
                    className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Points forts */}
      {review.strengths.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {review.strengths.map((strength, index) => (
              <span
                key={index}
                className="bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commentaire */}
      <div className="mb-4">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {showFullComment ? review.comment : `${review.comment.substring(0, 300)}...`}
        </p>
        {isLongComment && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium mt-2"
          >
            {showFullComment ? 'Voir moins' : 'Lire la suite'}
          </button>
        )}
      </div>

      {/* Recommandation */}
      {review.wouldRecommend && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg">
            <ThumbsUp className="w-4 h-4" />
            <span className="font-medium">Recommandé</span>
          </div>
        </div>
      )}

      {/* Réponse (si existe) */}
      {review.response && (
        <div className="ml-8 pl-4 border-l-2 border-sky-200 dark:border-sky-800 mt-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold">
              R
            </div>
            <span className="font-medium text-slate-900 dark:text-white">Réponse</span>
            <span className="text-sm text-slate-500 dark:text-slate-500">
              {new Date(review.response.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {review.response.content}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onHelpful}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Utile ({review.helpfulCount})</span>
        </button>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
          {review.reviewerRole === 'client' && (
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              Client vérifié
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Projet terminé
          </span>
        </div>
      </div>
    </div>
  )
}

// Formulaire de review
function ReviewForm({ 
  userId, 
  userRole,
  contractId, // ← NOUVEAU
  onSubmit, 
  onCancel 
}: { 
  userId: string
  userRole: 'freelancer' | 'client' | 'freelance'
  contractId: string // ← NOUVEAU
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [strengths, setStrengths] = useState<string[]>([])
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [projectTitle, setProjectTitle] = useState('')

  const strengthOptions = userRole === 'freelancer' ? [
    'Communication excellente',
    'Travail de qualité',
    'Respect des délais',
    'Professionnalisme',
    'Créativité',
    'Expertise technique',
    'Flexibilité',
    'Transparence'
  ] : [
    'Brief clair',
    'Paiements ponctuels',
    'Communication fluide',
    'Disponibilité',
    'Respect du contrat',
    'Collaboration facile',
    'Retours constructifs',
    'Flexibilité'
  ]


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      rating,
      comment,
      strengths,
      wouldRecommend,
      projectTitle,
      reviewedId: userId,
      contractId, // ← AJOUTER ICI
    })
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Laisser un avis
            </h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Note globale
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-500 mt-2">
              <span>Pas satisfait</span>
              <span>Très satisfait</span>
            </div>
          </div>

          {/* Titre du projet */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Titre du projet concerné
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Ex: Développement d'application React"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800"
              required
            />
          </div>

          {/* Points forts */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Points forts (sélectionnez jusqu'à 3)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {strengthOptions.map((strength) => (
                <button
                  key={strength}
                  type="button"
                  onClick={() => {
                    if (strengths.includes(strength)) {
                      setStrengths(strengths.filter(s => s !== strength))
                    } else if (strengths.length < 3) {
                      setStrengths([...strengths, strength])
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm text-center transition-colors ${
                    strengths.includes(strength)
                      ? 'bg-sky-600 text-white border border-sky-600'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-sky-300 dark:hover:border-sky-600'
                  }`}
                >
                  {strength}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Votre avis détaillé
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Décrivez votre expérience de collaboration avec cette personne...
• Qu'est-ce qui a bien fonctionné ?
• Y a-t-il des points à améliorer ?
• Recommanderiez-vous cette personne à d'autres ?`}
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 resize-none"
              required
            />
          </div>

          {/* Recommandation */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
            />
            <label htmlFor="recommend" className="text-slate-700 dark:text-slate-300">
              Je recommande {userRole === 'freelancer' ? 'ce freelancer' : 'ce client'} à d'autres personnes
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Publier l'avis
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}