import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../core/models/user.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() user: User | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() navigationClick = new EventEmitter<string>();
  @Output() createNote = new EventEmitter<void>();
  @Output() createFolder = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Le mie Note',
      icon: 'note',
      route: '/notes'
    },
    {
      label: 'Condivise con me',
      icon: 'share',
      route: '/shared'
    },
    {
      label: 'Cartelle',
      icon: 'folder',
      route: '/folders'
    },
    {
      label: 'Ricerca',
      icon: 'search',
      route: '/search'
    }
  ];

  constructor(private router: Router) { }

  onNavigationClick(route: string): void {
    this.navigationClick.emit(route);
    this.router.navigate([route]);
  }

  onCreateNote(): void {
    this.createNote.emit();
  }

  onCreateFolder(): void {
    this.createFolder.emit();
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
