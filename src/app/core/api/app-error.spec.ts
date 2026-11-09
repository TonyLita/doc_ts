import { HttpErrorResponse } from '@angular/common/http';
import { toAppError } from './app-error';

describe('toAppError', () => {
  it('convertit une HttpErrorResponse en AppError avec son statut', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: '/x' });

    expect(toAppError(error).status).toBe(404);
  });

  it('convertit une Error simple avec le statut 0', () => {
    expect(toAppError(new Error('boom'))).toEqual({ status: 0, message: 'boom' });
  });

  it('gère une valeur inconnue', () => {
    expect(toAppError('x')).toEqual({ status: 0, message: 'Erreur inconnue' });
  });
});
