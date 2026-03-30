import { Component, OnInit } from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe]
})
export class AdminPanelComponent  implements OnInit {

  public optionsAdmin = [
    {name: 'Moderación', path: '/admin/moderacion'},
    {name: 'Gestión de Libros', path: '/admin/gestion-libros'},
    {name: 'Usuarios', path: '/admin/usuarios'},
    {name: 'Taxonomía', path: '/admin/taxonomia'},
    {name: 'Takedowns', path: '/admin/takedowns'},
    {name: 'Analítica', path: '/admin/analitica'},
  ]

  constructor() { }

  ngOnInit() {}

}
