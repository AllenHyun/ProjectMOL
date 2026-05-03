import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import { addIcons} from "ionicons";
import {addOutline, trashOutline} from "ionicons/icons";
import {addDoc, collection, collectionData, deleteDoc, doc, Firestore} from "@angular/fire/firestore";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";

@Component({
  selector: 'app-taxonomy',
  templateUrl: './taxonomy.page.html',
  styleUrls: ['./taxonomy.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon]
})
export class TaxonomyPage implements OnInit {
  private firestore = inject(Firestore);
  public categories: any[] = [];
  public tags: any[] = [];

  public newCategoryName = '';
  public newTagName = '';
  public selectedCategoryIdForTag = '';

  constructor() {
    addIcons({
      addOutline, trashOutline
    });
  }

  ngOnInit() {
    collectionData(collection(this.firestore, 'categories'), {idField: 'id'})
    .subscribe(data => {
      this.categories = data;
      if (this.categories.length === 0) {
        this.seedDefaultCategories();
      }
    });
    collectionData(collection(this.firestore, 'tags'), {idField: 'id'})
      .subscribe(data => this.tags = data);
  }

  async seedDefaultCategories() {
    const defaults = ['Acción', 'Romance', 'Thriller', 'Educativo', 'Aventura', 'Ciencia Ficción'];
    const catRef = collection(this.firestore, 'categories');
    for (const name of defaults){
      await addDoc(catRef, {name});
    }
  }

  async addCategory(){
    if (!this.newCategoryName.trim()){
      return;
    }

    await addDoc(collection(this.firestore, 'categories'), {name: this.newCategoryName.trim()});
    this.newCategoryName = '';
  }

  async addTag(){
    if (!this.newTagName.trim() || !this.selectedCategoryIdForTag){
      return;
    }

    await addDoc(collection(this.firestore, 'tags'), {
      name: this.newTagName.trim(),
      categoryId: this.selectedCategoryIdForTag
    });
    this.newTagName = '';
  }

  async deleteItem(col: string, id: string){
    if (confirm('¿Eliminar permanentemente?')){
      await deleteDoc(doc(this.firestore, col, id));
    }
  }

  getCategoryName(id: string){
    return this.categories.find(c => c.id === id)?.name || 'Sin categoría';
  }
}
