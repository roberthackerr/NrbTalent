// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Structure par défaut des préférences
const DEFAULT_PREFERENCES = [
  { id: "email-messages", enabled: true, channel: 'email' },
  { id: "email-projects", enabled: true, channel: 'email' },
  { id: "email-applications", enabled: true, channel: 'email' },
  { id: "email-offers", enabled: true, channel: 'email' },
  { id: "email-payments", enabled: true, channel: 'email' },
  { id: "email-marketing", enabled: false, channel: 'email' },
  { id: "push-messages", enabled: true, channel: 'push' },
  { id: "push-projects", enabled: true, channel: 'push' },
  { id: "push-deadlines", enabled: true, channel: 'push' },
  { id: "push-bids", enabled: true, channel: 'push' },
  { id: "push-reviews", enabled: true, channel: 'push' },
  { id: "security-login", enabled: true, channel: 'email' },
  { id: "security-password", enabled: true, channel: 'email' },
  { id: "security-2fa", enabled: true, channel: 'email' },
  { id: "security-verification", enabled: true, channel: 'email' },
  { id: "payment-invoices", enabled: true, channel: 'email' },
  { id: "payment-withdrawals", enabled: true, channel: 'email' },
  { id: "payment-escrow", enabled: true, channel: 'email' },
  { id: "payment-disputes", enabled: true, channel: 'email' },
  { id: "social-connections", enabled: true, channel: 'in_app' },
  { id: "social-follows", enabled: true, channel: 'in_app' },
  { id: "social-endorsements", enabled: true, channel: 'in_app' },
  { id: "social-events", enabled: false, channel: 'email' },
];

// GET /api/notifications/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = session.user.id;

    // Chercher les préférences de l'utilisateur
    let userPrefs = await db.collection('notification_preferences').findOne({ 
      userId: userId
    });

    // Si pas de préférences, créer les préférences par défaut
    if (!userPrefs) {
      userPrefs = {
        _id: new ObjectId(),
        userId: userId,
        preferences: DEFAULT_PREFERENCES,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('notification_preferences').insertOne(userPrefs);
    }

    return NextResponse.json({ 
      preferences: userPrefs.preferences || DEFAULT_PREFERENCES 
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update a single preference
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = session.user.id;
    const { settingId, enabled } = await request.json();

    if (!settingId || enabled === undefined) {
      return NextResponse.json(
        { error: 'settingId and enabled are required' }, 
        { status: 400 }
      );
    }

    // Mettre à jour une préférence spécifique
    const result = await db.collection('notification_preferences').findOneAndUpdate(
      { userId: userId },
      { 
        $set: { 
          'preferences.$[elem].enabled': enabled,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'elem.id': settingId }],
        returnDocument: 'after',
        upsert: true
      }
    );

    // Si le document n'existait pas, créer avec les préférences par défaut modifiées
    if (!result) {
      const defaultPrefs = DEFAULT_PREFERENCES.map(p => 
        p.id === settingId ? { ...p, enabled } : p
      );
      
      await db.collection('notification_preferences').insertOne({
        _id: new ObjectId(),
        userId: userId,
        preferences: defaultPrefs,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preference updated successfully' 
    });

  } catch (error) {
    console.error('Error updating preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/notifications/preferences/bulk - Update multiple preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = session.user.id;
    const { preferences } = await request.json();

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'preferences array is required' }, 
        { status: 400 }
      );
    }

    // Récupérer les préférences existantes
    const existingPrefs = await db.collection('notification_preferences').findOne({ 
      userId: userId 
    });

    if (existingPrefs) {
      // Mettre à jour chaque préférence
      const bulkOps = preferences.map((pref: { id: string; enabled: boolean }) => ({
        updateOne: {
          filter: { userId: userId, 'preferences.id': pref.id },
          update: { $set: { 'preferences.$.enabled': pref.enabled, updatedAt: new Date() } }
        }
      }));

      await db.collection('notification_preferences').bulkWrite(bulkOps);
    } else {
      // Créer nouvelles préférences
      const newPrefs = DEFAULT_PREFERENCES.map(defaultPref => {
        const updated = preferences.find(p => p.id === defaultPref.id);
        return updated ? { ...defaultPref, enabled: updated.enabled } : defaultPref;
      });

      await db.collection('notification_preferences').insertOne({
        _id: new ObjectId(),
        userId: userId,
        preferences: newPrefs,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preferences updated successfully' 
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}