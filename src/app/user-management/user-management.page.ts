import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, trashOutline, searchOutline} from "ionicons/icons";
import {addDoc, collection, collectionData, deleteDoc, doc, Firestore, updateDoc} from "@angular/fire/firestore";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.page.html',
  styleUrls: ['./user-management.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, TranslatePipe, IonIcon]
})
export class UserManagementPage implements OnInit {
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  public users: any[] = [];
  public searchTerms: string = '';

  constructor() {
    addIcons({
      checkmarkOutline, closeOutline, trashOutline, searchOutline
    });
  }

  ngOnInit() {
    const usersCollection = collection(this.firestore, 'users');
    collectionData(usersCollection, {idField: 'id'}).subscribe(data => {
      this.users = data;
    });
  }

  get filteredUsers(){
    const term = this.searchTerms.toLowerCase().trim();
    if (!term){
      return this.users;
    }
    return this.users.filter(u =>
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }

  async toggleUserStatus(user: any) {
    if (!user || !user.id) return;

    const isBanned = user.status === 'suspended';

    if (isBanned) {
      if (confirm(this.translate.instant('ADMIN-U.CONFIRM_UNBAN'))) {
        await this.processStatusChange(user, 'active', '');
      }
    } else {
      const reason = prompt("Escribe el motivo de la suspensión (se enviará por email):");

      if (reason === null) {
        return;
      }

      if (confirm(this.translate.instant('ADMIN-U.CONFIRM_BAN'))) {
        await this.processStatusChange(user, 'suspended', reason || 'Incumplimiento de las normas de la comunidad');
      }
    }
  }

  async deleteUser(userId: string){
    if (confirm(this.translate.instant('ADMIN-U.CONFIRM_DELETE'))){
      const userDoc = doc(this.firestore, `users/${userId}`);
      await deleteDoc(userDoc);
    }
  }

  private async processStatusChange(user: any, newStatus: string, reason: string) {
    try {
      const userDoc = doc(this.firestore, `users/${user.id}`);

      await updateDoc(userDoc, {
        status: newStatus,
        banReason: reason,
        bannedAt: newStatus === 'suspended' ? new Date() : null
      });

      if (newStatus === 'suspended') {
        await addDoc(collection(this.firestore, 'mail'), {
          to: user.email,
          message: {
            subject: 'Tu cuenta ha sido suspendida - Project M.O.L',
            html: `
              <h2>Hola, ${user.username || 'usuario'}.</h2>
              <p>Te informamos que tu cuenta ha sido suspendida temporalmente.</p>
              <p><strong>Motivo:</strong> ${reason}</p>
              <p>Si crees que esto es un error, contacta con soporte.</p>
            `
          }
        });
      }
    } catch (error) {
      console.error("Error de permisos o red:", error);
      alert("No tienes permisos para modificar este usuario.");
    }
  }
}
