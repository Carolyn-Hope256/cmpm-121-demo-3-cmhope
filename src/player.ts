import leaflet from "leaflet";
//import { Cell } from "./board.ts";
import { Board } from "./board.ts";
import roundDec from "./round.ts";

export class Player {
  doc: Document;
  status: HTMLDivElement;

  latlng: leaflet.latLng;

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

    this.coins = [];

    this.status = this.doc.querySelector<HTMLDivElement>(statusElement)!;

    this.marker = leaflet.marker(this.latlng);
    this.marker.bindTooltip("You are here.");
    this.marker.addTo(this.leafMap);
  }

  private roundLL(pt: leaflet.latLng): leaflet.latLng {
    const rlat = roundDec(pt.lat, this.decimals);
    const rlng = roundDec(pt.lng, this.decimals);
    return (leaflet.latLng(rlat, rlng));
  }

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

  move(x: number, y: number) {
    this.latlng.lat += y * this.degPerTile;
    this.latlng.lng += x * this.degPerTile;
    this.latlng = this.roundLL(this.latlng);

    this.marker.setLatLng(this.latlng);
    this.homeBoard.playerCell = this.homeBoard.getCellForPoint(this.latlng);
  }
}