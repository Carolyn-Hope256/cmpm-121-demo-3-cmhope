export class Cache {
  readonly i: number;
  readonly j: number;
  cache: string[];

  constructor(lat: number, lng: number, coins: string[] = []) {
    this.i = lat;
    this.j = lng;
    this.cache = coins;
  }
}
