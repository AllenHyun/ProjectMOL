import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {addIcons} from "ionicons";
import {chevronDownOutline, chevronUpOutline, gridOutline} from "ionicons/icons";
import {IonIcon} from "@ionic/angular/standalone";
import {collection, collectionData, Firestore, query, where} from "@angular/fire/firestore";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, IonIcon]
})
export class AdminPanelComponent  implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  public isCollapsed = true;
  public pendingCount = 0;
  private countSub: Subscription | null = null;

  public optionsAdmin = [
    {name: 'ADMIN.MODERATION', path: '/admin/moderacion'},
    {name: 'ADMIN.BOOK', path: '/admin/gestion-libros'},
    {name: 'ADMIN.USERS', path: '/admin/usuarios'},
    {name: 'ADMIN.TAXONOMY', path: '/admin/taxonomia'},
    {name: 'ADMIN.TAKEDOWN', path: '/admin/takedowns'},
    {name: 'ADMIN.ANALYTICS', path: '/admin/analitica'}
  ]

  constructor() {
    addIcons({
      chevronUpOutline, chevronDownOutline, gridOutline
    });
  }

  ngOnInit() {
    const q = query(collection(this.firestore, 'summaries'), where('status', '==', 'pending'));
    this.countSub = collectionData(q).subscribe(data => {
      this.pendingCount = data ? data.length : 0;
    });
  }

  ngOnDestroy() {
    this.countSub?.unsubscribe();
  }

  toggleMenu(){
    this.isCollapsed = !this.isCollapsed;
  }

}
