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
  public isCollapsed = true;

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

  ngOnInit() {}

  toggleMenu(){
    this.isCollapsed = !this.isCollapsed;
  }

}
