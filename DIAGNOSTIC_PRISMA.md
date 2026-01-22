# Diagnostic Prisma - Connexion Supabase

## Problème
```
Error: P1001: Can't reach database server at `db.drkfyyyeebvjdzdaiyxf.supabase.co:5432`
```

## Causes possibles

### 1. Projet Supabase en pause
- Les projets Supabase gratuits se mettent en pause après inactivité
- **Solution** : Va sur https://supabase.com/dashboard et réactive ton projet

### 2. Connection string incorrecte
- La `DATABASE_URL` dans `.env` peut être incorrecte
- **Solution** : Vérifie le format ci-dessous

### 3. Paramètres SSL manquants
- Supabase nécessite SSL pour les connexions directes
- **Solution** : Ajoute `?sslmode=require` à la fin de l'URL

## Solution : Vérifier et corriger DATABASE_URL

### Étape 1 : Récupérer la bonne connection string

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet "Logiciel TariScope"
3. Va dans **Settings** → **Database**
4. Scroll jusqu'à **"Connection string"**
5. Sélectionne l'onglet **"URI"** (pas "Connection pooling")
6. Copie la connection string

### Étape 2 : Format correct

La connection string doit ressembler à :
```
postgresql://postgres:[YOUR-PASSWORD]@db.drkfyyyeebvjdzdaiyxf.supabase.co:5432/postgres?sslmode=require
```

⚠️ **Important** :
- Remplace `[YOUR-PASSWORD]` par le **vrai mot de passe** de ta base de données
- Ajoute `?sslmode=require` à la fin (obligatoire pour Supabase)

### Étape 3 : Mettre à jour .env

Dans ton fichier `.env`, mets à jour :

```env
DATABASE_URL="postgresql://postgres:TON_MOT_DE_PASSE@db.drkfyyyeebvjdzdaiyxf.supabase.co:5432/postgres?sslmode=require"
```

### Étape 4 : Tester la connexion

```bash
npx prisma db push
```

Si ça fonctionne, tu verras :
```
✔ Generated Prisma Client
✔ Pushed to database
```

## Alternative : Migration manuelle (plus simple)

Si Prisma ne fonctionne toujours pas, tu peux ajouter la colonne `photoUrl` manuellement :

1. Va dans Supabase → **SQL Editor**
2. Exécute :
```sql
ALTER TABLE "Competitor" 
ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
```

## Vérifier que le projet Supabase est actif

1. Va sur https://supabase.com/dashboard
2. Si tu vois un bouton "Resume project" ou "Restore", clique dessus
3. Attends quelques secondes que le projet se réactive
