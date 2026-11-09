// Zone agro-écologique telle que les pages la proposent dans leurs filtres. La liste vient du serveur : elle est
// « à valider » avec MCIngredients (CDC §14), jamais figée dans le code.
export interface Zone {
  readonly id: string;
  readonly nom: string;
}
