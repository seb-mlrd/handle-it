# handle-it

Gestion de tâches en tableaux, colonnes et cartes.

## Prérequis

- Node.js 24.11 ou plus
- pnpm 11
- Docker

## Installation

```sh
pnpm install
cp .env.example .env
```

Dans `.env`, remplacer `a-remplacer` par un mot de passe alphanumérique, aux deux endroits. Puis :

```sh
docker compose up -d --wait
pnpm --filter @handle-it/api run database:deploy
pnpm dev
```

- Front : http://localhost:5173
- État de l'API : http://localhost:3001/api/health

## Commandes

| Commande                                            | Rôle                                 |
| --------------------------------------------------- | ------------------------------------ |
| `pnpm dev`                                          | Lancer l'API et le front             |
| `pnpm lint`                                         | Vérifier le code et le formatage     |
| `pnpm format`                                       | Formater le code                     |
| `pnpm typecheck`                                    | Vérifier les types                   |
| `pnpm test`                                         | Lancer les tests                     |
| `pnpm build`                                        | Construire le projet                 |
| `pnpm --filter @handle-it/api run database:migrate` | Créer une migration en développement |
| `docker compose down`                               | Arrêter la base, données conservées  |

## Structure

- `apps/api` : API NestJS
- `apps/web` : front React
- `packages/contracts` : schémas et types partagés
