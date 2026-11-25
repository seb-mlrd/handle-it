/** Port indiquant si la base de données répond. */
export abstract class DatabaseProbe {
  abstract isReachable(): Promise<boolean>;
}
