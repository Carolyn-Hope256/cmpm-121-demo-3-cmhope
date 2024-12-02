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

//Params
const Oakes = leaflet.latLng(36.9894, -122.0627);
const degPerTile: number = 1e-4;
const SpawnArea = 8;
const cacheSpawnRate = 0.1;
const cacheRichness = 4;
const MinZoom = 18;
const MaxZoom = 20;
const TilesPerMove = .25;

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

let geoPos = false;

//initalize caches
let Caches: Cache[] = [];
loadCaches(mainBoard, Oakes);
requestAnimationFrame(realTimeUpdate);

//button setup. make this more elegant later
const GeoBut = document.getElementById("sensor");
GeoBut?.addEventListener("click", () => {
  geoPos = !geoPos;
});

const NBut = document.getElementById("north");
NBut?.addEventListener("click", () => {
  if (player.move(0, TilesPerMove)) {
    mapUpdate();
  }
});

const EBut = document.getElementById("east");
EBut?.addEventListener("click", () => {
  if (player.move(TilesPerMove, 0)) {
    mapUpdate();
  }
});

const SBut = document.getElementById("south");
SBut?.addEventListener("click", () => {
  if (player.move(0, -TilesPerMove)) {
    mapUpdate();
  }
});

const WBut = document.getElementById("west");
WBut?.addEventListener("click", () => {
  if (player.move(-TilesPerMove, 0)) {
    mapUpdate();
  }
});

const CamBut = document.getElementById("Center");
CamBut?.addEventListener("click", () => {
  map.panTo(player.latlng);
});

function realTimeUpdate() { //Called every frame, updates player position when geolocation enabled
  if (geoPos) {
    const geo = navigator.geolocation;
    console.log(geo);
    if (geo != null) {
      geo.getCurrentPosition(successCallback, erroCallback);
    }
  } else {
    requestAnimationFrame(realTimeUpdate);
  }
}

function successCallback(position: GeolocationPosition) {
  const curPos: leaflet.LatLng = leaflet.latLng(
    position.coords.latitude,
    position.coords.longitude,
  );
  if (player.setPos(curPos)) {
    mapUpdate();
  }
  requestAnimationFrame(realTimeUpdate);
}

function erroCallback(_error: GeolocationPositionError) {
  geoPos = false;
  console.log("failed to enable geopositioning.");
  requestAnimationFrame(realTimeUpdate);
}

//Called whenever the player enters a new tile
function mapUpdate() {
  unloadCaches();
  loadCaches(mainBoard, player.cellLatlng);
}

//given the board and a center point, create/load interactable caches
function loadCaches(board: Board, point: leaflet.LatLng) {
  console.log("Loading Caches");
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
  console.log("Unloading Caches");
  for (let i = 0; i < Caches.length; i++) {
    Caches[i].pack();
  }
  Caches = [];
}
