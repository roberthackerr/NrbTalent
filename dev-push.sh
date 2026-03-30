#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BRANCH="dev"

echo -e "${YELLOW}🚀 Début du déploiement sur $BRANCH...${NC}"

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo -e "${RED}❌ Tu n'es pas sur la branche $BRANCH (actuelle: $CURRENT_BRANCH)${NC}"
  exit 1
fi

# Ajouter les fichiers
echo -e "${YELLOW}📦 Ajout des fichiers...${NC}"
git add .

# Vérifier changements
if git diff --cached --quiet; then
  echo -e "${YELLOW}⚠️ Aucun changement à commiter${NC}"
  exit 0
fi

# Message commit
commit_message="dev: $(date '+%Y-%m-%d %H:%M:%S')"

echo -e "${YELLOW}✏️ Commit: $commit_message${NC}"
git commit -m "$commit_message"

# Push vers dev
echo -e "${YELLOW}☁️ Push vers origin $BRANCH...${NC}"
git push origin $BRANCH

# Résultat
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Deploy DEV réussi${NC}"
  echo -e "${GREEN}🔗 Vérifie ton preview sur Vercel${NC}"
else
  echo -e "${RED}❌ Échec du push${NC}"
  exit 1
fi