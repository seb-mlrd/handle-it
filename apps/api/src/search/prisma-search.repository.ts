import type { SearchMatch } from '@handle-it/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import { Prisma } from '../generated/prisma/client.js';
import { Excerpt, HEADLINE_TRANSLATION, MATCH_END, MATCH_START } from './excerpt.js';
import { SearchRepository, type SearchCriteria } from './search.repository.js';
import type { SearchResult } from './search-result.js';

const MARK_OPTIONS = `StartSel=${MATCH_START}, StopSel=${MATCH_END}`;
/** Un titre est court : il est rendu en entier. */
const TITLE_HEADLINE_OPTIONS = `${MARK_OPTIONS}, HighlightAll=true`;
/** Une description ou un commentaire peut être long : seul le passage utile est gardé. */
const TEXT_HEADLINE_OPTIONS = [
  MARK_OPTIONS,
  'MaxWords=25',
  'MinWords=10',
  'ShortWord=2',
  'MaxFragments=1',
  'FragmentDelimiter=" … "',
].join(', ');

interface SearchRow {
  readonly cardId: string;
  readonly cardTitle: string;
  readonly boardId: string;
  readonly boardName: string;
  readonly columnName: string;
  readonly matchedIn: SearchMatch;
  readonly highlighted: string;
}

@Injectable()
export class PrismaSearchRepository extends SearchRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async search(criteria: SearchCriteria): Promise<SearchResult[]> {
    const rows = await this.transactionContext
      .getClient()
      .$queryRaw<SearchRow[]>(this.buildQuery(criteria));
    return rows.map(({ highlighted, ...row }) => ({
      ...row,
      excerpt: Excerpt.fromHighlighted(highlighted),
    }));
  }

  /**
   * Les index GIN trouvent d'abord les cartes et commentaires correspondants ; l'appartenance au
   * board est vérifiée dans la requête même. Les cartes trouvées portent déjà ce qu'il faut pour
   * filtrer et trier : seules les cartes gardées sont relues, pour leur description et l'extrait.
   */
  private buildQuery(criteria: SearchCriteria): Prisma.Sql {
    const textSearchQuery = criteria.query.toTextSearchQuery();
    return Prisma.sql`
      WITH search AS (SELECT to_tsquery('french_unaccent', ${textSearchQuery}) AS query),
      comment_hits AS (
        SELECT comment.card_id, max(ts_rank(comment.search_vector, search.query)) AS rank
        FROM comments comment, search
        WHERE comment.search_vector @@ search.query
        GROUP BY comment.card_id
      ),
      -- Calculées une seule fois, même quand les statistiques de la table sont en retard.
      hits AS MATERIALIZED (
        SELECT card.id, card.column_id, card.title, card.due_on,
          ts_rank(card.search_vector, search.query) AS rank
        FROM cards card, search
        WHERE card.search_vector @@ search.query
        UNION ALL
        SELECT card.id, card.column_id, card.title, card.due_on, comment_hits.rank
        FROM comment_hits
        JOIN cards card ON card.id = comment_hits.card_id
      ),
      ranked AS (
        SELECT card.id, card.title, board.id AS board_id, board.name AS board_name,
          board_column.name AS column_name, max(card.rank) AS rank
        FROM hits card
        JOIN columns board_column ON board_column.id = card.column_id
        JOIN boards board ON board.id = board_column.board_id
        JOIN memberships membership
          ON membership.board_id = board.id AND membership.user_id = ${criteria.userId}::uuid
        WHERE TRUE ${this.buildFilters(criteria)}
        GROUP BY card.id, card.title, board.id, board_column.id
        ORDER BY rank DESC, card.title, card.id
        LIMIT ${criteria.limit}
      )
      SELECT ranked.id AS "cardId", ranked.title AS "cardTitle", ranked.board_id AS "boardId",
        ranked.board_name AS "boardName", ranked.column_name AS "columnName",
        best.matched_in AS "matchedIn",
        ts_headline('french_unaccent',
          translate(best.text, ${HEADLINE_TRANSLATION.from}, ${HEADLINE_TRANSLATION.to}),
          search.query,
          CASE best.matched_in
            WHEN 'title' THEN ${TITLE_HEADLINE_OPTIONS}
            ELSE ${TEXT_HEADLINE_OPTIONS}
          END) AS highlighted
      FROM ranked
      JOIN cards kept ON kept.id = ranked.id
      CROSS JOIN search
      CROSS JOIN LATERAL (${this.buildBestMatch()}) best
      ORDER BY ranked.rank DESC, ranked.title, ranked.id`;
  }

  /** Le titre d'abord, puis la description, puis le commentaire le plus pertinent. */
  private buildBestMatch(): Prisma.Sql {
    return Prisma.sql`
      SELECT matched_in, text FROM (
        SELECT 1 AS priority, 'title' AS matched_in, ranked.title AS text
        WHERE to_tsvector('french_unaccent', ranked.title) @@ search.query
        UNION ALL
        SELECT 2, 'description', kept.description
        WHERE to_tsvector('french_unaccent', kept.description) @@ search.query
        UNION ALL
        (SELECT 3, 'comment', comment.body FROM comments comment
          WHERE comment.card_id = ranked.id AND comment.search_vector @@ search.query
          ORDER BY ts_rank(comment.search_vector, search.query) DESC, comment.created_at
          LIMIT 1)
        UNION ALL
        -- Les mots se répartissent entre titre et description : la description donne l'extrait.
        SELECT 4, 'description', ranked.title || E'\n' || kept.description
      ) candidates
      ORDER BY priority
      LIMIT 1`;
  }

  private buildFilters({ boardId, due, labelIds }: SearchCriteria): Prisma.Sql {
    const filters: Prisma.Sql[] = [];
    if (boardId) filters.push(Prisma.sql`board.id = ${boardId}::uuid`);
    if (due?.isWithoutDate()) filters.push(Prisma.sql`card.due_on IS NULL`);
    const onOrAfter = due?.getOnOrAfter();
    if (onOrAfter) filters.push(Prisma.sql`card.due_on >= ${onOrAfter.getValue()}::date`);
    const before = due?.getBefore();
    if (before) filters.push(Prisma.sql`card.due_on < ${before.getValue()}::date`);
    if (labelIds.length > 0) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM card_labels card_label
        WHERE card_label.card_id = card.id AND card_label.label_id = ANY(${[...labelIds]}::uuid[])
      )`);
    }
    return filters.length === 0 ? Prisma.empty : Prisma.sql`AND ${Prisma.join(filters, ' AND ')}`;
  }
}
