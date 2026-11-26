/** Coupe les connexions en direct ouvertes avec une session. */
export abstract class SessionDisconnector {
  abstract disconnect(tokenHash: string): void;
}
