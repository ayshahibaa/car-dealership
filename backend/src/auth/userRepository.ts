export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
}

/**
 * What authService needs from storage — nothing more. Keeping this narrow
 * (rather than passing the whole PrismaClient around) is what makes
 * authService testable with a plain in-memory fake, no database required.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | null>;
  create(data: { email: string; passwordHash: string }): Promise<StoredUser>;
}
