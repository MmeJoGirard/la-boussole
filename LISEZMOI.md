# La Boussole : données fictives et application de démonstration

Plateforme de suivi des interventions pour élèves à risque.

**Site web public : https://mmejogirard.github.io/la-boussole/**
Plan complet du projet : https://claude.ai/code/artifact/ce7ad0ce-8789-42fe-8d4e-dad546e9e84b

Dépôt GitHub : https://github.com/MmeJoGirard/la-boussole (public).
Pour mettre le site à jour après une modification :

```bash
npm run deploy
```

(Le `git push` sur main sauvegarde le code; c'est `npm run deploy` qui reconstruit et publie le site.)

**Toutes les personnes dans ces fichiers sont inventées.** Aucun vrai nom, aucun vrai courriel (domaines fictifs : eleves-demo.ca, courriel-demo.ca, conseil-demo.ca).

## Fichiers

- `generer-donnees.mjs` : le script qui fabrique les données. Il utilise une graine fixe, donc chaque exécution redonne exactement les mêmes données.
- `donnees-fictives.json` : le résultat, prêt à être importé dans la maquette React (phase 1) puis dans Supabase (phase 2).

## Pour régénérer (après une modification du script)

```bash
node generer-donnees.mjs
```

## Ce que contient donnees-fictives.json

| Bloc | Nombre | Détails |
|---|---|---|
| `eleves` | 50 | 7e à 12e année (9-9-8-8-8-8), groupes 7A/7B, 8A/8B, 9A à 12A, courriels, année scolaire 2026-2027, semestre 1 |
| `tuteurs` | 87 | Deux parents, familles monoparentales, familles recomposées, avec liens vers les élèves |
| `personnel` | 28 | 20 enseignants (français, maths, histoire, géo, éduc phys, arts), 2 ERRÉ, 3 éducation spécialisée, 1 direction, 2 adjoints |
| `cours` | 36 | Le lien groupe-matière-enseignant. Les élèves de 7e-8e ont 5 enseignants, ceux de 9e-12e ont 4 membres du personnel |
| `signalements` | 20 | 10 de niveau 1, 6 de niveau 2, 4 de niveau 3, avec statuts variés (nouveau, pris en charge, transféré direction, clos), l'indicateur « ça va / à risque », des observations de collègues et des interventions datées |
| `audit` | 74 | Connexions, créations de signalements et interventions, horodatées |

## Décisions reflétées dans les données

- Parents : courriels seulement, pas de comptes.
- Clôture : par l'ERRÉ ou la direction, avec note de clôture obligatoire.
- Cycle de vie : une année scolaire (septembre à juin 2026-2027).
- Confidentialité enseignants : un enseignant voit seulement ses propres commentaires et le champ `indicateurCaVa`.
- Code couleur des rôles : bleu pâle enseignants, bleu moyen ERRÉ / éducation spécialisée (ES), bleu foncé direction.

## L'application (phase 1, réalisée)

L'application React + Vite est dans ce dossier. Pour la lancer :

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5321

Ce qu'elle contient, en mode démonstration (choix de profil au lieu du SSO, courriels simulés dans la boîte de l'entête) :

- **Vue enseignant** : tableau de bord personnel (mes élèves, suivis actifs, mes signalements, « à contribuer »), alerte quand un collègue signale un de mes élèves, légende des étapes du suivi, liste des élèves avec nombre de signalements et indicateur « ça va / à risque ». L'enseignant·e qui a signalé peut mettre à jour son signalement (étape 2 : parents contactés, suivi fait, note). Confidentialité : un enseignant voit seulement ses propres commentaires, jamais le détail du dossier.
- **Formulaire de signalement** : nom prérempli avec le compte, menus déroulants (cours, groupe, élève), types multiples (cases à cocher), niveau d'urgence 0 à 4 avec descriptions, case ES (précochée si l'élève est identifié ES) qui déclenche un courriel automatique à l'éducation spécialisée.
- **Vue ERRÉ / éducation spécialisée** : tableau de bord visuel (diagrammes circulaires par type et par statut, barres par année et par niveau d'urgence, totaux), filtres à sélection multiple (élève, année, étape, urgence, statut), export vers Excel (CSV), cartes de totaux cliquables, fiche complète du dossier avec plan de sécurité et adaptations, interventions par étape (1 à 3, avec légende), indicateur « À risque · suivi », transfert à la direction, clôture de cycle avec note obligatoire. Les couleurs des graphiques sont validées pour le daltonisme avec le vérificateur du guide de visualisation.
- **Calendrier** (ERRÉ, éducation spécialisée et direction) : vue mensuelle des signalements et des interventions, navigation entre les mois, détail cliquable de chaque journée avec lien direct vers le dossier.
- **Vue direction** : tout ce qui précède, plus le journal d'audit complet et les suggestions de courriel aux parents.
- **Réactif** : téléphone, tablette, ordinateur.
- **Deux thèmes** : clair et sombre, bascule dans l'entête, choix mémorisé par le navigateur. Chaque thème a sa propre palette de graphiques, validée pour le daltonisme sur sa propre surface.

## Prochaine étape (phase 2 du plan)

Brancher Supabase (région Canada Central) : tables, règles RLS, journal d'audit persistant. Ensuite, phase 3 : SSO Google Workspace et courriels réels.
