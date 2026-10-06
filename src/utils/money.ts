export function formatRand(cents: number) {
  const amount = cents / 100;
  return `R${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}
