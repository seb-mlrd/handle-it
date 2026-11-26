export class Comment {
  constructor(
    private readonly id: string,
    private readonly cardId: string,
    private readonly authorId: string | null,
    private readonly authorName: string | null,
    private readonly body: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date | null = null,
  ) {}

  /** Nouveau commentaire ; le nom de l'auteur est relu après l'écriture. */
  static write(id: string, cardId: string, authorId: string, body: string, at: Date): Comment {
    return new Comment(id, cardId, authorId, null, body, at);
  }

  getId(): string {
    return this.id;
  }

  getCardId(): string {
    return this.cardId;
  }

  /** `null` quand le compte de l'auteur a été supprimé. */
  getAuthorId(): string | null {
    return this.authorId;
  }

  /** `null` quand l'auteur n'est plus membre du board. */
  getAuthorName(): string | null {
    return this.authorName;
  }

  getBody(): string {
    return this.body;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /** `null` tant que le commentaire n'a pas été modifié. */
  getUpdatedAt(): Date | null {
    return this.updatedAt;
  }

  isWrittenBy(userId: string): boolean {
    return this.authorId === userId;
  }

  /** Renvoie le commentaire avec son nouveau texte, daté de la modification. */
  edit(body: string, at: Date): Comment {
    return new Comment(
      this.id,
      this.cardId,
      this.authorId,
      this.authorName,
      body,
      this.createdAt,
      at,
    );
  }
}
