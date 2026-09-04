
export type DebouncedFunction<T extends (...args: never[]) => void> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timer: number;

  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => clearTimeout(timer);

  return debounced;
}