import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorDetailComponent } from './author-detail';

describe('AuthorDetailComponent', () => {
  let component: AuthorDetailComponent;
  let fixture: ComponentFixture<AuthorDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
