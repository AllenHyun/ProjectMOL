import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {Auth, authState, updateEmail, updatePassword} from "@angular/fire/auth";
import {collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where} from "@angular/fire/firestore";
import {Router} from "@angular/router";
import {filter, take} from "rxjs";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent]
})
export class SettingsPage implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  public days = Array.from({ length: 31 }, (_, i) => i + 1);
  public months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  public user: any ={
    username: '',
    email: '',
    birthday: {day: '', month: '', year: ''},
    language: 'Español',
  };

  public newPassword = '';

  constructor() { }

  ngOnInit() {
    authState(this.auth).pipe(
      filter(res => res !== undefined),
      take(1)
    ).subscribe(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
        if (userDoc.exists()){
          const data = userDoc.data();
          this.user = {...this.user, ...data, email: currentUser.email};
        }
      }
    });
  }

  async saveSettings(){
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return;
      }

      const userRef = doc(this.firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: this.user.username,
        birthday: this.user.birthday,
        language: this.user.language,
      });

      if (this.user.email !== currentUser.email){
        await updateEmail(currentUser, this.user.email);
      }

      if (this.newPassword){
        await updatePassword(currentUser, this.user.password);
        this.newPassword = '';
      }
      alert("Ajustes actualizados correctamente")
    } catch (error) {
      alert("Error al actualizar: Reautenticación requerida para cambios sensibles");
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
      console.error("Error al exportar datos:", error);
      alert("No se pudieron exportar las listas en este momento.");
    }
  }

  logout(){
    this.auth.signOut().then(() => this.router.navigate(['/login']));
  }

}
