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

//Polyline setup
const polyLine: leaflet.Polyline = leaflet.polyline([[
  player.latlng.lat,
  player.latlng.lng,
]], { color: "blue" }).addTo(map);

//initalize caches
let Caches: Cache[] = [];

//Loading save data
load();

//Place caches
loadCaches(mainBoard, player.cellLatlng);

requestAnimationFrame(realTimeUpdate);

setInterval(save, 1000);

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

const HomeBut = document.getElementById("Home");
HomeBut?.addEventListener("click", () => {
  player.setPos(Oakes);
  mapUpdate();
  map.panTo(player.latlng);
});

const ClearBut = document.getElementById("Reset");
ClearBut?.addEventListener("click", () => {
  if (confirm("Erase all location history and return all coins?")) {
    reset();
  }
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

//Callbacks given success or failure ate acquiring geolocation
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
  polyLine.addLatLng([player.latlng.lat, player.latlng.lng]);

  console.log(polyLine.getLatLngs());
  unloadCaches();
  loadCaches(mainBoard, player.cellLatlng);
}

//given the board and a center point, create/load interactable caches
function loadCaches(board: Board, point: leaflet.LatLng) {
  console.log("Loading Caches");
  const cells: Cell[] = board.getCellsNearPoint(point);
  for (let c = 0; c < cells.length; c++) {
    if (cells[c].cache.length > 0) {
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

//Save Management Functions

function save() {
  console.log("Saving.");
  localStorage.setItem("Path", JSON.stringify(polyLine.getLatLngs()));
  localStorage.setItem("Board", mainBoard.saveBoard());
  localStorage.setItem("Position", player.LLString());
  localStorage.setItem("Coins", player.saveCoins());
}

function load() {
  const thawedPath = localStorage.getItem("Path");
  if (thawedPath != null) {
    polyLine.setLatLngs(JSON.parse(thawedPath));
  }

  const thawedMap = localStorage.getItem("Board");
  if (thawedMap != null) {
    console.log("found map in storage");
    mainBoard.loadBoard(thawedMap);
  }

  const thawedPos = localStorage.getItem("Position");
  if (thawedPos != null) {
    console.log("found pos in storage");
    player.loadPos(thawedPos);
  }

  const thawedCoins = localStorage.getItem("Coins");
  if (thawedCoins != null) {
    console.log("found coins in storage");
    player.loadCoins(thawedCoins);
  }
}

function reset() {
  polyLine.setLatLngs([[player.latlng.lat, player.latlng.lng]]);
  unloadCaches();
  mainBoard.wipeBoard();
  player.wipeCoins();
  localStorage.clear();
  loadCaches(mainBoard, player.cellLatlng);
}
