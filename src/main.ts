// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Deterministic random number generator
import { Cell } from "./board.ts";
import { Board } from "./board.ts";
import { Player } from "./player.ts";
import { Cache } from "./cache.ts";

const app: HTMLDivElement = document.querySelector("#app")!;

const testbutton: HTMLButtonElement = document.createElement("button");
testbutton.innerHTML = "Click Here!";
testbutton.onclick = function () {
  alert("Hooray!");
};

app.append(testbutton);

//Magic Numbers
const Oakes = leaflet.latLng(36.9894, -122.0627);
const degPerTile: number = 1e-4;

//Params
const SpawnArea = 8;
const cacheSpawnRate = 0.1;
const cacheRichness = 4;
const MinZoom = 18;
const MaxZoom = 20;

//Map Creation
const map: leaflet.Map = leaflet.map(document.getElementById("map")!, {
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

//Board setup and cache array declaration
const mainBoard: Board = new Board(
  degPerTile,
  SpawnArea,
  cacheSpawnRate,
  cacheRichness,
);

//Player setup

const player = new Player(
  Oakes,
  document,
  "#statusPanel",
  map,
  mainBoard,
  degPerTile,
  4,
);

//initalize caches
let Caches: Cache[] = [];
loadCaches(mainBoard, Oakes);

//button setup. make this more elegant later
const NBut = document.getElementById("north");
NBut?.addEventListener("click", () => {
  player.move(0, 1);
  unloadCaches();
  loadCaches(mainBoard, player.latlng);
});

const EBut = document.getElementById("east");
EBut?.addEventListener("click", () => {
  player.move(1, 0);
  unloadCaches();
  loadCaches(mainBoard, player.latlng);
});

const SBut = document.getElementById("south");
SBut?.addEventListener("click", () => {
  player.move(0, -1);
  unloadCaches();
  loadCaches(mainBoard, player.latlng);
});

const WBut = document.getElementById("west");
WBut?.addEventListener("click", () => {
  player.move(-1, 0);
  unloadCaches();
  loadCaches(mainBoard, player.latlng);
});

//given the board and a center point, create/load interactable caches
function loadCaches(board: Board, point: leaflet.LatLng) {
  const cells: Cell[] = board.getCellsNearPoint(point);
  for (let c = 0; c < cells.length; c++) {
    if (cells[c].cache.length > 0) {
      //createCache(board, cells[c]);
      Caches.push(
        new Cache(document, map, mainBoard, cells[c], player, degPerTile),
      );
    }
  }
}

function unloadCaches() {
  for (let i = 0; i < Caches.length; i++) {
    Caches[i].pack();
  }
  Caches = [];
}
