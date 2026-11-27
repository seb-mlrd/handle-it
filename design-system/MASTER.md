# Design system — handle-it

Source de vérité visuelle du front. Les valeurs vivent dans [`apps/web/src/index.css`](../apps/web/src/index.css) (`@theme`) ; ce document dit **comment** les utiliser.

Si `design-system/pages/<page>.md` existe, ses règles priment sur celles-ci pour cette page.

## Intention

Outil de productivité utilisé longtemps et souvent : sobre, dense sans être serré, le contenu (les cartes) avant le décor. Un seul accent, jaune, réservé à l'action principale. Clair et sombre conçus ensemble.

## Couleurs

Toutes les couleurs sont des tokens sémantiques définis avec `light-dark(clair, sombre)`. La palette Tailwind par défaut est désactivée (`--color-*: initial`) : `bg-black`, `text-gray-500`, etc. **ne génèrent rien**. Une couleur manquante s'ajoute comme token, jamais en valeur brute dans un composant.

| Token           | Rôle                                                    | Clair     | Sombre    |
| --------------- | ------------------------------------------------------- | --------- | --------- |
| `canvas`        | Fond de page, fond des cartes dans une colonne, survols | `#f3f5f4` | `#131615` |
| `surface`       | Colonnes, panneaux, modales, champs                     | `#ffffff` | `#1c201e` |
| `ink`           | Texte principal, anneau de focus                        | `#191d1b` | `#edf1ee` |
| `muted`         | Texte secondaire, aides, métadonnées                    | `#565f5a` | `#a5afa9` |
| `line`          | Séparateurs et bordures décoratives                     | `#d5dbd7` | `#343a37` |
| `control`       | Bordure des éléments interactifs (champs, boutons)      | `#78827c` | `#77817b` |
| `accent`        | Fond de l'action principale                             | `#f5bd1f` | `#f5bd1f` |
| `accent-strong` | Survol de l'action principale                           | `#e3aa05` | `#ffd04d` |
| `on-accent`     | Texte sur `accent`                                      | `#191d1b` | `#191d1b` |
| `danger`        | Erreurs, actions destructrices                          | `#b3261e` | `#ff9c93` |
| `on-danger`     | Texte sur `danger`                                      | `#ffffff` | `#191d1b` |
| `scrim`         | Voile derrière une modale (`backdrop:bg-scrim`)         | noir 60 % | noir 60 % |
| `shadow`        | Couleur de l'ombre `shadow-overlay`                     | noir 14 % | noir 60 % |

### Labels

Huit paires `label-<couleur>` / `on-label-<couleur>` (gray, red, orange, yellow, green, teal, blue, pink) : fond pâle et texte foncé en clair, l'inverse en sombre. Toujours utilisées par paire, via `LABEL_COLOR_CLASSES`. Le nom du label est toujours affiché : la couleur seule ne porte jamais l'information.

### Contrastes mesurés (WCAG)

| Paire                  | Clair    | Sombre  | Exigence             |
| ---------------------- | -------- | ------- | -------------------- |
| `ink` / `surface`      | 17,0     | 14,5    | 4,5 (texte)          |
| `muted` / `canvas`     | 6,0      | 8,1     | 4,5 (texte)          |
| `control` / `canvas`   | 3,6      | 4,5     | 3 (composant)        |
| `on-accent` / `accent` | 9,9      | 9,9     | 4,5 (texte)          |
| `danger` / `canvas`    | 6,0      | 9,0     | 4,5 (texte)          |
| `on-danger` / `danger` | 6,5      | 8,5     | 4,5 (texte)          |
| `line` / `surface`     | 1,4      | 1,4     | décoratif uniquement |
| Labels (texte / fond)  | 7,0–10,4 | 8,5–9,9 | 4,5, visé 7          |

Conséquences :

- `line` ne délimite **jamais** un élément interactif : utiliser `control`.
- `accent` n'est **jamais** une couleur de texte ou d'icône sur `surface` en clair (1,7:1) : c'est un fond.
- Tout nouveau token est mesuré dans les deux thèmes avant d'être ajouté ici.

## Typographie

Police système (`--font-sans`) : rien à charger, rendu natif sur chaque plateforme.

| Rôle                             | Classes                                       | Exemple                          |
| -------------------------------- | --------------------------------------------- | -------------------------------- |
| Titre de page (`h1`)             | `text-display font-bold`                      | « Mes tableaux », nom du tableau |
| Titre de panneau / modale (`h2`) | `text-xl font-bold`                           | Panneau de carte, confirmation   |
| Titre de colonne, logo           | `text-lg font-semibold` / `font-bold`         | En-tête de colonne               |
| Corps                            | `text-base` (16 px)                           | Titres de cartes, champs         |
| Libellés, aides, métadonnées     | `text-sm` (+ `font-medium` pour les libellés) | Labels de formulaire             |

- Jamais en dessous de `text-sm` (14 px) ; le corps et les champs restent à 16 px (évite le zoom automatique d'iOS).
- Graisses : 700 titres, 600 boutons et titres de colonne, 500 libellés, 400 corps.
- Titres longs saisis par l'utilisateur : `wrap-anywhere` plutôt que tronquer.

## Espacements et mise en page

- Échelle Tailwind de 4 px (`--spacing: 0.25rem`). Rythme courant : `gap-1`/`gap-2` dans un composant, `gap-3`/`gap-4` entre éléments, `gap-6`/`gap-8` entre sections.
- Pages : `px-6 py-10`, largeur `max-w-6xl` pour les grilles (tableaux), `max-w-3xl` pour les listes de lecture (recherche).
- Modales : `p-6` ; centrée `max-w-md`, latérale `max-w-lg` pleine hauteur (`h-dvh`).
- Points de rupture : `sm` et `lg` de Tailwind uniquement, mobile d'abord.

## Formes

| Token             | Valeur | Usage                              |
| ----------------- | ------ | ---------------------------------- |
| `rounded-control` | 8 px   | Boutons, champs, cartes du tableau |
| `rounded-card`    | 12 px  | Colonnes, panneaux, modales, menus |
| `rounded-full`    | —      | Pastilles (labels, compteurs)      |

## Élévation

Le relief vient d'abord de l'alternance `canvas` / `surface` et des bordures. Une seule ombre, `shadow-overlay`, réservée à ce qui **flotte au-dessus** de la page : aperçu de glisser-déposer, menus déroulants. Pas d'ombre sur les cartes ou colonnes au repos. Les modales n'ont pas d'ombre : le voile `scrim` suffit.

## Superposition (z-index)

| Niveau | Usage                                                             |
| ------ | ----------------------------------------------------------------- |
| `z-10` | Menus déroulants dans le flux                                     |
| `z-50` | Lien d'évitement                                                  |
| —      | Modales : couche native de `<dialog>` (top layer), pas de z-index |

Pas d'autre valeur sans l'ajouter à ce tableau.

## Interaction

- Cibles d'au moins 44 × 44 px : `h-11` / `size-11` / `min-h-11` ; icônes plus petites dans une zone de 44 px.
- `cursor-pointer` sur tout ce qui est cliquable ; `cursor-grab` / `cursor-grabbing` pour le glisser-déposer.
- Focus : contour global `2px solid ink` décalé de 2 px (`:focus-visible`). Ne jamais le retirer.
- Désactivé : attribut `disabled` natif + `opacity-60` + `cursor-default`.
- Boutons (`shared/ui/button.tsx`) : `primary` (une seule par écran), `secondary`, `ghost` pour les actions discrètes, `danger` pour les suppressions, toujours précédées d'une `ConfirmDialog`.
- Champs : libellé visible, aide sous le champ, erreur sous le champ reliée par `aria-describedby` (`FieldLayout`).

## Mouvement

- Transitions de couleur : `transition-colors` (150 ms par défaut de Tailwind).
- Toujours accompagnées de `motion-reduce:transition-none` ; le glisser-déposer coupe aussi ses transitions quand le mouvement est réduit.
- Pas d'animation décorative.

## Icônes

SVG en ligne, `viewBox="0 0 24 24"`, `size-5`, couleur `currentColor`, `aria-hidden="true"` avec un libellé accessible sur le bouton parent. Pas d'emoji comme icône. Avant d'ajouter une bibliothèque d'icônes, en discuter (règle « nouvelle dépendance »).

## Interdits

- Couleur brute (`#hex`, `bg-black`, `text-gray-*`) dans un composant.
- Texte en `accent` ou bordure interactive en `line`.
- Information portée par la couleur seule.
- Ombres autres que `shadow-overlay`, z-index hors du tableau.
- Retrait du contour de focus, cibles sous 44 px.
