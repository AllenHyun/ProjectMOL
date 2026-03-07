import {Component, OnDestroy, OnInit} from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonCard,
    IonCardContent, IonCardTitle, IonIcon, IonInput
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, IonFooter, FooterComponent, IonCard, IonCardContent, IonCardTitle, IonIcon, IonInput],
})
export class HomePage implements OnInit, OnDestroy {
  images : string[] = [
    'assets/icon/home_back1.jpg',
    'assets/icon/home_back2.jpg',
    'assets/icon/home_back3.jpg',
  ];

  currentIndex = 0;
  private intervalId: any;
  constructor() {}

  ngOnInit() {
    this.startSlider();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startSlider() {
    this.intervalId = setInterval(() => {
      this.nextImage();
    }, 10000);
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }
}
