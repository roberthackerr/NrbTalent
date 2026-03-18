// app/api/notifications/preferences/route.ts - Version simplifiée
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DEFAULT_PREFERENCES = {
  "email-messages": true,
  "email-projects": true,
  "email-applications": true,
  "email-offers": true,
  "email-payments": true,
  "email-marketing": false,
  "push-messages": true,
  "push-projects": true,
  "push-deadlines": true,
  "push-bids": true,
  "push-reviews": true,
  "security-login": true,
  "security-password": true,
  "security-2fa": true,
  "security-verification": true,
  "payment-invoices": true,
  "payment-withdrawals": true,
  "payment-escrow": true,
  "payment-disputes": true,
  "social-connections": true,
  "social-follows": true,
  "social-endorsements": true,
  "social-events": false
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { notificationPreferences: 1 } }
    );

    const preferences = user?.notificationPreferences || DEFAULT_PREFERENCES;

    // Convertir en format array pour le frontend
    const preferencesArray = Object.entries(preferences).map(([id, enabled]) => ({
      id,
      enabled
    }));

    return NextResponse.json({ preferences: preferencesArray });

  } catch (error) {
    console.error('Erreur GET preferences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);
    
    const body = await request.json();
    const { settingId, enabled } = body;

    if (!settingId || enabled === undefined) {
      return NextResponse.json(
        { error: 'settingId et enabled sont requis' }, 
        { status: 400 }
      );
    }

    // Mettre à jour directement dans l'utilisateur
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          [`notificationPreferences.${settingId}`]: enabled,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur PUT preferences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);
    
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'preferences array est requis' }, 
        { status: 400 }
      );
    }

    // Construire l'objet de mise à jour
    const updateObject: any = { updatedAt: new Date() };
    preferences.forEach((p: any) => {
      if (p.id && p.enabled !== undefined) {
        updateObject[`notificationPreferences.${p.id}`] = p.enabled;
      }
    });

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateObject }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur POST preferences:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' }, 
      { status: 500 }
    );
  }
}