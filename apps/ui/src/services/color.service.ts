
export const colorPallete: string[] = [
  '#434e7d',
  '#3e7567',
  '#753e71',
  '#457538',
  '#387275',
  '#663950',
  '#8fc26b',
  '#916d3d',
  '#b20289'
]

export const randomColorFromPallete = (): string => colorPallete[Math.floor(Math.random() * colorPallete.length)];

export function genRndHex(n: number = 6) {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < n; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function genRndColorHash(keys: any[]) {
  const n = keys.length;
  const hash: any = {};

  for (let i = 0; i < n; i++) {
    const color = genRndHex(6);
    hash[keys[i]] = color;
  }

  return hash;
}

export const getBadgeColor = (riskImpact: number) => {
  if (riskImpact >= 40) return "red";
  else if (riskImpact >= 15) return "orange";
  else return "green";
}

export const getRiskText = (riskImpact: number) => {
  if (riskImpact >= 40) return "High Risk";
  else if (riskImpact >= 15) return "Medium Risk";
  else return "Low Risk";
}

export const getRagColorHex = (ragStatus: string) => {
  if (ragStatus === "Red") return "#DA3637";
  if (ragStatus === "Amber") return "#FFC107";
  return "#77DD77";
}

// New function to get color based on string input
export const getProjectRAGColor = (status: string): string => {
  switch (status) {
    case "Red":
      return "#EEC3C3";
    case "Amber":
      return "#FCECC0";
    case "Green":
      return "#CBE5C8";
    default:
      return randomColorFromPallete();
  }
}