import { ApplicationConfig, provideBrowserGlobalErrorListeners, ENVIRONMENT_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { inject } from '@angular/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([])
    ),
    provideCharts(withDefaultRegisterables()),
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => console.log('App initialized'),
      multi: true
    }
  ]
};
