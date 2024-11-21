// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Deterministic random number generator
import _luck from "./luck.ts";
import { Cell } from "./board.ts";
import { Board } from "./board.ts";

const app: HTMLDivElement = document.querySelector("#app")!;

const testbutton: HTMLButtonElement = document.createElement("button");
testbutton.innerHTML = "Click Here!";
testbutton.onclick = function () {
  alert("Hooray!");
};

app.append(testbutton);

//Magic Numbers
const Oakes = leaflet.latLng(36.98949379578401, -122.06277128548504);
const degPerTile: number = 1e-4;

//Params
const SpawnArea = 8;
const cacheSpawnRate = 0.1;
const cacheRichness = 4;
const MinZoom = 18;
const MaxZoom = 20;

//Map Creation
const map = leaflet.map(document.getElementById("map")!, {
  center: Oakes,
  zoom: 19,
  minZoom: MinZoom,
  maxZoom: MaxZoom,
  zoomControl: true,
  scrollWheelZoom: true,
});

//add background
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

//Board setup
const mainBoard: Board = new Board(
  degPerTile,
  SpawnArea,
  cacheSpawnRate,
  cacheRichness,
);

//Player marker and UI setup
const player = leaflet.marker(Oakes);
player.bindTooltip("You are here.");
player.addTo(map);

const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!; // element `statusPanel` is defined in index.html
const playerCoins: string[] = [];
statusPanel.innerHTML = `You have ${playerCoins} coins.`;

//button setup. make this more elegant later
const NBut = document.getElementById("north");
NBut?.addEventListener("click", () => {
  movePlayer(0, 1);
});

const EBut = document.getElementById("east");
EBut?.addEventListener("click", () => {
  movePlayer(1, 0);
});

const SBut = document.getElementById("south");
SBut?.addEventListener("click", () => {
  movePlayer(0, -1);
});

const WBut = document.getElementById("west");
WBut?.addEventListener("click", () => {
  movePlayer(-1, 0);
});

//initalize caches
loadCaches(mainBoard, Oakes);

//Given a board and a cell on it, create an interactable cache
function createCache(board: Board, cell: Cell) {
  const box = board.getCellBounds(cell);

  const cachebox = leaflet.rectangle(box);
  cachebox.addTo(map);

  const cacheCoins: string[] = JSON.parse(cell.cache);

  cachebox.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${cell.i * degPerTile},${
      cell.j * degPerTile
    }". It has <span id="value">${cacheCoins.length}</span> coins.</div>
                <button id="take">take</button><button id="put">put</button>`;

    //Button for taking coins
    popupDiv
      .querySelector<HTMLButtonElement>("#take")!
      .addEventListener("click", () => {
        if (
          cacheCoins.length > 0 &&
          player
            .getLatLng()
            .equals(
              leaflet.latLng(
                cell.i * degPerTile,
                cell.j * degPerTile,
              ),
            )
        ) {
          const coin = cacheCoins.pop();
          playerCoins.push(coin ? coin : "");
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            cacheCoins.length.toString();
          console.log("took coin " + coin);
          statusPanel.innerHTML = `You have ${playerCoins.length} coins.`;
        }
      });

    //Button for depositing coins
    popupDiv
      .querySelector<HTMLButtonElement>("#put")!
      .addEventListener("click", () => {
        if (
          playerCoins.length > 0 &&
          player
            .getLatLng()
            .equals(
              leaflet.latLng(
                cell.i * degPerTile,
                cell.j * degPerTile,
              ),
            )
        ) {
          const coin = playerCoins.pop();
          cacheCoins.push(coin ? coin : "");
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            cacheCoins.length.toString();
          console.log("placed coin " + coin);
          statusPanel.innerHTML = `You have ${playerCoins.length} coins.`;
        }
      });
    return popupDiv;
  });
}

//Moves the player the specified number of tiles along the specified axes
function movePlayer(x: number, y: number) {
  player.setLatLng(
    leaflet.latLng(
      player.getLatLng().lat + y * degPerTile,
      player.getLatLng().lng + x * degPerTile,
    ),
  );
}

//given the board and a center point, create/load interactable caches
function loadCaches(board: Board, point: leaflet.LatLng) {
  const cells: Cell[] = board.getCellsNearPoint(point);
  for (let c = 0; c < cells.length; c++) {
    if (cells[c].cache.length > 0) {
      createCache(board, cells[c]);
    }
  }
}
