"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Clock, Upload, Shield, Mail, Phone, CreditCard, RefreshCw, Key, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VerificationTabProps {
  user: any
  dict: any
  lang: string
}

type VerificationStatus = "none" | "pending" | "approved" | "rejected" | "expired"

export function VerificationTab({ user, dict, lang }: VerificationTabProps) {
  const [loading, setLoading] = useState(false)
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>("none")
  const [resendLoading, setResendLoading] = useState(false)
  const [idDocuments, setIdDocuments] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // États pour la vérification SMS
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "")
  const [verificationCode, setVerificationCode] = useState("")
  const [smsLoading, setSmsLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Charger le statut de vérification d'identité
  useEffect(() => {
    fetchIdentityVerificationStatus()
  }, [])

  const fetchIdentityVerificationStatus = async () => {
    try {
      const response = await fetch('/api/users/verification/identity/status')
      if (response.ok) {
        const data = await response.json()
        setIdVerificationStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching identity status:', error)
    }
  }

  // Vérifier le statut de l'email
  const getEmailVerificationStatus = (): VerificationStatus => {
    if (!user) return "none"
    
    if (user.emailVerified) {
      return "approved"
    }
    
    if (user.emailVerificationToken && user.emailVerificationExpires) {
      const now = new Date()
      const expires = new Date(user.emailVerificationExpires)
      
      if (expires > now) {
        return "pending"
      } else {
        return "expired"
      }
    }
    
    return "none"
  }

  // Vérifier le statut du téléphone
  const getPhoneVerificationStatus = (): VerificationStatus => {
    if (!user) return "none"
    
    if (user.phoneVerified) {
      return "approved"
    }
    
    if (user.phoneVerificationToken && user.phoneVerificationExpires) {
      const now = new Date()
      const expires = new Date(user.phoneVerificationExpires)
      
      if (expires > now) {
        return "pending"
      } else {
        return "expired"
      }
    }
    
    return "none"
  }

  const emailStatus = getEmailVerificationStatus()
  const phoneStatus = getPhoneVerificationStatus()

  // Countdown pour le renvoi de SMS
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const verifications = [
    {
      id: "email",
      name: dict?.verification?.email || "Email",
      description: user?.email || dict?.verification?.notSet || "Non défini",
      status: emailStatus,
      icon: Mail,
      required: true,
      canResend: emailStatus === "expired" || emailStatus === "none"
    },
    {
      id: "phone",
      name: dict?.verification?.phone || "Numéro de Téléphone",
      description: getPhoneDescription(),
      status: phoneStatus,
      icon: Phone,
      required: false,
      canResend: phoneStatus === "expired" || phoneStatus === "none" || !user?.phone,
      hasVerification: true
    },
    {
      id: "identity",
      name: dict?.verification?.identity || "Identité",
      description: dict?.verification?.identityDoc || "Document d'identité",
      status: idVerificationStatus,
      icon: Shield,
      required: true,
      canResend: false
    },
    {
      id: "payment",
      name: dict?.verification?.paymentMethod || "Méthode de Paiement",
      description: dict?.verification?.paymentMethodDesc || "Carte bancaire ou compte",
      status: "none" as VerificationStatus,
      icon: CreditCard,
      required: false,
      canResend: false
    }
  ]

  function getPhoneDescription() {
    if (!user?.phone) return dict?.verification?.notConfigured || "Non configuré"
    
    switch (phoneStatus) {
      case "approved":
        return `${user.phone} ✓`
      case "pending":
        return `${user.phone} (${dict?.verification?.codeSent || "code envoyé"})`
      case "expired":
        return `${user.phone} (${dict?.verification?.codeExpired || "code expiré"})`
      default:
        return `${user.phone} (${dict?.verification?.notVerified || "non vérifié"})`
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error(dict?.verification?.errors?.emailNotAvailable || "Email non disponible")
      return
    }

    setResendLoading(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || dict?.verification?.success?.emailSent || "Email de vérification envoyé!")
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(data.error || dict?.verification?.errors?.sendFailed || "Erreur lors de l'envoi")
      }
    } catch (error) {
      toast.error(dict?.verification?.errors?.serverError || "Erreur de connexion au serveur")
    } finally {
      setResendLoading(false)
    }
  }

  // Envoyer le code SMS
  const handleSendSMS = async () => {
    if (!phoneNumber) {
      toast.error(dict?.verification?.errors?.enterPhone || "Veuillez entrer un numéro de téléphone")
      return
    }

    // Validation basique du numéro
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error(dict?.verification?.errors?.invalidPhone || "Numéro de téléphone invalide")
      return
    }

    setSmsLoading(true)
    try {
      const response = await fetch('/api/auth/send-phone-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(dict?.verification?.success?.smsSent || "Code de vérification envoyé par SMS!")
        setSmsSent(true)
        setCountdown(60)
      } else {
        toast.error(data.error || dict?.verification?.errors?.smsFailed || "Erreur lors de l'envoi du SMS")
      }
    } catch (error) {
      console.error('Erreur SMS:', error)
      toast.error(dict?.verification?.errors?.serverError || "Erreur de connexion au serveur")
    } finally {
      setSmsLoading(false)
    }
  }

  // Vérifier le code SMS
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(dict?.verification?.errors?.enterValidCode || "Veuillez entrer un code à 6 chiffres")
      return
    }

    setVerifyLoading(true)
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          code: verificationCode 
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(dict?.verification?.success?.phoneVerified || "Numéro de téléphone vérifié avec succès!")
        setPhoneVerificationOpen(false)
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(data.error || dict?.verification?.errors?.invalidCode || "Code de vérification incorrect")
      }
    } catch (error) {
      toast.error(dict?.verification?.errors?.serverError || "Erreur de connexion au serveur")
    } finally {
      setVerifyLoading(false)
    }
  }

  // Gérer la sélection des documents
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validation des fichiers
    const invalidFiles = fileArray.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf'
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return !isValidType || !isValidSize
    })

    if (invalidFiles.length > 0) {
      toast.error(dict?.verification?.errors?.invalidFiles || "Certains fichiers ne respectent pas les formats acceptés (JPG, PNG, PDF, max 5MB)")
      return
    }

    setIdDocuments(fileArray)
  }

  // Soumettre les documents d'identité
  const handleVerificationUpload = async () => {
    if (idDocuments.length === 0) {
      toast.error(dict?.verification?.errors?.selectFiles || "Veuillez sélectionner des documents")
      return
    }

    setLoading(true)
    setUploadProgress(0)

    const formData = new FormData()
    idDocuments.forEach((file, index) => {
      formData.append(`document_${index}`, file)
    })

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch('/api/users/verification/identity', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()
      
      if (response.ok) {
        setIdVerificationStatus("pending")
        toast.success(dict?.verification?.success?.documentsSubmitted || "Documents soumis! Nous les examinerons sous 24-48 heures.")
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading documents:', error)
      toast.error(dict?.verification?.errors?.uploadFailed || "Erreur lors du téléchargement des documents")
    } finally {
      setLoading(false)
      setUploadProgress(0)
      clearInterval(progressInterval)
    }
  }

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "expired":
        return <XCircle className="h-5 w-5 text-orange-500" />
      default:
        return <XCircle className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">{dict?.verification?.status?.verified || "Vérifié"}</Badge>
      case "pending":
        return (
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800"
          >
            {dict?.verification?.status?.pending || "En attente"}
          </Badge>
        )
      case "rejected":
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
          >
            {dict?.verification?.status?.rejected || "Rejeté"}
          </Badge>
        )
      case "expired":
        return (
          <Badge 
            variant="outline" 
            className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
          >
            {dict?.verification?.status?.expired || "Expiré"}
          </Badge>
        )
      default:
        return (
          <Badge 
            variant="outline" 
            className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          >
            {dict?.verification?.status?.notVerified || "Non vérifié"}
          </Badge>
        )
    }
  }

  const getEmailDescription = () => {
    if (!user?.email) return dict?.verification?.notSet || "Non défini"
    
    switch (emailStatus) {
      case "approved":
        return `${user.email} ✓`
      case "pending":
        return `${user.email} (${dict?.verification?.pending || "en attente"})`
      case "expired":
        return `${user.email} (${dict?.verification?.expired || "lien expiré"})`
      default:
        return `${user.email} (${dict?.verification?.notVerified || "non vérifié"})`
    }
  }

  const completedVerifications = verifications.filter(v => v.status === "approved").length
  const requiredVerifications = verifications.filter(v => v.required).length
  const verificationProgress = requiredVerifications > 0 ? (completedVerifications / requiredVerifications) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Progression de la vérification */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>{dict?.verification?.title || "Statut de Vérification"}</CardTitle>
          <CardDescription>
            {dict?.verification?.subtitle || "Complétez les vérifications pour débloquer toutes les fonctionnalités"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {dict?.verification?.progress || "Progression des vérifications requises"}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {completedVerifications}/{requiredVerifications} {dict?.verification?.completed || "complétées"}
              </span>
            </div>
            <Progress value={verificationProgress} className="h-2 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {verifications.map((verification) => {
              const Icon = verification.icon
              const isEmail = verification.id === "email"
              const isPhone = verification.id === "phone"
              const isIdentity = verification.id === "identity"
              
              return (
                <div
                  key={verification.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    verification.status === "approved" && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
                    verification.status === "pending" && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20",
                    verification.status === "expired" && "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
                    verification.status === "rejected" && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                    verification.status === "none" && "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        verification.status === "approved" && "bg-green-100 dark:bg-green-900/30",
                        verification.status === "pending" && "bg-yellow-100 dark:bg-yellow-900/30",
                        verification.status === "expired" && "bg-orange-100 dark:bg-orange-900/30",
                        verification.status === "rejected" && "bg-red-100 dark:bg-red-900/30",
                        verification.status === "none" && "bg-slate-100 dark:bg-slate-800"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          verification.status === "approved" && "text-green-600 dark:text-green-400",
                          verification.status === "pending" && "text-yellow-600 dark:text-yellow-400",
                          verification.status === "expired" && "text-orange-600 dark:text-orange-400",
                          verification.status === "rejected" && "text-red-600 dark:text-red-400",
                          verification.status === "none" && "text-slate-600 dark:text-slate-400"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {verification.name}
                          {verification.required && (
                            <span className="ml-1 text-xs text-red-500">*</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(verification.status)}
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {isEmail ? getEmailDescription() : verification.description}
                  </p>

                  {/* Actions pour l'email */}
                  {isEmail && verification.canResend && emailStatus !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="w-full"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          {dict?.common?.sending || "Envoi..."}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2" />
                          {emailStatus === "expired" 
                            ? (dict?.verification?.resendLink || "Renvoyer le lien") 
                            : (dict?.verification?.verifyEmail || "Vérifier l'email")}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Actions pour le téléphone */}
                  {isPhone && (
                    <Dialog open={phoneVerificationOpen} onOpenChange={setPhoneVerificationOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant={phoneStatus === "approved" ? "outline" : "default"}
                          className={cn(
                            "w-full",
                            phoneStatus === "approved" 
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          {phoneStatus === "approved" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-2" />
                              {dict?.verification?.verified || "Vérifié"}
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-3 w-3 mr-2" />
                              {user?.phone 
                                ? (dict?.verification?.verify || "Vérifier") 
                                : (dict?.verification?.addNumber || "Ajouter un numéro")}
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            {dict?.verification?.smsVerification || "Vérification par SMS"}
                          </DialogTitle>
                          <DialogDescription>
                            {dict?.verification?.smsDescription || "Entrez votre numéro de téléphone pour recevoir un code de vérification"}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{dict?.verification?.phoneNumber || "Numéro de téléphone"}</label>
                            <Input
                              placeholder="+33 6 12 34 56 78"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              disabled={smsSent || smsLoading}
                            />
                            <p className="text-xs text-slate-500">
                              {dict?.verification?.phoneFormat || "Format international requis. Ex: +33 pour la France"}
                            </p>
                          </div>

                          {smsSent && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                {dict?.verification?.verificationCode || "Code de vérification"}
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="123456"
                                  value={verificationCode}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    if (value.length <= 6) {
                                      setVerificationCode(value)
                                    }
                                  }}
                                  maxLength={6}
                                  className="text-center text-lg tracking-widest"
                                />
                                <Button
                                  onClick={handleVerifyCode}
                                  disabled={verifyLoading || verificationCode.length !== 6}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {verifyLoading ? dict?.common?.verifying || "Vérification..." : dict?.common?.verify || "Vérifier"}
                                </Button>
                              </div>
                              <p className="text-xs text-slate-500">
                                {dict?.verification?.enterCode || "Entrez le code à 6 chiffres reçu par SMS"}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            {!smsSent ? (
                              <Button
                                onClick={handleSendSMS}
                                disabled={smsLoading || !phoneNumber}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                {smsLoading ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    {dict?.common?.sending || "Envoi..."}
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    {dict?.verification?.sendCode || "Envoyer le code"}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={handleSendSMS}
                                disabled={smsLoading || countdown > 0}
                                variant="outline"
                                className="flex-1"
                              >
                                {countdown > 0 ? (
                                  `${dict?.verification?.resendIn || "Renvoyer dans"} ${countdown}s`
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {dict?.verification?.resend || "Renvoyer le code"}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {smsSent && (
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                📱 {dict?.verification?.codeSentTo?.replace('{phone}', phoneNumber) || `Un code de vérification a été envoyé au ${phoneNumber}`}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {dict?.verification?.smsNotReceived || "Si vous ne recevez pas le SMS, vérifiez le numéro et réessayez."}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Messages d'information */}
                  {isEmail && emailStatus === "expired" && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      {dict?.verification?.expiredMessage || "Le lien de vérification a expiré. Veuillez en demander un nouveau."}
                    </p>
                  )}
                  
                  {isEmail && emailStatus === "pending" && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      {dict?.verification?.pendingMessage || "Vérifiez votre boîte mail et cliquez sur le lien de vérification."}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vérification d'identité */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {dict?.verification?.identityTitle || "Vérification d'Identité"}
          </CardTitle>
          <CardDescription>
            {dict?.verification?.identityDescription || "Vérifiez votre identité pour renforcer la confiance et débloquer les fonctionnalités premium"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {idVerificationStatus === "none" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  {dict?.verification?.whyVerify || "Pourquoi vérifier votre identité ?"}
                </h4>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{dict?.verification?.benefit1 || "Badge vérifié sur votre profil"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{dict?.verification?.benefit2 || "Accès aux projets à haute valeur"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{dict?.verification?.benefit3 || "Visibilité accrue dans les résultats de recherche"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{dict?.verification?.benefit4 || "Confiance accrue des clients"}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {dict?.verification?.acceptedDocuments || "Documents acceptés"}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="font-medium text-sm">{dict?.verification?.passport || "Passeport"}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-medium text-sm">{dict?.verification?.idCard || "Carte d'identité"}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="font-medium text-sm">{dict?.verification?.drivingLicense || "Permis de conduire"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {dict?.verification?.uploadDocuments || "Télécharger les documents d'identité"}
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {dict?.verification?.acceptedFormats || "Formats acceptés : JPG, PNG, PDF (max 5MB par fichier)"}
                  </p>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleDocumentSelect}
                      disabled={loading}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                    />
                    
                    {idDocuments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {idDocuments.length} {dict?.verification?.filesSelected || "fichier(s) sélectionné(s)"}
                        </p>
                        <div className="space-y-1">
                          {idDocuments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center text-slate-500">{uploadProgress}%</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={handleVerificationUpload}
                        disabled={loading || idDocuments.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {loading ? dict?.common?.uploading || "Téléchargement..." : dict?.common?.submit || "Soumettre"}
                      </Button>
                      {idDocuments.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setIdDocuments([])}
                          disabled={loading}
                        >
                          {dict?.common?.clear || "Effacer"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {idVerificationStatus === "pending" && (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-500">{dict?.verification?.inProgress || "Vérification en Cours"}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {dict?.verification?.inProgressMessage || "Nous examinons vos documents. Cela prend généralement 24-48 heures."}
                </p>
              </div>
            </div>
          )}

          {idVerificationStatus === "approved" && (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">{dict?.verification?.verified || "Identité Vérifiée"}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {dict?.verification?.verifiedMessage || "Votre identité a été vérifiée avec succès ! Votre profil affiche maintenant le badge vérifié."}
                </p>
              </div>
            </div>
          )}

          {idVerificationStatus === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-red-500/50 bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-500">{dict?.verification?.rejected || "Vérification Rejetée"}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {dict?.verification?.rejectedMessage || "Les documents fournis étaient illisibles ou incomplets. Veuillez télécharger des images plus claires."}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIdVerificationStatus("none")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {dict?.common?.tryAgain || "Réessayer"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}