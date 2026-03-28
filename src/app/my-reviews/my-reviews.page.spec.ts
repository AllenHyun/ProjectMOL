import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyReviewsPage } from './my-reviews.page';

describe('MyReviewsPage', () => {
  let component: MyReviewsPage;
  let fixture: ComponentFixture<MyReviewsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyReviewsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
