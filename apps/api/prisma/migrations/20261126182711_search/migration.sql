-- Recherche plein texte en français, insensible aux accents : « pates » trouve « Pâtes ».
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Une configuration nommée est IMMUTABLE, contrairement à unaccent() : elle peut servir
-- dans une colonne générée. Les accents sont retirés avant la racinisation française.
CREATE TEXT SEARCH CONFIGURATION "french_unaccent" (COPY = french);
ALTER TEXT SEARCH CONFIGURATION "french_unaccent"
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;

-- Le titre pèse plus que la description dans le classement.
ALTER TABLE "cards" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('french_unaccent', "title"), 'A') ||
  setweight(to_tsvector('french_unaccent', "description"), 'B')
) STORED;

ALTER TABLE "comments" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector('french_unaccent', "body")
) STORED;

-- CreateIndex
CREATE INDEX "cards_search_vector_idx" ON "cards" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "comments_search_vector_idx" ON "comments" USING GIN ("search_vector");
