import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  // Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials in cloud environments
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

const TARGET_EMAIL = 'dheerajsinghbaghel1306@gmail.com';

async function seedAdmin() {
  const shouldResetPassword = process.argv.includes('--reset-password');
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;

  console.log(`Starting idempotent seed for admin: ${TARGET_EMAIL}`);

  let userRecord: admin.auth.UserRecord | null = null;
  let userExists = false;

  try {
    userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    userExists = true;
    console.log(`Existing user found for ${TARGET_EMAIL} (UID: ${userRecord.uid})`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      userExists = false;
    } else {
      console.error('Error fetching user:', err);
      process.exit(1);
    }
  }

  if (userExists && userRecord) {
    // Preserve password unless --reset-password is explicitly passed
    if (shouldResetPassword) {
      if (!initialPassword) {
        console.error('Error: --reset-password flag provided but INITIAL_ADMIN_PASSWORD env var is missing.');
        process.exit(1);
      }
      await auth.updateUser(userRecord.uid, {
        password: initialPassword,
      });
      console.log('Admin password updated successfully.');
    } else {
      console.log('Preserving existing password (pass --reset-password to overwrite).');
    }

    // Merge existing custom claims to ensure independent claims
    const existingClaims = userRecord.customClaims || {};
    const updatedClaims = {
      ...existingClaims,
      admin: true,
      role: existingClaims.creator ? 'creator' : 'admin',
    };

    await auth.setCustomUserClaims(userRecord.uid, updatedClaims);
    console.log(`Merged custom claims set: admin=true${existingClaims.creator ? ', creator=true' : ''}`);

    // Update or create user profile doc in Firestore
    await db.collection('users').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: TARGET_EMAIL,
        displayName: userRecord.displayName || 'System Admin',
        role: updatedClaims.role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('Admin document in Firestore synchronized successfully.');
  } else {
    // Create new admin user
    if (!initialPassword) {
      console.error('Error: User does not exist and INITIAL_ADMIN_PASSWORD environment variable is not set.');
      console.error('Please set INITIAL_ADMIN_PASSWORD before running the seed script.');
      process.exit(1);
    }

    const newUser = await auth.createUser({
      email: TARGET_EMAIL,
      password: initialPassword,
      emailVerified: true,
      displayName: 'System Admin',
    });

    console.log(`Created new admin user with UID: ${newUser.uid}`);

    // Set custom claims
    await auth.setCustomUserClaims(newUser.uid, {
      admin: true,
      role: 'admin',
    });

    // Write Firestore record
    await db.collection('users').doc(newUser.uid).set({
      uid: newUser.uid,
      email: TARGET_EMAIL,
      displayName: 'System Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('Admin user initialized with admin custom claim.');
  }

  console.log('Seed completed successfully.');
}

seedAdmin().catch((err) => {
  console.error('Unhandled seed error:', err);
  process.exit(1);
});
