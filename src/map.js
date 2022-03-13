import { Vector3 } from "three";
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
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
];

const get_initial_player_position = () => {
  return new Vector3( (terrain_map[0].length * tile_size_X) / 2, 0, tile_size_Z / 2);
};

const get_terrain_tiles_list = () => {
    // Computation of tile sizes:
   const tile_storage = [];

    for (let i = 0; i < terrain_map.length; i++) {
      for (let j = 0; j < terrain_map[i].length; j++) {
        if (terrain_map[i][j] > 0) {
          const tileGeometry = new PlaneGeometry(tile_size_X, tile_size_Z);
          const tileMaterial = new MeshBasicMaterial({ color: 0x13FF77, side: DoubleSide });
          const tileObject = new Mesh(tileGeometry, tileMaterial);
          tileObject.rotateX(Math.PI / 2);
          tileObject.position.set((j + 0.5) * tile_size_X, 0, (i+ 0.5) * tile_size_Z); // 0.5 because the position is for the center of the tile
          tile_storage.push(tileObject);
        }
      }
    }
    return tile_storage; 
  }
  
  const get_terrain_type = position => {
    const z_index = Math.floor(position.z / tile_size_Z);
    const x_index = Math.floor(position.x / tile_size_X);

    if (z_index < 0 || z_index >= terrain_map.length) {
      console.log(`get_terrain_type: z_index is out of bounds: ${z_index} (max value: ${terrain_map.length})`);
      return 0;
    }

    if (x_index < 0 || x_index >= terrain_map[z_index].length) {
      console.log(`get_terrain_type: x_index is out of bounds: ${x_index} (max value: ${terrain_map[z_index].length})`);
      return 0;
    }

    return terrain_map[z_index][x_index];

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
  get_initial_player_position,
  get_terrain_type,
  allow_jump
}