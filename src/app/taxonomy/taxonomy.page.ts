import {Component, EnvironmentInjector, inject, OnDestroy, OnInit, runInInjectionContext} from '@angular/core';
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
import {Subscription} from "rxjs";

@Component({
  selector: 'app-taxonomy',
  templateUrl: './taxonomy.page.html',
  styleUrls: ['./taxonomy.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon, TranslatePipe]
})
export class TaxonomyPage implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  protected translate = inject(TranslateService);
  private injector = inject(EnvironmentInjector);

  private _subs: Subscription[] = [];

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
    runInInjectionContext(this.injector, () => {
      const catSub = collectionData(collection(this.firestore, 'categories'), {idField: 'id'})
        .subscribe(data => {
          this.categories = data;
          if (this.categories.length === 0) {
            this.seedDefaultCategories();
          }
        });
      this._subs.push(catSub);
      const tagSub = collectionData(collection(this.firestore, 'tags'), {idField: 'id'})
        .subscribe(data => this.tags = data);
      this._subs.push(tagSub);
    });
  }

  ngOnDestroy() {
    this._subs.forEach(s => s.unsubscribe());
  }

  async seedDefaultCategories() {
    const defaults = ['Acción', 'Romance', 'Thriller', 'Educativo', 'Aventura', 'Ciencia Ficción'];
    const catRef = collection(this.firestore, 'categories');

    for (const name of defaults) {
      const names: Record<string, string> = { es: name };
      names['en'] = await this.translationService.translateText(name, 'en');
      names['fr'] = await this.translationService.translateText(name, 'fr');

      runInInjectionContext(this.injector, () => {
        addDoc(catRef, { names });
      });
    }
  }

  async addCategory() {
    if (!this.newCategoryName.trim()) {
      return;
    }

    const sourceText = this.newCategoryName.trim();
    const names: Record<string, string> = { es: sourceText, en: '', fr: '' };
    const targetLangs = ['en', 'fr'];

    try {
      for (const lang of targetLangs) {
        try {
          const translated = await this.translationService.translateText(sourceText, lang);
          names[lang] = translated || sourceText;

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (apiError) {
          console.warn(`[Project M.O.L] Error en el servicio de traducción para el idioma [${lang}]:`, apiError);
          names[lang] = sourceText;
        }
      }

      runInInjectionContext(this.injector, async () => {
        await addDoc(collection(this.firestore, 'categories'), { names });
        console.log("Nueva categoría añadida y traducida con éxito:", names);
      });

      this.newCategoryName = '';

    } catch (error) {
      console.error("[Project M.O.L] Error crítico en el proceso de creación de categoría:", error);
      alert("No se pudo traducir la categoría. Revisa la conexión con el servicio de traducción.");
    }
  }


  async addTag(){
    if (!this.newTagName.trim() || !this.selectedCategoryIdForTag){
      return;
    }

    runInInjectionContext(this.injector, () => {
      addDoc(collection(this.firestore, 'tags'), {
        name: this.newTagName.trim(),
        categoryId: this.selectedCategoryIdForTag
      });
    });
    this.newTagName = '';
  }

  async deleteItem(col: string, id: string){
    if (confirm(this.translate.instant('TAXONOMY.CONFIRM_DELETE'))) {
      runInInjectionContext(this.injector, () => {
        deleteDoc(doc(this.firestore, col, id));
      });
    }
  }

  getCategoryName(id: string){
    const cat = this.categories.find(c => c.id === id);
    if (!cat) return 'Sin categoría';

    const currentLang = this.translate.currentLang || 'es';

    return cat.names?.[currentLang] || cat.names?.es || cat.names?.en || 'Sin nombre';
  }
}
