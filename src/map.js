import { PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide } from "three";

const tile_size_X = 6;
const tile_size_Z = 10;

const terrain_map = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 0, 1, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
];

const get_terrain_tiles_list = () => {
    // Computation of tile sizes:
   const tile_storage = [];

    for (let i = 0; i < terrain_map.length; i++) {
      for (let j = 0; j < terrain_map[i].length; j++) {
        if (terrain_map[i][j] > 0) {
          const tileGeometry = new PlaneGeometry(tile_size_X, tile_size_Z);
          const tileMaterial = new MeshBasicMaterial({ color: 0x13FF77, side: DoubleSide });
          const tileObject = new Mesh(tileGeometry, tileMaterial);
          tileObject.position.set(j * tile_size_X, 0, i * tile_size_Z);
          tileObject.rotateX(Math.PI / 2);
          tile_storage.push(tileObject);
        }
      }
    }
    return tile_storage; 
  }
  
  const get_terrain_type = () => {
    return 0;
  }

  const allow_jump = (player_position, player_radius) => {
    if (Math.abs(player_position.y - player_radius) <= 1 ) {
      return true;
    }
    console.log(`Jump not allowed! y:${player_position.y}`)
    return false;
  }


export {
  get_terrain_tiles_list,
  get_terrain_type,
  allow_jump
}