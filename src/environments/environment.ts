export const environment = {
  urlApi: '/api',
  ia: {
    mode: 'local' as 'local' | 'serveur',
    urlOllama: 'http://localhost:11434/api/generate',
    modele: 'qwen2.5:0.5b',
    delaiMaxMs: 120_000, // le premier appel charge le modèle en mémoire : il peut être long
  },
};
