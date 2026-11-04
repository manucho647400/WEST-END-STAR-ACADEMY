import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';

export const ALL_WORKSPACE_SCOPES = [
  // Google Drive
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  // Gmail
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  // Google Classroom
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.announcements',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
  'https://www.googleapis.com/auth/classroom.topics',
  // Google Contacts (People API)
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.addresses.read',
  'https://www.googleapis.com/auth/user.birthday.read',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.gender.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  // Google Sheets
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const workspaceProvider = new GoogleAuthProvider();
ALL_WORKSPACE_SCOPES.forEach(scope => workspaceProvider.addScope(scope));

// In-memory token storage. NEVER save access tokens to localStorage or sessionStorage.
let inMemoryAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  id?: string;
}

/**
 * Listen for Firebase Auth state changes and notify listeners.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (inMemoryAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, inMemoryAccessToken);
      } else if (!isSigningIn) {
        inMemoryAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      inMemoryAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger official Google OAuth sign-in with full Workspace permissions (Drive, Gmail, Classroom).
 */
export const signInWithGoogleWorkspace = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No OAuth access token was returned by Google authentication.');
    }
    inMemoryAccessToken = credential.accessToken;
    return { user: result.user, accessToken: inMemoryAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out and clear in-memory token.
 */
export const signOutGoogleWorkspace = async () => {
  await auth.signOut();
  inMemoryAccessToken = null;
};

/**
 * Access token getter
 */
export const getGoogleAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

/**
 * Access token setter
 */
export const setGoogleAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};
