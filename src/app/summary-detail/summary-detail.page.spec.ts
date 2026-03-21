import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryDetailPage } from './summary-detail.page';

describe('SummaryDetailPage', () => {
  let component: SummaryDetailPage;
  let fixture: ComponentFixture<SummaryDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
