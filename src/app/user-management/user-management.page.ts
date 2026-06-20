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
      this.users = data.filter(user => user['role'] !== 'visitor');
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
      const reason = prompt(this.translate.instant('ADMIN-U.REASON'));

      if (reason === null) {
        return;
      }

      if (confirm(this.translate.instant('ADMIN-U.CONFIRM_BAN'))) {
        await this.processStatusChange(user, 'suspended', reason || this.translate.instant('ADMIN-U.SUSPENDED'));
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
        bannedAt: newStatus === 'suspended' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error("[Project M.O.L] Error de permisos o red:", error);
      alert(this.translate.instant('ADMIN-U.MODIFY'));
    }
  }
}
