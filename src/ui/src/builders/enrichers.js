// const enrichWithDisplayLines = (n) => {
//   n.display_lines = [];
//   n.display_lines.push(
//     `ID: ${n.id}`, 
//     `Title: ${n.title}`, 
//     `Type: ${n.type}`, 
//     `State: ${n.state}`, 
//     `Complete: ${Math.floor(n.percentComplete)}%` 
//   );

//   for (const d of n.children) {
//     enrichWithDisplays(d);
//   }
// }

export function enrichWithAccumChildPercComplete(node) {

  if (node.children.length === 0) {
    node.percentComplete = node.state === "Closed" ? 100 : 0;
  } else {

    const totalChildren = node.children.length;

    let numerator = 0;
    const denominator = totalChildren * 100;

    for (const child of node.children) {
      enrichWithAccumChildPercComplete(child);

      if (child.percentComplete !== undefined) {
        numerator += child.percentComplete;
      }
    }

    node.percentComplete = numerator / denominator * 100;
  }
}
