import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Auth, authState, verifyBeforeUpdateEmail, sendPasswordResetEmail } from "@angular/fire/auth";
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { filter } from "rxjs";
import { HeaderComponent } from "../components/header/header.component";
import { FooterComponent } from "../components/footer/footer.component";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, TranslatePipe]
})
export class SettingsPage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  public user: any = {
    username: '',
    email: '',
    language: 'Español',
  };

  constructor() { }

  ngOnInit() {
    authState(this.auth).pipe(
      filter(res => res !== undefined)
    ).subscribe(async (currentUser) => {
      if (currentUser) {
        this.resetUserData(currentUser.email);
        const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          this.user = { ...this.user, ...data, email: currentUser.email };
        }
      } else {
        this.resetUserData('');
      }
    });
  }

  private resetUserData(email: string | null) {
    this.user = {
      username: '',
      email: email || '',
      language: 'Español',
    };
  }

  async saveSettings() {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(this.firestore, 'users', currentUser.uid);

      await updateDoc(userRef, {
        username: this.user.username,
        language: this.user.language,
        email: this.user.email
      });

      if (this.user.email !== currentUser.email) {
        await verifyBeforeUpdateEmail(currentUser, this.user.email);

        alert("ATENCIÓN: Se ha enviado un enlace de confirmación a " + this.user.email + ". " +
          "Para completar el cambio, debes verificarlo. La sesión se cerrará ahora.");

        await this.auth.signOut();
        this.router.navigate(['/login']);

        return;
      }

      alert("Ajustes de perfil actualizados.");

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Por seguridad, debes haber iniciado sesión recientemente para cambiar tu correo. Por favor, sal y vuelve a entrar.");
      } else {
        alert("Ocurrió un error al actualizar los datos.");
      }
    }
  }

  async sendResetPassword() {
    if (!this.user.email) return;
    try {
      await sendPasswordResetEmail(this.auth, this.user.email);
      alert("Se ha enviado un correo a " + this.user.email + " para restablecer tu contraseña.");
    } catch (error) {
      console.error(error);
      alert("Error al enviar el correo de restablecimiento.");
    }
  }

  async exportData() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    try {
      const listsRef = collection(this.firestore, 'lists');
      const q = query(listsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      const exportResults = [];

      for (const listDoc of querySnapshot.docs) {
        const listData = listDoc.data();
        const booksInList = [];

        if (listData['bookIds'] && listData['bookIds'].length > 0) {
          for (const bookId of listData['bookIds']) {
            const bookDoc = await getDoc(doc(this.firestore, 'books', bookId));
            if (bookDoc.exists()) {
              const b = bookDoc.data();
              booksInList.push({
                titulo: b['title'],
                autor: b['author'],
              });
            }
          }
        }

        exportResults.push({
          nombreLista: listData['name'],
          totalLibros: booksInList.length,
          libros: booksInList
        });
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportResults, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `mis_listas_project_mol.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

    } catch (error) {
      console.error(error);
      alert("No se pudieron exportar las listas.");
    }
  }

  logout() {
    this.auth.signOut().then(() => {
      this.resetUserData('');
      this.router.navigate(['/login']);
    });
  }
}
