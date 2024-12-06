import leaflet from "leaflet";
import { Cell } from "./board.ts";
import { Board } from "./board.ts";
import { Player } from "./player.ts";
import roundDec from "./round.ts";

export class Cache {
  readonly i: number;
  readonly j: number;
  readonly degPerTile;
  cache: string[];
  doc: Document;
  map: leaflet.map;
  board: Board;
  motherCell: Cell;
  player: Player;
  box: leaflet.rectangle;

  constructor(
    d: Document,
    map: leaflet.map,
    board: Board,
    cell: Cell,
    p: Player,
    deg: number,
  ) {
    this.doc = d;
    this.map = map;
    this.board = board;
    this.motherCell = cell;
    this.player = p;
    this.box = leaflet.rectangle(this.board.getCellBounds(cell));
    this.degPerTile = deg;

    this.i = cell.i;
    this.j = cell.j;

    this.cache = JSON.parse(cell.cache);

    this.box.addTo(this.map);

    this.box.bindPopup(() => {
      const popupDiv = this.doc.createElement("div");
      popupDiv.innerHTML = `
                  <div>There is a cache here at "${
        roundDec(this.i * this.degPerTile, 4)
      },${
        roundDec(this.j * this.degPerTile, 4)
      }". It has <span id="value">${this.cache.length}</span> coins.</div>
                  <button id="take">take</button><button id="put">put</button>`;

      //Button for taking coins
      popupDiv
        .querySelector<HTMLButtonElement>("#take")!
        .addEventListener("click", () => {
          if (
            this.cache.length > 0 &&
            this.board.playerCell == this.motherCell
          ) {
            const coin = this.cache.pop();
            if (coin != null) {
              this.player.pushCoin(coin);
            }

            popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = this
              .cache.length.toString();
            console.log("took coin " + coin);
            this.save();
          }
        });

      //Button for depositing coins
      popupDiv
        .querySelector<HTMLButtonElement>("#put")!
        .addEventListener("click", () => {
          if (
            this.player.coins.length > 0 &&
            this.board.playerCell == this.motherCell
          ) {
            const coin = this.player.popCoin();
            if (coin != null) {
              this.cache.push(coin);
            }

            popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = this
              .cache.length.toString();
            console.log("placed coin " + coin);
            this.save();
          }
        });

      return popupDiv;
    });
  }

  save() {
    this.motherCell.cache = JSON.stringify(this.cache);
  }

  pack() {
    this.save();
    this.box.remove();
  }
}
