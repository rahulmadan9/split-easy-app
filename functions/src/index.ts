import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: Auto-create user profile when a new user signs up
 * Triggered by Firebase Authentication onCreate event
 */
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    // Create user profile document in Firestore
    await db.collection('users').doc(uid).set({
      displayName: displayName || email?.split('@')[0] || 'User',
      email: email || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User profile created for ${uid}`, { email });
  } catch (error) {
    functions.logger.error('Error creating user profile', { uid, error });
    throw error;
  }
});

/**
 * Cloud Function: Clean up user data when a user is deleted
 * Triggered by Firebase Authentication onDelete event
 */
export const deleteUserData = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    // Delete push tokens
    const tokensSnap = await db.collection('users').doc(uid).collection('pushTokens').get();
    const batch = db.batch();
    tokensSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Delete user profile
    await db.collection('users').doc(uid).delete();

    functions.logger.info(`User data deleted for ${uid}`);
  } catch (error) {
    functions.logger.error('Error deleting user data', { uid, error });
    throw error;
  }
});

// ─── Push Notification Helpers ───────────────────────────────────────────────

/**
 * Get push tokens for all members of a group except the actor
 */
async function getGroupMemberTokens(groupId: string, excludeUserId: string): Promise<string[]> {
  const membersSnap = await db.collection('groups').doc(groupId).collection('members').get();
  const memberIds = membersSnap.docs
    .map((d) => d.data().userId as string)
    .filter((id) => id !== excludeUserId);

  const tokens: string[] = [];
  for (const memberId of memberIds) {
    const tokensSnap = await db.collection('users').doc(memberId).collection('pushTokens').get();
    tokensSnap.docs.forEach((d) => {
      const token = d.data().token;
      if (token) tokens.push(token);
    });
  }

  return tokens;
}

/**
 * Send push notification to Expo push tokens
 */
async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      functions.logger.error('Push notification send failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    functions.logger.error('Error sending push notifications', { error });
  }
}

// ─── FCM Notification Triggers ───────────────────────────────────────────────

/**
 * Notify group members when a new expense or settlement is created
 */
export const onExpenseCreated = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snap) => {
    const expense = snap.data();
    if (!expense) return;

    const groupId = expense.groupId;
    const paidBy = expense.paidBy;
    const paidByName = expense.paidByName || 'Someone';
    const amount = expense.amount || 0;

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    const tokens = await getGroupMemberTokens(groupId, paidBy);

    if (expense.isSettlement) {
      await sendPushNotifications(
        tokens,
        'Payment Recorded',
        `${paidByName} settled ${formattedAmount}`,
        { screen: '/(tabs)/balance' }
      );
    } else {
      const description = expense.description || 'an expense';
      await sendPushNotifications(
        tokens,
        'New Expense Added',
        `${paidByName} paid ${formattedAmount} for ${description}`,
        { screen: '/(tabs)/expenses' }
      );
    }
  });

/**
 * Notify group members when someone joins
 */
export const onMemberJoined = functions.firestore
  .document('groups/{groupId}/members/{memberId}')
  .onCreate(async (snap, context) => {
    const member = snap.data();
    if (!member) return;

    const groupId = context.params.groupId;
    const newMemberName = member.userName || 'Someone';
    const newMemberId = member.userId;

    // Get group name
    const groupDoc = await db.collection('groups').doc(groupId).get();
    const groupData = groupDoc.data();
    if (!groupData || groupData.isPersonal) return;

    const groupName = groupData.name || 'a group';

    const tokens = await getGroupMemberTokens(groupId, newMemberId);

    await sendPushNotifications(
      tokens,
      'New Member',
      `${newMemberName} joined ${groupName}`,
      { screen: '/(tabs)' }
    );
  });

/**
 * Monthly notification for pending recurring expenses
 * Runs at 9 AM on the 1st of every month
 */
export const onRecurringDue = functions.pubsub
  .schedule('0 9 1 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Find all active recurring expenses
    const recurringSnap = await db
      .collection('recurringExpenses')
      .where('isActive', '==', true)
      .get();

    // Group by groupId
    const groupRecurring = new Map<string, number>();
    for (const doc of recurringSnap.docs) {
      const data = doc.data();
      const groupId = data.groupId;

      // Check if already confirmed this month
      const confirmSnap = await db
        .collection('recurringConfirmations')
        .where('recurringExpenseId', '==', doc.id)
        .where('monthKey', '==', monthKey)
        .limit(1)
        .get();

      if (confirmSnap.empty) {
        groupRecurring.set(groupId, (groupRecurring.get(groupId) || 0) + 1);
      }
    }

    // Send notifications per group
    for (const [groupId, pendingCount] of groupRecurring) {
      const membersSnap = await db.collection('groups').doc(groupId).collection('members').get();

      const allTokens: string[] = [];
      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.data().userId;
        const tokensSnap = await db.collection('users').doc(memberId).collection('pushTokens').get();
        tokensSnap.docs.forEach((d) => {
          const token = d.data().token;
          if (token) allTokens.push(token);
        });
      }

      await sendPushNotifications(
        allTokens,
        'Recurring Expenses Due',
        `You have ${pendingCount} recurring expense${pendingCount > 1 ? 's' : ''} to confirm this month`,
        { screen: '/(tabs)/recurring' }
      );
    }

    functions.logger.info(`Recurring due notifications sent for ${monthKey}`);
  });
