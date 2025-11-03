
export function handleNodeClick(d) {
  if (d.target.__data__.data.ext_url) {
    window.open(d.target.__data__.data.ext_url, "_blank");
  }
}

export function getStateColor(state) {
  if (state === "New") return "gray";
  if (state === "Active") return "blue";
  if (state === "Approved") return "blue";
  if (state === "Closed") return "green";
  return "orange";
}
