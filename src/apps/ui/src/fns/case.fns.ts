
export function kebabToUpperCaseSnake(str: string) {
  return str.replace(/-/g, "_").toUpperCase();
}
