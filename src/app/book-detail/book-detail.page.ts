import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, playOutline } from 'ionicons/icons';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.page.html',
  standalone: true,
  imports: [IonContent, CommonModule, HeaderComponent, FooterComponent, IonIcon, HeaderComponent, FooterComponent]
})
export class BookDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  public book: any = null;

  constructor() {
    addIcons({ star, starOutline, playOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')?.trim();

    if (id) {
      try {
        const bookDocRef = doc(this.firestore, 'books', id);
        const snap = await getDoc(bookDocRef);

        if (snap.exists()) {
          this.book = snap.data();
          console.log("Datos cargados correctamente:", this.book);
        } else {
          console.error("No se encontró el documento en Firebase con ID:", id);
        }
      } catch (error) {
        console.error("Error al obtener el libro:", error);
      }
    }
  }
}
