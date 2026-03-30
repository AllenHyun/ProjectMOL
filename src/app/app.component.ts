import {Component, inject} from '@angular/core';
import {IonApp, IonContent, IonRouterOutlet} from '@ionic/angular/standalone';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonContent],
})
export class AppComponent {
  private translate = inject(TranslateService);
  constructor() {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
    const savedLang = localStorage.getItem('language') || 'es';
    this.translate.use(savedLang);
  }
}
