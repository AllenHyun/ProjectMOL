import { Component, inject } from '@angular/core';
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
      console.log("Modo de sesión: Temporal (se borra al cerrar)");
    } catch (error) {
      console.error("Error en persistencia: ", error);
    }
  }

  private listenToUserStatus() {
    authState(this.auth).subscribe((authUser) => {
      if (authUser) {
        const userRef = doc(this.firestore, `users/${authUser.uid}`);
        onSnapshot(userRef, (docSnap) => {
          const userData = docSnap.data();

          if (userData?.['status'] === 'suspended') {
            this.handleSuspension(userData['banReason']);
          }
        });
      }
    });
  }

  private async handleSuspension(reason: string) {
    const msg = reason || "Incumplimiento de las normas de la comunidad";
    await signOut(this.auth);
    alert(`TU CUENTA HA SIDO SUSPENDIDA.\nMotivo: ${msg}`);
    this.router.navigate(['/login']);
  }
}
