/** Format amounts in Nigerian Naira (matches feed cards). */
export function formatNaira(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₦0";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}
