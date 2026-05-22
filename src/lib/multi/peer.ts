import Peer, { type DataConnection } from 'peerjs';
import type { RoomMessage } from '../../types/multi';

// ── Config PeerJS ────────────────────────────────────────────

function createPeer(idSuffix?: string): Peer {
  const id = idSuffix ? `brasfoot-${idSuffix}` : undefined;
  return new Peer(id ?? '', {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    },
  });
}

type MessageCallback   = (from: string, msg: RoomMessage) => void;
type DisconnectCallback = (peerId: string) => void;

// ── HOST ─────────────────────────────────────────────────────

export class HostPeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessageCb: MessageCallback = () => {};
  private onDisconnectCb: DisconnectCallback = () => {};

  /** Inicializa o peer do host e retorna o peer_id gerado */
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      const peer = createPeer();
      this.peer = peer;

      peer.on('open', (id) => resolve(id));
      peer.on('error', (err) => reject(err));

      // Aceitar conexões entrantes de guests
      peer.on('connection', (conn) => this.handleConnection(conn));
    });
  }

  private handleConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      this.onMessageCb(conn.peer, data as RoomMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.onDisconnectCb(conn.peer);
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.onDisconnectCb(conn.peer);
    });
  }

  broadcast(message: RoomMessage): void {
    const data = message;
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(data);
    }
  }

  sendTo(guestPeerId: string, message: RoomMessage): void {
    const conn = this.connections.get(guestPeerId);
    if (conn?.open) conn.send(message);
  }

  onMessage(cb: MessageCallback): void {
    this.onMessageCb = cb;
  }

  onGuestDisconnect(cb: DisconnectCallback): void {
    this.onDisconnectCb = cb;
  }

  getConnectedPeerIds(): string[] {
    return Array.from(this.connections.keys());
  }

  get peerId(): string {
    return this.peer?.id ?? '';
  }

  shutdown(): void {
    for (const conn of this.connections.values()) conn.close();
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}

// ── GUEST ────────────────────────────────────────────────────

export class GuestPeerManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessageCb: ((msg: RoomMessage) => void) = () => {};
  private onDisconnectCb: (() => void) = () => {};

  /** Cria peer do guest e retorna o peer_id gerado */
  async init(): Promise<string> {
    return new Promise((resolve, reject) => {
      const peer = createPeer();
      this.peer = peer;
      peer.on('open', (id) => resolve(id));
      peer.on('error', (err) => reject(err));
    });
  }

  /** Conecta ao host usando o peer_id do host */
  async connectToHost(hostPeerId: string): Promise<void> {
    if (!this.peer) throw new Error('GuestPeerManager: peer não inicializado');

    return new Promise((resolve, reject) => {
      const conn = this.peer!.connect(hostPeerId, { reliable: true });
      this.conn = conn;

      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao conectar ao host'));
      }, 15_000);

      conn.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      conn.on('data', (data) => {
        this.onMessageCb(data as RoomMessage);
      });

      conn.on('close', () => {
        this.onDisconnectCb();
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  send(message: RoomMessage): void {
    if (this.conn?.open) this.conn.send(message);
  }

  onMessage(cb: (msg: RoomMessage) => void): void {
    this.onMessageCb = cb;
  }

  onDisconnect(cb: () => void): void {
    this.onDisconnectCb = cb;
  }

  get peerId(): string {
    return this.peer?.id ?? '';
  }

  shutdown(): void {
    this.conn?.close();
    this.peer?.destroy();
    this.conn = null;
    this.peer = null;
  }
}
