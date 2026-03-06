import { Component, OnInit, Input } from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {menu} from "ionicons/icons";
import {addIcons} from "ionicons";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    IonicModule
  ]
})
export class HeaderComponent  implements OnInit {
  @Input() isAuthPage: boolean = false;
  constructor() {
    addIcons({menu})
  }

  ngOnInit() {}

}
