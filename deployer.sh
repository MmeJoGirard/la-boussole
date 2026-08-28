#!/bin/sh
# Déployer La Boussole sur GitHub Pages : construit le site puis pousse
# le résultat sur la branche gh-pages. Usage : npm run deploy
set -e
npm run build
cd dist
git init -b gh-pages -q
git add -A
git commit -m "Déploiement du site" -q
git push -f https://github.com/MmeJoGirard/la-boussole.git gh-pages
cd ..
rm -rf dist/.git
echo "Déployé! Le site sera à jour d'ici une minute ou deux."
