import {Component, inject} from '@angular/core';
import {IonApp, IonContent, IonRouterOutlet} from '@ionic/angular/standalone';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonContent],
})
export class AppComponent {
  private translate = inject(TranslateService);
  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('es');
  }
}
