import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive,  } from "@angular/router";
import { RouterLinkWithHref } from "@angular/router";
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-nav-bar-component',
  imports: [RouterLink, RouterLinkActive, RouterLinkWithHref],
  standalone: true,
  templateUrl: './nav-bar-component.html',
  styleUrl: './nav-bar-component.css',
})
export class NavBarComponent {
  readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}
