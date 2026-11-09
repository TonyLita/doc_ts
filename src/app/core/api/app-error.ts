import { HttpErrorResponse } from '@angular/common/http';

// Modèle d’erreur applicatif homogène (manuel 4.7).
export interface AppError {
  readonly status: number;
  readonly message: string;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof HttpErrorResponse) {
    return { status: error.status, message: error.message };
  }

  return {
    status: 0,
    message: error instanceof Error ? error.message : 'Erreur inconnue',
  };
}
