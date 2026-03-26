import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewDetailPage } from './review-detail.page';

describe('ReviewDetailPage', () => {
  let component: ReviewDetailPage;
  let fixture: ComponentFixture<ReviewDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
