// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Deterministic random number generator
import luck from "./luck.ts";

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

//Player marker and UI setup
const player = leaflet.marker(Oakes);
player.bindTooltip("You are here.");
player.addTo(map);

const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!; // element `statusPanel` is defined in index.html
let playerCoins: number = 0;
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

placeCaches(SpawnArea, cacheSpawnRate, cacheRichness);

function createCache(x: number, y: number, coins: number) {
  const home = Oakes;
  const box = leaflet.latLngBounds([
    [home.lat + (y - 0.5) * degPerTile, home.lng + (x - 0.5) * degPerTile],
    [home.lat + (y + 0.5) * degPerTile, home.lng + (x + 0.5) * degPerTile],
  ]);

  const cachebox = leaflet.rectangle(box);
  cachebox.addTo(map);

  let cacheCoins: number = coins;

  cachebox.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${x},${y}". It has <span id="value">${coins}</span> coins.</div>
                <button id="take">take</button><button id="put">put</button>`;

    //Button for taking coins
    popupDiv
      .querySelector<HTMLButtonElement>("#take")!
      .addEventListener("click", () => {
        if (
          cacheCoins > 0 &&
          player
            .getLatLng()
            .equals(
              leaflet.latLng(
                home.lat + y * degPerTile,
                home.lng + x * degPerTile,
              ),
            )
        ) {
          cacheCoins--;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            cacheCoins.toString();
          playerCoins++;
          statusPanel.innerHTML = `You have ${playerCoins} coins.`;
        }
      });

    //Button for depositing coins
    popupDiv
      .querySelector<HTMLButtonElement>("#put")!
      .addEventListener("click", () => {
        if (
          playerCoins > 0 &&
          player
            .getLatLng()
            .equals(
              leaflet.latLng(
                home.lat + y * degPerTile,
                home.lng + x * degPerTile,
              ),
            )
        ) {
          cacheCoins++;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            cacheCoins.toString();
          playerCoins--;
          statusPanel.innerHTML = `You have ${playerCoins} coins.`;
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

function placeCaches(radius: number, frequency: number, richness: number) {
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      if (luck([i, j].toString()) < frequency) {
        createCache(
          i,
          j,
          Math.ceil(luck([i, j].toString() + "coinAmount") * richness),
        );
      }
    }
  }
}
