import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppError } from './app-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('normalise une erreur HTTP en AppError', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    let received: AppError | undefined;

    http.get('/api/test').subscribe({ error: (err: AppError) => (received = err) });
    httpMock.expectOne('/api/test').flush('erreur', { status: 500, statusText: 'Server Error' });

    expect(received?.status).toBe(500);
    httpMock.verify();
  });
});
