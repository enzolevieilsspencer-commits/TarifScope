# API Tarifscope (Next.js)

Ce projet Next.js expose uniquement des **routes de lecture/écriture en base** (auth + CRUD).  
Le **scraping** (métadonnées hôtels, prix) est géré par un **backend Python** séparé.  
Front et back **communiquent via la base de données** (PostgreSQL / Supabase).

## Flux

1. **Arrivée** → L’hôtel du client est créé ou récupéré (1 hôtel par utilisateur).
2. **Ensuite** → Le client peut ajouter ses concurrents (max 5).
3. **Métadonnées** (nom, lieu, étoiles, photo) → extraites par le **backend Python** (ex. depuis une URL Booking).
4. **Prix** (notre hôtel + concurrents) → récupérés par le **backend Python** ; les résultats sont écrits en base (`RateSnapshot`, `RunLog`).

## Routes (Next.js)

### Hôtel

| Méthode | Route        | Description                                                                       |
| ------- | ------------ | --------------------------------------------------------------------------------- |
| GET     | `/api/hotel` | Récupère ou crée l’hôtel de l’utilisateur                                         |
| PUT     | `/api/hotel` | Met à jour l’hôtel (données envoyées par le front ; pas de scraping côté Next.js) |

### Concurrents (max 5 par hôtel)

| Méthode | Route                           | Description                                                                                       |
| ------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET     | `/api/competitors`              | Liste des concurrents (hors "mon-hôtel")                                                          |
| POST    | `/api/competitors`              | Ajoute un concurrent (refus si déjà 5)                                                            |
| PUT     | `/api/competitors/[id]`         | Met à jour un concurrent                                                                          |
| DELETE  | `/api/competitors/[id]`         | Supprime un concurrent (pas "mon-hôtel")                                                          |
| POST    | `/api/competitors/extract-info` | Appelle le scraper Railway `POST /extract` pour extraire nom/lieu/étoiles/photo (voir ci‑dessous) |

### Scans / prix

| Méthode | Route               | Description                                                      |
| ------- | ------------------- | ---------------------------------------------------------------- |
| POST    | `/api/scans/run`    | Stub : indique que le scan est géré par le backend Python        |
| GET     | `/api/scans/status` | Statut du dernier scan (lu en base, écrit par le backend Python) |

### Cron

| Méthode | Route            | Description                                                      |
| ------- | ---------------- | ---------------------------------------------------------------- |
| GET     | `/api/cron/scan` | Retourne `skipped` : les scans sont lancés par le backend Python |

### Dashboard & historique

| Méthode | Route                    | Description                                                      |
| ------- | ------------------------ | ---------------------------------------------------------------- |
| GET     | `/api/dashboard/data`    | Données dashboard (prix par concurrent et par date, lus en base) |
| GET     | `/api/dashboard/dates`   | Liste des dates disponibles                                      |
| GET     | `/api/dashboard/by-date` | Données pour une date donnée                                     |
| GET     | `/api/history`           | Historique des prix (lus en base)                                |

## Base de données (partagée avec le backend Python)

- **Hotel** : 1 par utilisateur (`userId` = Supabase Auth).
- **Competitor** : max 5 “vrais” concurrents par hôtel ; un competitor `tags = "mon-hôtel"` peut être utilisé pour stocker les prix de l’hôtel du client.
- **RateSnapshot** : un enregistrement par (concurrent ou mon-hôtel) × date × run ; rempli par le **backend Python**.
- **RunLog** : trace chaque exécution de scan ; rempli par le **backend Python**.

Le backend Python doit se connecter à la même base (variable d’environnement `DATABASE_URL` / config Supabase) et écrire dans ces tables pour que le dashboard et l’historique affichent les prix.

## Extraction d’infos (URL Booking → nom, lieu, étoiles, photo)

- **Next.js** : `POST /api/competitors/extract-info` avec body `{ "url": "https://www.booking.com/..." }`.
- Si la variable d’environnement **`SCRAPER_API_URL`** est définie (ex. `https://ton-service.up.railway.app`), Next.js appelle le scraper :
  - **`POST {SCRAPER_API_URL}/extract`**
  - Body : `{ "url": "https://..." }`
  - Réponse attendue : `{ "name": "...", "location": "...", "stars": 4, "photoUrl": "..." }` (champs optionnels)
- Si `SCRAPER_API_URL` n’est pas défini ou si l’appel échoue, le front peut quand même ajouter le concurrent avec un nom par défaut.
