
export const rndInt = (min = 1, max = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const rndTitle = () => Math.random().toString(36).substr(2, 9);
