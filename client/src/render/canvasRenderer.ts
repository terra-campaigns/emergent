import {
  HexTile,
  HexTileType,
  HexWorldState,
} from '@emergent/engine';

export class HexCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private hexRadius = 52; // Distance from center to vertex in pixels

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context from canvas.');
    }
    this.ctx = context;
  }

  public render(state: HexWorldState): void {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Clear background
    this.ctx.fillStyle = '#0a0d14';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Render all hex tiles
    for (const tile of state.tiles) {
      const { x, y } = this.axialToPixel(tile.coordinate.q, tile.coordinate.r, centerX, centerY);
      this.renderHexTile(tile, x, y);
    }

    // 3. Render player wanderer on current hex
    const playerPixel = this.axialToPixel(
      state.player.coordinate.q,
      state.player.coordinate.r,
      centerX,
      centerY
    );
    this.renderPlayer(playerPixel.x, playerPixel.y);
  }

  private axialToPixel(
    q: number,
    r: number,
    centerX: number,
    centerY: number
  ): { x: number; y: number } {
    const x = centerX + this.hexRadius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = centerY + this.hexRadius * (1.5 * r);
    return { x, y };
  }

  private drawHexagonPolygon(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Pointy-topped angles: 30°, 90°, 150°, 210°, 270°, 330°
      const angleDeg = 30 + i * 60;
      const angleRad = (Math.PI / 180) * angleDeg;
      const vx = centerX + radius * Math.cos(angleRad);
      const vy = centerY + radius * Math.sin(angleRad);
      if (i === 0) {
        this.ctx.moveTo(vx, vy);
      } else {
        this.ctx.lineTo(vx, vy);
      }
    }
    this.ctx.closePath();
  }

  private renderHexTile(tile: HexTile, px: number, py: number): void {
    const radius = this.hexRadius - 2; // Subtle 2px gap between adjacent hexes
    this.drawHexagonPolygon(px, py, radius);

    // Fill terrain
    const colours = this.getTerrainColours(tile.terrain);
    this.ctx.fillStyle = colours.fill;
    this.ctx.fill();

    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = colours.stroke;
    this.ctx.stroke();

    // Subtle coordinate tag at top of hex
    this.ctx.fillStyle = '#485266';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${tile.coordinate.q},${tile.coordinate.r}`, px, py - radius * 0.52);

    // Render discoveries on tile
    this.renderTileDiscoveries(tile, px, py);
  }

  private renderTileDiscoveries(tile: HexTile, px: number, py: number): void {
    const hasRevealed = tile.discoveries.some((d) => d.visibility === 'revealed');
    const hasHidden = tile.discoveries.some((d) => d.visibility === 'hidden');

    if (hasRevealed) {
      // Glowing golden relic diamond
      this.ctx.fillStyle = '#e5c07b';
      this.ctx.shadowColor = '#e5c07b';
      this.ctx.shadowBlur = 8;

      this.ctx.beginPath();
      this.ctx.moveTo(px, py + 12);
      this.ctx.lineTo(px + 8, py + 20);
      this.ctx.lineTo(px, py + 28);
      this.ctx.lineTo(px - 8, py + 20);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.shadowBlur = 0; // Reset blur
    } else if (hasHidden) {
      // Unsearched territory indicator: subtle grey pulse dot
      this.ctx.fillStyle = '#3a4459';
      this.ctx.beginPath();
      this.ctx.arc(px, py + 20, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderPlayer(px: number, py: number): void {
    // 1. Soft golden aura
    this.ctx.fillStyle = 'rgba(229, 192, 123, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(px, py, 18, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Inner ring
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#e5c07b';
    this.ctx.beginPath();
    this.ctx.arc(px, py, 11, 0, Math.PI * 2);
    this.ctx.stroke();

    // 3. Central wanderer glyph (tribal chevron)
    this.ctx.fillStyle = '#e5c07b';
    this.ctx.beginPath();
    this.ctx.moveTo(px, py - 6);
    this.ctx.lineTo(px + 5, py + 4);
    this.ctx.lineTo(px, py + 1);
    this.ctx.lineTo(px - 5, py + 4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private getTerrainColours(type: HexTileType): { fill: string; stroke: string } {
    switch (type) {
      case 'plains':
        return { fill: '#16221c', stroke: '#273c32' };
      case 'rubble':
        return { fill: '#232630', stroke: '#363b4a' };
      case 'scrap_wall':
        return { fill: '#33231d', stroke: '#52382f' };
      case 'titan_bulkhead':
        return { fill: '#131826', stroke: '#222f47' };
      case 'waterway':
        return { fill: '#122633', stroke: '#1b3f54' };
    }
  }
}

// Alias for backwards compatibility
export { HexCanvasRenderer as CanvasRenderer };
