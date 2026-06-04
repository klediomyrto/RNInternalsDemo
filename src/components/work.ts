/**
 * Helpers that deliberately consume CPU on the JS thread so we can observe and
 * then fix jank.
 */

/** A pure number-crunch used to give list items a non-trivial render cost. */
export const expensiveFormat = (n: number): string => {
  let x = n;
  for (let i = 0; i < 400; i++) {
    x = (x * 31 + 7) % 1000003;
  }
  return x.toString(16).padStart(5, '0');
}
