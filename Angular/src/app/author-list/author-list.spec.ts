import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorListComponent } from './author-list';

describe('AuthorListComponent', () => {
  let component: AuthorListComponent;
  let fixture: ComponentFixture<AuthorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
