import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaxonomyPage } from './taxonomy.page';

describe('TaxonomyPage', () => {
  let component: TaxonomyPage;
  let fixture: ComponentFixture<TaxonomyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxonomyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
