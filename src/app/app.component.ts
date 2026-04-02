import { Component, inject } from '@angular/core';
import { IonApp, IonContent, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from "@ngx-translate/core";
import { Auth } from '@angular/fire/auth';
import { setPersistence, browserSessionPersistence } from 'firebase/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonContent],
})
export class AppComponent {
  private translate = inject(TranslateService);
  private auth = inject(Auth);

  constructor() {
    this.initializeApp();
  }

  private async initializeApp() {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
    const savedLang = localStorage.getItem('language') || 'es';
    this.translate.use(savedLang);

    try {
      await setPersistence(this.auth, browserSessionPersistence);
      console.log("Modo de sesión: Temporal (se borra al cerrar)");
    } catch (error) {
      console.error("Error en persistencia: ", error);
    }
  }
}
