import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)), provideFirebaseApp(() => initializeApp({ projectId: "project-mol", appId: "1:685101514909:web:4e7ea9cb4b6282853c5474", storageBucket: "project-mol.firebasestorage.app", apiKey: "AIzaSyAFjSy7uGs7NilyPTF9_JpBGxmewK_ldRY", authDomain: "project-mol.firebaseapp.com", messagingSenderId: "685101514909", measurementId: "G-BXXST8G5YX"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()),
  ],
});
