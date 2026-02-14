import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
  parent?: TreeNode;
  level?: number;
}

@Component({
  selector: 'app-folder-tree',
  template: `
    <div class="folder-tree">
      <div class="tree-controls" *ngIf="showControls">
        <button mat-icon-button (click)="expandAll()" [title]="'Espandi tutto'">
          <mat-icon>unfold_more</mat-icon>
        </button>
        <button mat-icon-button (click)="collapseAll()" [title]="'Chiudi tutto'">
          <mat-icon>unfold_less</mat-icon>
        </button>
      </div>
      
      <div class="tree-content">
        <div 
          *ngFor="let node of visibleNodes" 
          class="tree-node"
          [style.padding-left.px]="(node.level || 0) * 20"
          [class.selected]="node.selected"
          [class.file-node]="node.type === 'file'"
          [class.folder-node]="node.type === 'folder'">
          
          <div class="node-content" (click)="onNodeClick(node)">
            <!-- Expand/Collapse button for folders -->
            <button 
              *ngIf="node.type === 'folder' && hasChildren(node)"
              mat-icon-button 
              class="expand-button"
              (click)="toggleExpand(node, $event)">
              <mat-icon>{{ node.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
            </button>
            
            <!-- Spacer for files or empty folders -->
            <div *ngIf="node.type === 'file' || !hasChildren(node)" class="expand-spacer"></div>
            
            <!-- Node icon -->
            <mat-icon class="node-icon">
              {{ getNodeIcon(node) }}
            </mat-icon>
            
            <!-- Node name -->
            <span class="node-name" [title]="node.name">{{ node.name }}</span>
            
            <!-- Actions menu -->
            <div class="node-actions" *ngIf="showActions" (click)="$event.stopPropagation()">
              <button mat-icon-button [matMenuTriggerFor]="nodeMenu" class="action-button">
                <mat-icon>more_vert</mat-icon>
              </button>
              
              <mat-menu #nodeMenu="matMenu">
                <button mat-menu-item (click)="onNodeAction('rename', node)">
                  <mat-icon>edit</mat-icon>
                  <span>Rinomina</span>
                </button>
                <button mat-menu-item (click)="onNodeAction('delete', node)">
                  <mat-icon>delete</mat-icon>
                  <span>Elimina</span>
                </button>
                <button 
                  *ngIf="node.type === 'folder'" 
                  mat-menu-item 
                  (click)="onNodeAction('addFolder', node)">
                  <mat-icon>create_new_folder</mat-icon>
                  <span>Nuova cartella</span>
                </button>
                <button 
                  *ngIf="node.type === 'folder'" 
                  mat-menu-item 
                  (click)="onNodeAction('addFile', node)">
                  <mat-icon>note_add</mat-icon>
                  <span>Nuovo file</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="visibleNodes.length === 0" class="empty-tree">
        <mat-icon>folder_open</mat-icon>
        <p>Nessun elemento trovato</p>
      </div>
    </div>
  `,
  styles: [`
    .folder-tree {
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .tree-controls {
      padding: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      background-color: #fafafa;
      display: flex;
      gap: 4px;
    }
    
    .tree-content {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .tree-node {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: background-color 0.2s;
    }
    
    .tree-node:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .tree-node.selected {
      background-color: rgba(63, 81, 181, 0.1);
    }
    
    .node-content {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      cursor: pointer;
      min-height: 40px;
    }
    
    .expand-button {
      width: 24px;
      height: 24px;
      min-width: 24px;
      line-height: 24px;
      margin-right: 4px;
    }
    
    .expand-spacer {
      width: 32px;
      min-width: 32px;
    }
    
    .node-icon {
      margin-right: 8px;
      color: rgba(0, 0, 0, 0.54);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .folder-node .node-icon {
      color: #2196F3;
    }
    
    .node-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
    }
    
    .node-actions {
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .tree-node:hover .node-actions {
      opacity: 1;
    }
    
    .action-button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    
    .empty-tree {
      padding: 40px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .empty-tree mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .empty-tree p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class FolderTreeComponent {
  @Input() nodes: TreeNode[] = [];
  @Input() showControls: boolean = true;
  @Input() showActions: boolean = true;
  @Input() multiSelect: boolean = false;

  @Output() nodeSelected = new EventEmitter<TreeNode>();
  @Output() nodeAction = new EventEmitter<{action: string, node: TreeNode}>();
  @Output() nodesChanged = new EventEmitter<TreeNode[]>();

  visibleNodes: TreeNode[] = [];

  ngOnInit() {
    this.calculateVisibleNodes();
  }

  ngOnChanges() {
    this.calculateVisibleNodes();
  }

  onNodeClick(node: TreeNode): void {
    if (!this.multiSelect) {
      this.clearSelection();
    }
    
    node.selected = !node.selected;
    this.nodeSelected.emit(node);
  }

  toggleExpand(node: TreeNode, event: Event): void {
    event.stopPropagation();
    
    if (node.type === 'folder') {
      node.expanded = !node.expanded;
      this.calculateVisibleNodes();
    }
  }

  expandAll(): void {
    this.setExpansionRecursively(this.nodes, true);
    this.calculateVisibleNodes();
  }

  collapseAll(): void {
    this.setExpansionRecursively(this.nodes, false);
    this.calculateVisibleNodes();
  }

  onNodeAction(action: string, node: TreeNode): void {
    this.nodeAction.emit({ action, node });
  }

  hasChildren(node: TreeNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  getNodeIcon(node: TreeNode): string {
    if (node.type === 'folder') {
      return node.expanded ? 'folder_open' : 'folder';
    }
    return 'description';
  }

  private calculateVisibleNodes(): void {
    this.visibleNodes = [];
    this.addVisibleNodesRecursively(this.nodes, 0);
  }

  private addVisibleNodesRecursively(nodes: TreeNode[], level: number): void {
    for (const node of nodes) {
      node.level = level;
      this.visibleNodes.push(node);
      
      if (node.type === 'folder' && node.expanded && node.children) {
        this.addVisibleNodesRecursively(node.children, level + 1);
      }
    }
  }

  private setExpansionRecursively(nodes: TreeNode[], expanded: boolean): void {
    for (const node of nodes) {
      if (node.type === 'folder') {
        node.expanded = expanded;
        if (node.children) {
          this.setExpansionRecursively(node.children, expanded);
        }
      }
    }
  }

  private clearSelection(): void {
    this.clearSelectionRecursively(this.nodes);
  }

  private clearSelectionRecursively(nodes: TreeNode[]): void {
    for (const node of nodes) {
      node.selected = false;
      if (node.children) {
        this.clearSelectionRecursively(node.children);
      }
    }
  }
}