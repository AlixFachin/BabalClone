import './style.css'

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const player_data = {
  position: { x: 0, y: 2, z: 0},
  speed: { x: 0, y: 0, z: 0},
  accel: { x: 0, y: 0, z: 0},
  rotation: { x: 0, y: 0, z: 0},
  radius: 2,
}

const play_area = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 0, 1, 1],
];

const scene_objects = {
  lights: [],
  textures: {},
  cameras: {},
  terrain_objects: [],
  player: {},
}

const init_scene = () => {
  scene_objects.scene = new THREE.Scene(); // Scene = Container where we will put objects
  
  scene_objects.textures.bgTexture = new THREE.TextureLoader().load('cloud_image.jpg');
  scene_objects.scene.background = scene_objects.textures.bgTexture;

  scene_objects.renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
  });

  scene_objects.renderer.setPixelRatio(window.devicePixelRatio);
  scene_objects.renderer.setSize(window.innerWidth, window.innerHeight);
}

const add_terrain_tiles = () => {
  // Computation of tile sizes:
  const tile_width = player_data.radius * 6;
  const tile_height = player_data.radius * 10;

  for (let i = 0; i < play_area.length; i++) {
    for (let j = 0; j < play_area[i].length; j++) {
      if (play_area[i][j] > 0) {
        const tileGeometry = new THREE.PlaneGeometry(tile_width, tile_height);
        const tileMaterial = new THREE.MeshBasicMaterial({ color: 0x13FF77, side: THREE.DoubleSide });
        const tileObject = new THREE.Mesh(tileGeometry, tileMaterial);
        tileObject.position.set(j * tile_width, 0, i * tile_height);
        tileObject.rotateX(Math.PI / 2);
        scene_objects.terrain_objects.push(tileObject);
      }
    }
  }
}

const add_objects = () => {
  // Adding the main camera
  scene_objects.cameras.playerCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene_objects.scene.add(scene_objects.cameras.playerCamera);

  // Adding the main player object
  scene_objects.player.geometry = new THREE.SphereGeometry(player_data.radius);
  const imageTexture = new THREE.TextureLoader().load('grass.jpg');
  scene_objects.player.material = new THREE.MeshBasicMaterial( { map: imageTexture});
  scene_objects.player.mesh = new THREE.Mesh(scene_objects.player.geometry, scene_objects.player.material);
  scene_objects.scene.add(scene_objects.player.mesh);

  // Adding ambientlight
  scene_objects.lights.push(new THREE.AmbientLight(0xffffff));
  const newPointLight = new THREE.PointLight(0xffffff);
  newPointLight.position.set(5,5,5);
  scene_objects.lights.push(newPointLight);
  for (const light of scene_objects.lights) {
    scene_objects.scene.add(light);
  }

  // Adding tiles (terrain)
  add_terrain_tiles();
  for (const tile of scene_objects.terrain_objects) {
    scene_objects.scene.add(tile);
  }

  // Grid helper (to represent the ocean?)
  scene_objects.scene.add(new THREE.GridHelper(200,50));

  // Orbit Controls (for debug only)
  scene_objects.controls = new OrbitControls(scene_objects.cameras.playerCamera, scene_objects.renderer.domElement);

}

const updateCameraPosition = () => {
  scene_objects.cameras.playerCamera.position.x = player_data.position.x;
  scene_objects.cameras.playerCamera.position.y = player_data.position.y + 3;
  scene_objects.cameras.playerCamera.position.z = player_data.position.z - 8;
}

// Keypressed Event and player position update

const keydown_handler = (keyEvent) => {
  const accelStep_z = 0.1;
  const accelStep_x = 0.05;
  const max_accel_z = 3;
  const max_accel_x = 0.8;
  
  if (keyEvent.code == 'ArrowUp') {
    player_data.accel.z = Math.min(player_data.accel.z + accelStep_z, max_accel_z);
  } else if (keyEvent.code == 'ArrowDown') {
    player_data.accel.z = Math.max(player_data.accel.z - accelStep_z, -max_accel_z);
  }
}
document.addEventListener('keydown', keydown_handler);



const update_player_position = () => {
  const dt = 0.01; // Time scaling factor

  player_data.speed.x += player_data.accel.x * dt;
  player_data.speed.y += player_data.accel.y * dt;
  player_data.speed.z += player_data.accel.z * dt;
  
  player_data.position.x += player_data.speed.x * dt;
  player_data.position.y += player_data.speed.y * dt;
  player_data.position.z += player_data.speed.z * dt;

  player_data.rotation.x += player_data.speed.z * dt / player_data.radius;

  scene_objects.player.mesh.position.set(player_data.position.x, player_data.position.y, player_data.position.z);
  scene_objects.player.mesh.rotation.set(player_data.rotation.x, player_data.rotation.y, player_data.rotation.z);

}

const display_player_stats = () => {
  const _2digits = x => Math.round(x*100)/100;
  
  const panel = document.getElementById('score_panel');
  const position_string = `Position: (${_2digits(player_data.position.x)},${_2digits(player_data.position.y)},${_2digits(player_data.position.z)})`;
  const speed_string = `Speed: (${_2digits(player_data.speed.x)},${_2digits(player_data.speed.y)},${_2digits(player_data.speed.z)})`;
  const accel_string = `Accel: (${_2digits(player_data.accel.x)},${_2digits(player_data.accel.y)},${_2digits(player_data.accel.z)})`;
  panel.innerText = [ position_string, speed_string, accel_string].join('\n');
}

// Init functions 
init_scene();
add_objects();
updateCameraPosition();

const animate = () => {
  requestAnimationFrame(animate);

  //scene_objects.controls.update();

  // Updating position of player sprite according to the accel
  update_player_position();
  updateCameraPosition();

  display_player_stats();


  scene_objects.renderer.render(scene_objects.scene, scene_objects.cameras.playerCamera);
}

animate();