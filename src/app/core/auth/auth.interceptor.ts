import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Le jeton ne part que vers l'API de l'application : jamais vers un autre service (ex. l'IA locale).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = req.url.startsWith(environment.urlApi) ? inject(AuthService).token() : null;

  return next(
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req,
  );
};
