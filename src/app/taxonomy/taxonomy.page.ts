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
import {Translation} from "../services/translation";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-taxonomy',
  templateUrl: './taxonomy.page.html',
  styleUrls: ['./taxonomy.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon, TranslatePipe]
})
export class TaxonomyPage implements OnInit {
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  public categories: any[] = [];
  public tags: any[] = [];

  public newCategoryName = '';
  public newTagName = '';
  public selectedCategoryIdForTag = '';

  private translationService = inject(Translation);

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

    for (const name of defaults) {
      const names: Record<string, string> = { es: name };
      names['en'] = await this.translationService.translateText(name, 'en');
      names['fr'] = await this.translationService.translateText(name, 'fr');

      await addDoc(catRef, { names });
    }
  }

  async addCategory() {
    if (!this.newCategoryName.trim()) return;

    const sourceText = this.newCategoryName.trim();
    const names: Record<string, string> = { es: sourceText };

    const targetLangs = ['en', 'fr'];
    const promises = targetLangs.map(async (lang) => {
      names[lang] = await this.translationService.translateText(sourceText, lang);
    });
    await Promise.all(promises);
    await addDoc(collection(this.firestore, 'categories'), { names });
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
    if (confirm(this.translate.instant('TAXONOMY.CONFIRM_DELETE'))) {
      await deleteDoc(doc(this.firestore, col, id));
    }
  }

  getCategoryName(id: string){
    const cat = this.categories.find(c => c.id === id);
    if (!cat) return 'Sin categoría';

    return cat.names?.es || cat.names?.en || 'Sin nombre';
  }
}
