// frontend/src/utils/geometry.js

// Nokta poligonun içinde mi? (Ray Casting Algorithm)
// point: [Enlem, Boylam]
// vs: Array of [Boylam, Enlem] (GeoJSON formatı)
export function isPointInsidePolygon(point, vs) {
    const x = point[1]; // Boylam
    const y = point[0]; // Enlem
  
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
  
      const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi + 0.00000001) + xi);
  
      if (intersect) inside = !inside;
    }
    return inside;
}