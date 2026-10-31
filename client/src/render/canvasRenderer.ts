import { GroundItem, TileType, WorldState } from '@emergent/engine';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private tileSize = 64;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context from canvas.');
    }
    this.ctx = context;
  }

  public render(state: WorldState): void {
    const { width, height, tiles, player, groundItems } = state;

    // Adjust tile size dynamically if canvas width changes
    this.tileSize = Math.floor(this.canvas.width / width);

    // 1. Clear background
    this.ctx.fillStyle = '#0a0d12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Render Tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileType = tiles[y]?.[x] as TileType;
        this.renderTile(tileType, x, y);
      }
    }

    // 3. Render Ground Items
    const itemsByTile = new Map<string, GroundItem[]>();
    for (const g of groundItems) {
      const key = `${g.position.x},${g.position.y}`;
      if (!itemsByTile.has(key)) {
        itemsByTile.set(key, []);
      }
      itemsByTile.get(key)!.push(g);
    }

    for (const [key, items] of itemsByTile.entries()) {
      const [x, y] = key.split(',').map(Number) as [number, number];
      this.renderGroundItems(items, x, y);
    }

    // 4. Render Player
    this.renderPlayer(player.position.x, player.position.y);
  }

  private renderTile(type: TileType, x: number, y: number): void {
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    const sz = this.tileSize;

    switch (type) {
      case 'plains':
        this.ctx.fillStyle = '#1c2421';
        this.ctx.fillRect(px, py, sz, sz);
        // Subtle grass fleck
        this.ctx.fillStyle = '#2d3b36';
        this.ctx.fillRect(px + 14, py + 20, 4, 8);
        this.ctx.fillRect(px + 40, py + 36, 4, 8);
        break;

      case 'rubble':
        this.ctx.fillStyle = '#262b33';
        this.ctx.fillRect(px, py, sz, sz);
        this.ctx.fillStyle = '#3c4450';
        this.ctx.fillRect(px + 12, py + 16, 12, 10);
        this.ctx.fillRect(px + 34, py + 28, 14, 12);
        break;

      case 'scrap_wall':
        this.ctx.fillStyle = '#6b371b';
        this.ctx.fillRect(px, py, sz, sz);
        // Steel rivets and plating
        this.ctx.strokeStyle = '#8f4e24';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + 4, py + 4, sz - 8, sz - 8);
        this.ctx.fillStyle = '#b56531';
        this.ctx.fillRect(px + 8, py + 8, 4, 4);
        this.ctx.fillRect(px + sz - 12, py + 8, 4, 4);
        this.ctx.fillRect(px + 8, py + sz - 12, 4, 4);
        this.ctx.fillRect(px + sz - 12, py + sz - 12, 4, 4);
        break;

      case 'titan_bulkhead':
        this.ctx.fillStyle = '#161d2b';
        this.ctx.fillRect(px, py, sz, sz);
        this.ctx.strokeStyle = '#32405d';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(px + 2, py + 2, sz - 4, sz - 4);
        // Cyan energy seam
        this.ctx.fillStyle = '#387894';
        this.ctx.fillRect(px + sz / 2 - 2, py + 4, 4, sz - 8);
        break;

      case 'waterway':
        this.ctx.fillStyle = '#0e232e';
        this.ctx.fillRect(px, py, sz, sz);
        this.ctx.fillStyle = '#183c4e';
        this.ctx.fillRect(px + 8, py + 22, 24, 4);
        this.ctx.fillRect(px + 28, py + 42, 28, 4);
        break;
    }

    // Grid wireframe
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(px, py, sz, sz);
  }

  private renderGroundItems(items: GroundItem[], x: number, y: number): void {
    const px = x * this.tileSize + this.tileSize / 2;
    const py = y * this.tileSize + this.tileSize / 2;

    // Glowing relic prism
    this.ctx.save();
    this.ctx.fillStyle = '#56b6c2';
    this.ctx.shadowColor = '#56b6c2';
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(px, py - 12);
    this.ctx.lineTo(px + 10, py);
    this.ctx.lineTo(px, py + 12);
    this.ctx.lineTo(px - 10, py);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();

    // Stack count badge if more than 1 item
    if (items.length > 1) {
      this.ctx.fillStyle = '#e5c07b';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(`×${items.length}`, px + 6, py + 16);
    }
  }

  private renderPlayer(x: number, y: number): void {
    const px = x * this.tileSize + this.tileSize / 2;
    const py = y * this.tileSize + this.tileSize / 2;

    this.ctx.save();
    // Golden Wanderer Motif
    this.ctx.shadowColor = '#e5c07b';
    this.ctx.shadowBlur = 12;

    this.ctx.fillStyle = '#e5c07b';
    this.ctx.beginPath();
    this.ctx.arc(px, py, 14, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner compass core
    this.ctx.fillStyle = '#161b22';
    this.ctx.beginPath();
    this.ctx.arc(px, py, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }
}
