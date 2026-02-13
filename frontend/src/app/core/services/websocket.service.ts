import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  id?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket?: WebSocket;
  private readonly WS_URL = this.getWebSocketUrl();
  private readonly RECONNECT_INTERVAL = 5000; // 5 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  private destroy$ = new Subject<void>();
  private messagesSubject = new Subject<WebSocketMessage>();
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0
  });

  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private reconnectAttempts = 0;
  private shouldReconnect = true;

  constructor(private authService: AuthService) {
    // Connect when user is authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        if (isAuth) {
          this.connect();
        } else {
          this.disconnect();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    try {
      this.socket = new WebSocket(`${this.WS_URL}?token=${token}`);
      this.setupSocketListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    this.updateConnectionStatus({
      connected: false,
      reconnecting: false,
      lastDisconnected: new Date(),
      reconnectAttempts: 0
    });
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, data: any): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected. Message not sent:', { type, data });
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date(),
      id: this.generateMessageId()
    };

    try {
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Subscribe to specific message types
   */
  onMessage(messageType: string): Observable<WebSocketMessage> {
    return this.messages$.pipe(
      filter(message => message.type === messageType)
    );
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.shouldReconnect = true;
      
      this.updateConnectionStatus({
        connected: true,
        reconnecting: false,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        message.timestamp = new Date(message.timestamp);
        this.messagesSubject.next(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      
      this.updateConnectionStatus({
        connected: false,
        reconnecting: false,
        lastDisconnected: new Date(),
        reconnectAttempts: this.reconnectAttempts
      });

      if (this.shouldReconnect && event.code !== 1000) {
        this.handleReconnection();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(): void {
    this.updateConnectionStatus({
      connected: false,
      reconnecting: false,
      lastDisconnected: new Date(),
      reconnectAttempts: this.reconnectAttempts
    });

    if (this.shouldReconnect) {
      this.handleReconnection();
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.shouldReconnect = false;
      return;
    }

    this.reconnectAttempts++;
    
    this.updateConnectionStatus({
      connected: false,
      reconnecting: true,
      reconnectAttempts: this.reconnectAttempts
    });

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

    timer(this.RECONNECT_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.shouldReconnect) {
          this.connect();
        }
      });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatusSubject.value;
    const newStatus = { ...currentStatus, ...updates };
    this.connectionStatusSubject.next(newStatus);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get WebSocket URL based on current location
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(): void {
    this.send('heartbeat', { timestamp: new Date() });
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    timer(0, 30000) // Send heartbeat every 30 seconds
      .pipe(
        filter(() => this.isConnected()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.sendHeartbeat());
  }
}