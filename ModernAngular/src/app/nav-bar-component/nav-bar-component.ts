import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive,  } from "@angular/router";
import { RouterLinkWithHref } from "@angular/router";

@Component({
  selector: 'app-nav-bar-component',
  imports: [RouterLink, RouterLinkActive, RouterLinkWithHref],
  standalone: true,
  templateUrl: './nav-bar-component.html',
  styleUrl: './nav-bar-component.css',
})
export class NavBarComponent {}
