# vanilla-flowering-web

Website for the Vanilla Flowering project.


les données Mocks Identifiants:

  { identifiant: 'admin', motDePasse: 'admin123', profil: 'super-administrateur' },
  { identifiant: 'agronome', motDePasse: 'agro123', profil: 'utilisateur' },
  { identifiant: 'partenaire', motDePasse: 'visiteur123', profil: 'visiteur' },

## Manuel : rapports IA avec Ollama (développement)

La page **Rapports IA** (menu « Analyses & rapports ») génère un brouillon de rapport avec un modèle de langage qui tourne
**sur votre machine**, via [Ollama](https://ollama.com). Aucune clé API, aucun appel vers un service cloud : le texte et les
données restent en local.

Le modèle utilisé par défaut est `qwen2.5:0.5b`. C'est un petit modèle : il écrit un français approximatif et peut inventer
des chiffres. Le rapport est donc toujours un **brouillon à relire**.

### 1. Installer Ollama

- Windows, macOS ou Linux : télécharger l'installeur sur https://ollama.com/download et l'exécuter.
- Vérifier l'installation dans un terminal :

  ```bash
  ollama --version
  ```

### 2. Télécharger le modèle

```bash
ollama pull qwen2.5:0.5b
```

Vérifier qu'il est présent :

```bash
ollama list
```

Pour tester le modèle directement (facultatif) :

```bash
ollama run qwen2.5:0.5b "Dis bonjour en cinq mots."
```

### 3. Vérifier qu'Ollama répond

Ollama écoute sur `http://localhost:11434`. Vérifier avec :

```bash
curl http://localhost:11434/api/tags
```

Une liste JSON contenant `qwen2.5:0.5b` doit s'afficher. Si la commande échoue, Ollama n'est pas lancé : ouvrir l'application
Ollama, ou lancer `ollama serve` dans un terminal.

Par défaut, Ollama n'écoute que sur la machine locale (`127.0.0.1`). Ne pas l'exposer sur le réseau.

### 4. Configurer l'application

La configuration se trouve dans `src/environments/environment.ts`, bloc `ia` :

```ts
ia: {
  mode: 'local',                                   // 'local' = Ollama sur cette machine ; 'serveur' = contrat serveur
  urlOllama: 'http://localhost:11434/api/generate',
  modele: 'qwen2.5:0.5b',                          // doit correspondre au nom affiché par `ollama list`
  delaiMaxMs: 120_000,                             // délai maximal ; le premier appel charge le modèle en mémoire
},
```

- Pour utiliser un autre modèle (ex. `mistral`, `llama3`), le télécharger avec `ollama pull`, puis changer `modele`.
- Ne jamais mettre `mode: 'local'` dans une version de production : en production, l'appel d'IA passe par le serveur.
- Aucune clé ni secret n'est à renseigner : ce fichier est public dans le bundle de l'application.

### 5. Lancer et tester

```bash
npm install
npm start
```

Puis dans le navigateur, sur `http://localhost:4200` :

1. Se connecter avec `admin` / `admin123` (les données de test sont décrites plus haut).
2. Menu **Analyses & rapports** → **Rapports IA**.
3. Choisir un type de rapport (synthèse, analyse par zone, prévision ou personnalisé), éventuellement écrire des
   instructions complémentaires (1 000 caractères au maximum), puis cliquer sur **Générer**.
4. Un squelette de chargement s'affiche pendant la génération (le premier appel peut prendre plusieurs dizaines de secondes).
   Le rapport apparaît ensuite, en Markdown, avec l'avertissement « brouillon IA ».

Les données terrain utilisées par l'IA sont des **données de test** : `src/app/donnee_Mock/IA/data-context.mock.ts`
(floraison, apiculture, quotas des coopératives de Sambava et Mahalevona). Les textes du prompt sont dans
`public/i18n/rapports-ia/fr.json` et `en.json`, clé `prompt`.

### 6. Problèmes fréquents

| Message affiché | Cause probable | Solution |
|---|---|---|
| « Le service de génération est indisponible pour le moment. » | Ollama n'est pas lancé, ou le modèle n'est pas téléchargé. | Vérifier `curl http://localhost:11434/api/tags` puis `ollama list`. |
| « La génération a pris trop de temps. Réessayez. » | Le modèle est lent (machine peu puissante) ou le premier chargement est long. | Relancer ; augmenter `delaiMaxMs` si nécessaire. |
| Le bouton Générer ne fait rien et la console indique un échec de chargement de module | Cache du serveur de développement périmé. | Arrêter `npm start`, lancer `npx ng cache clean`, puis `npm start` à nouveau. |
| « Votre profil ne permet pas de générer des rapports. » | Connecté avec le profil Visiteur. | Se connecter avec `admin` ou `agronome`. |

### 7. Vérification automatique

```bash
npx playwright test e2e/rapports-ia.spec.ts
```

Ces tests simulent la réponse d'Ollama : ils ne demandent pas Ollama installé.
