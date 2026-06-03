import {Component, EnvironmentInjector, inject, runInInjectionContext} from '@angular/core';
import { IonApp, IonContent, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from "@ngx-translate/core";
import {Auth, authState, signOut} from '@angular/fire/auth';
import { setPersistence, browserSessionPersistence } from 'firebase/auth';
import {doc, Firestore, onSnapshot} from "@angular/fire/firestore";
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonContent],
})
export class AppComponent {
  private translate = inject(TranslateService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private injector = inject(EnvironmentInjector);

  constructor() {
    this.initializeApp();
    this.listenToUserStatus();
  }

  private async initializeApp() {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
    const savedLang = localStorage.getItem('language') || 'es';
    this.translate.use(savedLang);

    try {
      await setPersistence(this.auth, browserSessionPersistence);
    } catch (error) {
      console.error("Error en persistencia: ", error);
    }
  }

  private listenToUserStatus() {
    let unSubscribeSnapshot: (() => void) | null = null;
    runInInjectionContext(this.injector, () => {
      authState(this.auth).subscribe((authUser) => {
        if (unSubscribeSnapshot){
          unSubscribeSnapshot();
          unSubscribeSnapshot = null;
        }
        if (authUser) {
          const userRef = doc(this.firestore, `users/${authUser.uid}`);
          runInInjectionContext(this.injector, () => {
            unSubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
              const userData = docSnap.data();

              if (userData?.['status'] === 'suspended') {
                if (unSubscribeSnapshot){
                  unSubscribeSnapshot();
                  unSubscribeSnapshot = null;
                }
                this.handleSuspension(userData['banReason']);
              }
            }, (error) => {
              console.log("Listener en tiempo real cerrado de forma segura al revocar la sesión: ", error);
            });
          });
        }
      });
    });
  }

  private async handleSuspension(reason: string) {
    const msg = reason || "Incumplimiento de las normas de la comunidad";
    await signOut(this.auth);
    alert(`TU CUENTA HA SIDO SUSPENDIDA.\nMotivo: ${msg}`);
    this.router.navigate(['/login']);
  }
}
