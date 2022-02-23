import '../style.css'

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { update_player_data } from './physics';

// Importing assets
import playerTextureURL from '../assets/marble-texture.jpg';
import backgroundPicURL from '../assets/cloud_image.jpg';

const player_data = {
  position: new THREE.Vector3(0, 2, 0),
  speed: new THREE.Vector3(0, 0, 0),
  push: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Euler(),
  radius: 2,
  mass: 1,
  shouldUpdate: true, // temporary boolean to be able to finish the loop in case of error
  hasJumped: false, // to count between the keyDown and keyUp
}

const terrain_map = [
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
  
  scene_objects.textures.bgTexture = new THREE.TextureLoader().load(backgroundPicURL);
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

  for (let i = 0; i < terrain_map.length; i++) {
    for (let j = 0; j < terrain_map[i].length; j++) {
      if (terrain_map[i][j] > 0) {
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
  const imageTexture = new THREE.TextureLoader().load(playerTextureURL);
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

const keydown_handler = keyEvent => {
  const pushStep_z = 40;
  const pushStep_x = 20;
  const jump_strength = 400;
  
  player_data.push.set(0, 0, 0);

  if (keyEvent.code == 'ArrowUp') {
    player_data.push.setZ(pushStep_z);
  } else if (keyEvent.code == 'ArrowDown') {
    player_data.push.setZ(-pushStep_z);
  } else if (keyEvent.code == 'ArrowLeft') {
    player_data.push.setX(pushStep_x);
  } else if (keyEvent.code == 'ArrowRight') {
    player_data.push.setX(-pushStep_x);
  } else if (keyEvent.code == 'Space') {
    if (player_data.hasJumped) {
      // To avoid keeping accelerating on the way up (and make jump strength consistent), we only 
      // count the jump strength during one burst
      player_data.push.setY(0);
    } else if(allow_jump()) {
        console.log('Recording a jump event!')
        player_data.push.setY(jump_strength);
        player_data.hasJumped = true;
    }
  } else if (keyEvent.code == 'Escape') {
    player_data.shouldUpdate = false;
  }
}

const keyup_handler = keyEvent => {
  if (keyEvent.code == 'ArrowUp' || keyEvent.code == 'ArrowDown') {
    player_data.push.setZ(0);
  } else if (keyEvent.code == 'ArrowLeft' || keyEvent.code == 'ArrowRight') {
    player_data.push.setX(0);
  } else if (keyEvent.code == 'Space') {
    console.log('resetting jump')
    player_data.push.setY(0);
    player_data.hasJumped = false;
  } 
}

document.addEventListener('keydown', keydown_handler);
document.addEventListener('keyup', keyup_handler);

// Function which returns whether the player is allowed to jump or not (similar to collision, the player is allowed
// to jump only "near surfaces")
const allow_jump = () => {
  if (Math.abs(player_data.position.y - player_data.radius) <= 1 ) {
    return true;
  }
  console.log(`Jump not allowed! y:${player_data.position.y}`)
  return false;
}

const update_player_position = () => {
  const rounding_precision = 0.001;

  update_player_data(player_data);
  
  // Now we round the positions etc.
  player_data.position.multiplyScalar(1 / rounding_precision);
  player_data.position.floor();
  player_data.position.multiplyScalar(rounding_precision);
  player_data.speed.multiplyScalar(1 / rounding_precision);
  player_data.speed.floor();
  player_data.speed.multiplyScalar(rounding_precision);  


  player_data.rotation.set(
      player_data.position.z / player_data.radius,
      0,
      0 //-player_data.position.x / player_data.radius, 
      );

  scene_objects.player.mesh.position.copy(player_data.position);
  scene_objects.player.mesh.rotation.copy(player_data.rotation);
}
 
const display_player_stats = () => {
  const _2digits = x => Math.round(x*100)/100;
  
  const panel = document.getElementById('score_panel');
  const position_string = `Position: (${_2digits(player_data.position.x)},${_2digits(player_data.position.y)},${_2digits(player_data.position.z)})`;
  const speed_string = `Speed: (${_2digits(player_data.speed.x)},${_2digits(player_data.speed.y)},${_2digits(player_data.speed.z)})`;
  const push_string = `Push: (${_2digits(player_data.push.x)},${_2digits(player_data.push.y)},${_2digits(player_data.push.z)})`;
  const rot_string = `Rotation: (${_2digits(player_data.rotation.x)},${_2digits(player_data.rotation.y)},${_2digits(player_data.rotation.z)})`
  panel.innerText = [ position_string, speed_string, push_string, rot_string].join('\n');
}

// Init functions 
init_scene();
add_objects();
//update_player_position();
updateCameraPosition();

const mainLoop = () => {
  if (player_data.shouldUpdate) requestAnimationFrame(mainLoop);

  scene_objects.controls.update();

  // Updating position of player sprite according to the accel
  update_player_position();
  //updateCameraPosition();

  display_player_stats();


  scene_objects.renderer.render(scene_objects.scene, scene_objects.cameras.playerCamera);
}

mainLoop();