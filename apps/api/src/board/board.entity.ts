export class Board {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly version = 0,
  ) {}

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  getName(): string {
    return this.name;
  }
}
