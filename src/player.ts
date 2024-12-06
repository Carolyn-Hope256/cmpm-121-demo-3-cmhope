import leaflet from "leaflet";
//import { Cell } from "./board.ts";
import { Board } from "./board.ts";
import roundDec from "./round.ts";

export class Player {
  doc: Document;
  status: HTMLDivElement;

  latlng: leaflet.latLng;
  cellLatlng = leaflet.latLng;

  leafMap: leaflet.Map;
  marker: leaflet.Marker;

  homeBoard: Board;
  readonly degPerTile: number;
  readonly decimals: number;

  coins: string[];

  constructor(
    ll: leaflet.latLng,
    d: Document,
    statusElement: string,
    map: leaflet.map,
    board: Board,
    tileWidth: number,
    dec: number,
  ) {
    this.doc = d;
    this.homeBoard = board;
    this.leafMap = map;
    this.degPerTile = tileWidth;
    this.decimals = dec;

    this.latlng = this.roundLL(ll);
    this.cellLatlng = this.latlng;

    this.coins = [];

    this.status = this.doc.querySelector<HTMLDivElement>(statusElement)!;

    this.marker = leaflet.marker(this.latlng);
    this.marker.bindTooltip("You are here.");
    this.marker.addTo(this.leafMap);
    this.updateStatus();
  }

  //Rounds a given latlng to the closest cell latlng
  private roundLL(pt: leaflet.latLng): leaflet.latLng {
    const rlat = roundDec(pt.lat, this.decimals);
    const rlng = roundDec(pt.lng, this.decimals);
    return (leaflet.latLng(rlat, rlng));
  }

  //Functions for taking and recieving coins
  popCoin(): string {
    let outCoin = "InvalidCoin";
    if (this.coins.length > 0) {
      const pc = this.coins.pop();
      if (pc != null) {
        outCoin = pc;
      }
    }
    this.updateStatus();
    return outCoin;
  }

  pushCoin(coin: string) {
    this.coins.push(coin);
    this.updateStatus();
  }

  private updateStatus() {
    this.status.innerHTML = `You have ${this.coins.length} coins.`;
  }

  move(x: number, y: number): boolean {
    this.latlng.lat += y * this.degPerTile;
    this.latlng.lng += x * this.degPerTile;
    return (this.setPos());
  }

  //sets the position of the player, returning true if they've entered a new cell
  setPos(LL?: leaflet.latLng): boolean {
    if (LL) {
      this.latlng = LL;
    }

    this.marker.setLatLng(this.latlng);

    const oldCellLatLng = this.cellLatlng;
    this.cellLatlng = this.roundLL(this.latlng);

    if (!this.cellLatlng.equals(oldCellLatLng)) {
      console.log("New Cell Entered");
      this.homeBoard.playerCell = this.homeBoard.getCellForPoint(
        this.cellLatlng,
      );
      return (true);
    }
    return (false);
  }

  //Save data handling functions
  LLString(): string {
    return (JSON.stringify([this.latlng.lat, this.latlng.lng]));
  }

  loadPos(pos: string) {
    const posArr: number[] = JSON.parse(pos);
    this.latlng = leaflet.latLng(posArr[0], posArr[1]);
    this.setPos();
  }

  saveCoins(): string {
    return (JSON.stringify(this.coins));
  }

  loadCoins(coinString: string) {
    this.coins = JSON.parse(coinString);
    this.updateStatus();
  }

  wipeCoins() {
    this.coins = [];
    this.updateStatus();
  }
}
