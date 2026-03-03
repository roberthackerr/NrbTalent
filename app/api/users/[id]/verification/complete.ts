import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { uploadToCloudinary } from "@/lib/storage/cloudinary"
import { uploadLocal } from "@/lib/storage/local"
import { sendVerificationSMS, sendVerificationEmailFallback } from "@/lib/sms/twilio"
import { sendVerificationEmail } from "@/lib/email/sendgrid"
import { verifyPaymentMethod, createSetupIntent } from "@/lib/payment/stripe"
import { emitVerificationUpdate } from "@/lib/notifications/websocket"

// POST: Submit verification
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if ((session.user as any).id !== params.id) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const formData = await request.formData()
    const type = formData.get("type") as string
    const userId = params.id
    const db = await getDatabase()

    // Vérifier s'il y a déjà une demande en attente
    const existingPending = await db.collection("verification_requests").findOne({
      userId,
      type,
      status: "pending"
    })

    if (existingPending) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande en attente pour ce type" },
        { status: 400 }
      )
    }

    // Gérer chaque type de vérification
    switch (type) {
      case "identity":
        return await handleIdentityVerification(formData, userId, db)
      case "phone":
        return await handlePhoneVerification(formData, userId, db)
      case "payment":
        return await handlePaymentVerification(formData, userId, db)
      default:
        return NextResponse.json({ error: "Type de vérification invalide" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Erreur lors de la soumission de vérification:", error)
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

async function handleIdentityVerification(formData: FormData, userId: string, db: any) {
  const files = formData.getAll("files") as File[]
  const documentType = formData.get("documentType") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const dateOfBirth = formData.get("dateOfBirth") as string
  const documentNumber = formData.get("documentNumber") as string
  const country = formData.get("country") as string

  // Validation
  if (files.length === 0) {
    throw new Error("Aucun document fourni")
  }

  // Valider les fichiers
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`)
    }
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux: ${file.name} (max 5MB)`)
    }
  }

  // Télécharger les fichiers
  const uploadedFiles = []
  for (const file of files) {
    try {
      // Utiliser Cloudinary si configuré, sinon stockage local
      let uploadedFile
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        uploadedFile = await uploadToCloudinary(file, `verifications/${userId}`)
      } else {
        uploadedFile = await uploadLocal(file, userId)
      }

      uploadedFiles.push({
        url: uploadedFile.url,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date()
      })
    } catch (error) {
      console.error("Erreur upload:", error)
      throw new Error(`Échec du téléchargement de ${file.name}`)
    }
  }

  // Récupérer l'utilisateur
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, name: 1 } }
  )

  // Créer la demande de vérification
  const verificationRequest = {
    userId,
    type: "identity",
    status: "pending",
    submittedAt: new Date(),
    identityDocuments: [{
      type: documentType,
      front: uploadedFiles[0]?.url,
      back: uploadedFiles[1]?.url,
      issuedCountry: country,
      number: documentNumber,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
    }],
    files: uploadedFiles,
    metadata: {
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent')
    }
  }

  const result = await db.collection("verification_requests").insertOne(verificationRequest)
  const requestId = result.insertedId

  // Envoyer email de confirmation
  if (user?.email) {
    await sendVerificationEmail(
      user.email,
      user.name || "Utilisateur",
      "identité",
      "pending"
    )
  }

  // Notifier les admins (optionnel)
  await notifyAdmins("Nouvelle vérification d'identité", userId)

  // Émettre une mise à jour WebSocket
  emitVerificationUpdate(userId, "identity", "pending", { requestId: requestId.toString() })

  return NextResponse.json({
    success: true,
    message: "Documents soumis avec succès",
    requestId: requestId.toString(),
    estimatedTime: "24-48 heures"
  })
}

async function handlePhoneVerification(formData: FormData, userId: string, db: any) {
  const phoneNumber = formData.get("phoneNumber") as string
  const countryCode = formData.get("countryCode") as string || "+33"

  if (!phoneNumber) {
    throw new Error("Numéro de téléphone requis")
  }

  // Valider le format du numéro
  const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`
  if (fullNumber.length < 10) {
    throw new Error("Numéro de téléphone invalide")
  }

  // Générer un code de vérification
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Récupérer l'utilisateur pour l'email
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, name: 1 } }
  )

  // Créer la demande de vérification
  const verificationRequest = {
    userId,
    type: "phone",
    status: "pending",
    submittedAt: new Date(),
    phoneNumber: fullNumber,
    verificationCode,
    codeExpiresAt,
    attempts: 0,
    maxAttempts: 3
  }

  await db.collection("verification_requests").insertOne(verificationRequest)

  try {
    // Essayer d'envoyer un SMS
    await sendVerificationSMS(fullNumber, verificationCode)
  } catch (smsError) {
    console.error("Échec SMS, tentative par email:", smsError)
    
    // Fallback: envoyer par email
    if (user?.email) {
      await sendVerificationEmailFallback(
        user.email,
        fullNumber,
        verificationCode
      )
    }
  }

  return NextResponse.json({
    success: true,
    message: "Code de vérification envoyé",
    expiresIn: 10,
    fallback: user?.email ? `Vérifiez aussi votre email ${user.email}` : undefined
  })
}

async function handlePaymentVerification(formData: FormData, userId: string, db: any) {
  const paymentMethodId = formData.get("paymentMethodId") as string
  const paymentMethodType = formData.get("paymentMethodType") as string || "card"

  if (!paymentMethodId) {
    throw new Error("Méthode de paiement requise")
  }

  // Vérifier avec Stripe (ou simulation)
  const paymentInfo = await verifyPaymentMethod(paymentMethodId, userId)

  if (!paymentInfo) {
    throw new Error("Échec de la vérification du paiement")
  }

  // Mettre à jour l'utilisateur
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        "payment.verified": true,
        "payment.lastFour": paymentInfo.lastFour,
        "payment.brand": paymentInfo.brand,
        "payment.verifiedAt": new Date()
      }
    }
  )

  // Créer un enregistrement de vérification
  await db.collection("verification_requests").insertOne({
    userId,
    type: "payment",
    status: "approved",
    submittedAt: new Date(),
    reviewedAt: new Date(),
    paymentMethod: paymentMethodType,
    lastFourDigits: paymentInfo.lastFour,
    provider: "stripe",
    metadata: paymentInfo
  })

  // Mettre à jour le statut global
  await updateVerificationStatus(userId, "payment", true, db)

  // Notifier l'utilisateur
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, name: 1 } }
  )

  if (user?.email) {
    await sendVerificationEmail(
      user.email,
      user.name || "Utilisateur",
      "paiement",
      "approved",
      `Visa •••• ${paymentInfo.lastFour}`
    )
  }

  return NextResponse.json({
    success: true,
    message: "Méthode de paiement vérifiée",
    paymentInfo
  })
}

async function updateVerificationStatus(userId: string, type: string, isVerified: boolean, db: any) {
  const status = await db.collection("verification_status").findOne({ userId })
  
  const updateData: any = {
    [type]: isVerified,
    lastUpdated: new Date()
  }

  if (!status) {
    // Créer un nouveau statut
    const newStatus = {
      userId,
      email: false,
      phone: false,
      identity: false,
      payment: false,
      [type]: isVerified,
      lastUpdated: new Date()
    }

    // Calculer le statut global
    const verifiedCount = [
      newStatus.email,
      newStatus.phone,
      newStatus.identity,
      newStatus.payment
    ].filter(Boolean).length

    newStatus.overallStatus = verifiedCount >= 3 ? 'fully_verified' :
                              verifiedCount >= 1 ? 'partially_verified' : 'unverified'
    newStatus.level = Math.min(3, verifiedCount)

    await db.collection("verification_status").insertOne(newStatus)
  } else {
    // Mettre à jour le statut existant
    const updatedStatus = { ...status, ...updateData }
    
    const verifiedCount = [
      updatedStatus.email,
      updatedStatus.phone,
      updatedStatus.identity,
      updatedStatus.payment
    ].filter(Boolean).length

    updateData.overallStatus = verifiedCount >= 3 ? 'fully_verified' :
                               verifiedCount >= 1 ? 'partially_verified' : 'unverified'
    updateData.level = Math.min(3, verifiedCount)

    await db.collection("verification_status").updateOne(
      { userId },
      { $set: updateData }
    )
  }

  // Mettre à jour le statut verified principal si identité vérifiée
  if (type === "identity" && isVerified) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verified: true, verifiedAt: new Date() } }
    )
  }
}

async function notifyAdmins(title: string, userId: string) {
  // Implémentez votre système de notification aux admins
  // Ex: Webhook, email, ou notification dans la base de données
  console.log(`Notification admin: ${title} - User: ${userId}`)
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}