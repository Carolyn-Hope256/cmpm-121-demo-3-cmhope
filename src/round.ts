export default function roundDec(num: number, dec: number) {
  const e: number = 10 ** dec;
  return (Math.round(num * e) / e);
}
