import leaflet from "leaflet";
import luck from "./luck.ts";
import roundDec from "./round.ts";
export interface Cell {
  readonly i: number;
  readonly j: number;
  cache: string;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;
  readonly cacheChance: number;
  readonly cacheRichness: number;
  playerCell: Cell;

  private knownCells: Map<string, Cell>;

  constructor(
    tileWidth: number,
    tileVisibilityRadius: number,
    luck: number,
    richness: number,
  ) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.cacheChance = luck;
    this.knownCells = new Map();
    this.cacheRichness = richness;
    this.playerCell = { i: 0, j: 0, cache: "" };
  }

  //Factory for printing old cells or making new ones
  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      const c: Cell = { i: i, j: j, cache: "" };
      const seed: number = luck([i, j].toString());

      //Cache creation process
      if (seed < this.cacheChance) {
        c.cache = this.getCoinCode(
          i,
          j,
          Math.ceil(
            luck([i, j].toString() + "coinAmount") * this.cacheRichness,
          ),
        );
      }
      this.knownCells.set(key, c);
    }
    return this.knownCells.get(key)!;
  }

  //Creates JSON-stringified array of unique coins of the format lat:lng#serial
  private getCoinCode(i: number, j: number, numCoins: number): string {
    const coins: string[] = [];
    for (let n = 0; n < numCoins; n++) {
      coins[n] = i + ":" + j + "#" + n;
    }
    return (JSON.stringify(coins));
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: roundDec(point.lat / this.tileWidth, 4),
      j: roundDec(point.lng / this.tileWidth, 4),
      cache: "",
    });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [(cell.i - 0.5) * this.tileWidth, (cell.j - 0.5) * this.tileWidth],
      [(cell.i + 0.5) * this.tileWidth, (cell.j + 0.5) * this.tileWidth],
    ]);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    this.playerCell = originCell;
    for (
      let I = originCell.i - this.tileVisibilityRadius;
      I <= originCell.i + this.tileVisibilityRadius;
      I++
    ) {
      for (
        let J = originCell.j - this.tileVisibilityRadius;
        J <= originCell.j + this.tileVisibilityRadius;
        J++
      ) {
        resultCells.push(this.getCanonicalCell({ i: I, j: J, cache: "" }));
      }
    }
    return resultCells;
  }

  //Functions for handling save data
  saveBoard(): string {
    return (JSON.stringify(Array.from(this.knownCells.entries())));
  }

  loadBoard(thawedMap: string) {
    this.knownCells = new Map(JSON.parse(thawedMap));
  }

  wipeBoard() {
    this.knownCells = new Map();
  }
}
