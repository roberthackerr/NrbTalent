#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DEV_BRANCH="dev"
MAIN_BRANCH="main"

echo -e "${YELLOW}🚀 Merge $DEV_BRANCH → $MAIN_BRANCH${NC}"

# Vérifier si on a des changements non commités
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo -e "${RED}❌ Tu as des changements non commités${NC}"
  exit 1
fi

# Aller sur main
echo -e "${YELLOW}🔄 Passage sur $MAIN_BRANCH...${NC}"
git checkout $MAIN_BRANCH || exit 1

# Pull latest main
echo -e "${YELLOW}⬇️ Mise à jour de $MAIN_BRANCH...${NC}"
git pull origin $MAIN_BRANCH || exit 1

# Confirmation utilisateur (IMPORTANT)
echo -e "${YELLOW}⚠️ Tu vas merger $DEV_BRANCH dans $MAIN_BRANCH (PRODUCTION)${NC}"
read -p "Continuer ? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo -e "${RED}❌ Merge annulé${NC}"
  exit 0
fi

# Merge
echo -e "${YELLOW}🔀 Merge en cours...${NC}"
git merge $DEV_BRANCH

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Conflits détectés ! Résous-les manuellement.${NC}"
  exit 1
fi

# Push vers main
echo -e "${YELLOW}☁️ Push vers origin $MAIN_BRANCH...${NC}"
git push origin $MAIN_BRANCH

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Merge réussi !${NC}"
  echo -e "${GREEN}🚀 Déploiement en production lancé sur Vercel${NC}"
else
  echo -e "${RED}❌ Échec du push${NC}"
  exit 1
fi