export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
}

export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | null>;
  create(data: { email: string; passwordHash: string }): Promise<StoredUser>;
}
