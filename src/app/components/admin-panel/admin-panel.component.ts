import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {addIcons} from "ionicons";
import {chevronDownOutline, chevronUpOutline, gridOutline} from "ionicons/icons";
import {IonIcon} from "@ionic/angular/standalone";

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, IonIcon]
})
export class AdminPanelComponent  implements OnInit {
  private translate = inject(TranslateService);

  public isCollapsed = true;

  public optionsAdmin = [
    {name: this.translate.instant('ADMIN.MODERATION'), path: '/admin/moderacion'},
    {name: this.translate.instant('ADMIN.BOOK'), path: '/admin/gestion-libros'},
    {name: this.translate.instant('ADMIN.USERS'), path: '/admin/usuarios'},
    {name: this.translate.instant('ADMIN.TAXONOMY'), path: '/admin/taxonomia'},
    {name: this.translate.instant('ADMIN.TAKEDOWN'), path: '/admin/takedowns'},
    {name: this.translate.instant('ADMIN.ANALYTICS'), path: '/admin/analitica'},
  ]

  constructor() {
    addIcons({
      chevronUpOutline, chevronDownOutline, gridOutline
    });
  }

  ngOnInit() {}

  toggleMenu(){
    this.isCollapsed = !this.isCollapsed;
  }

}
