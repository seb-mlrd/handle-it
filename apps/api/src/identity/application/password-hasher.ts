export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract verify(passwordHash: string, password: string): Promise<boolean>;
  /** Coûte autant que `verify`, quand aucun compte ne correspond. */
  abstract simulateVerification(password: string): Promise<void>;
}
