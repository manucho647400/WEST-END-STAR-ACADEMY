// src/db/users.ts
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query getOrCreateUser failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query getUsers failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function saveRegisteredUser(userData: {
  id?: string;
  uid?: string;
  email: string;
  name?: string;
  role?: string;
}) {
  try {
    const uid = userData.id || userData.uid || `usr-${Date.now()}`;
    const result = await db.insert(users)
      .values({
        uid,
        email: userData.email,
        name: userData.name || null,
        role: userData.role || 'facilitator',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: userData.email,
          name: userData.name || null,
          role: userData.role || 'facilitator',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query saveRegisteredUser failed:", error);
    return null;
  }
}
