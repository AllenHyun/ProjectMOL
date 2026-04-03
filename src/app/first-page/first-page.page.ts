import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import { register } from 'swiper/element/bundle';
import {collection, collectionData, Firestore, limit, orderBy, query, where} from "@angular/fire/firestore";
import {Observable, switchMap} from "rxjs";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {RouterLink} from "@angular/router";
import {star, personOutline, starOutline} from "ionicons/icons";
import {addIcons} from "ionicons";
import {TranslatePipe} from "@ngx-translate/core";

register();

@Component({
  selector: 'app-first-page',
  templateUrl: './first-page.page.html',
  styleUrls: ['./first-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, RouterLink, IonIcon, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FirstPagePage implements OnInit, AfterViewInit {
  private firestore = inject(Firestore);

  @ViewChild('swiperNovedades') swiperNovedades!: ElementRef;
  @ViewChild('swiperRecomendados') swiperRecomendados!: ElementRef;
  @ViewChild('swiperReview') swiperReview!: ElementRef;
  @ViewChild('swiperExams') swiperExams!: ElementRef;

  public newBooks$!: Observable<any[]>;
  public recommendedBooks$!: Observable<any[]>;
  public examBooks$!: Observable<any[]>;
  public featuredReviews$!: Observable<any[]>;

  public bookSwiper = {
    observer: true,
    observerParents: true,
    slidesPerView: 2.5,
    spaceBetween: 16,
    navigation: true,
    centeredSlides: false,
    centerInsufficientSlides: true,
    breakpoints: {
      640: {slidesPerView: 4.5},
      1024: {slidesPerView: 6},
    }
  };

  public reviewSwiper = {
    slidesPerView: 2,
    spaceBetween: 16,
    navigation: true,
    breakpoints: {
      768: {slidesPerView: 2.5},
      1280: {slidesPerView: 4},
    }
  };

  constructor() {
    addIcons({
      star, personOutline, starOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.swiperNovedades) {
        Object.assign(this.swiperNovedades.nativeElement, this.bookSwiper);
        this.swiperNovedades.nativeElement.initialize();
      }
      if(this.swiperRecomendados){
        Object.assign(this.swiperRecomendados.nativeElement, this.bookSwiper);
        this.swiperRecomendados.nativeElement.initialize();
      }
      if(this.swiperExams){
        Object.assign(this.swiperExams.nativeElement, this.bookSwiper);
        this.swiperExams.nativeElement.initialize();
      }
      if(this.swiperReview){
        Object.assign(this.swiperReview.nativeElement, this.reviewSwiper);
        this.swiperReview.nativeElement.initialize();
      }
    }, 300);
  }

  private loadData() {
    const bookRef = collection(this.firestore, 'books');
    const reviewRef = collection(this.firestore, 'reviews');

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLimit = weekAgo.toISOString();

    const qNew = query(bookRef, where("createdAt", ">=", weekLimit), orderBy('createdAt', 'desc'), limit(10));
    this.newBooks$ = collectionData(qNew, {idField: 'id'});

    const qRec = query(bookRef, where('ratingAvg', '>', 4), orderBy('ratingAvg', 'desc'), limit(10));
    this.recommendedBooks$ = collectionData(qRec, {idField: 'id'});

    const qExam = query(bookRef, where('tags', 'array-contains-any', ['exámenes', 'exams']), limit(10));
    this.examBooks$ = collectionData(qExam, {idField: 'id'});

    const qRev = query(reviewRef, where('rating', '==', 5), orderBy('rating', 'desc'), limit(10));
    this.featuredReviews$ = collectionData(qRev, { idField: 'id' });

  }
}
