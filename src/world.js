/* 
 * world.js
 *
 * Contains everything related to the world
 *   player: position, speed and other physics, and as well score, lives remaining etc...
 *   rendering objects: camera, background, renderer, ...
 * 
*/ 
import { Vector3, Euler } from "three";
import { allow_jump, get_initial_player_position, get_terrain_tiles_list } from "./map";
import { update_player_data } from "./physics";

import * as THREE from 'three';

// Importing assets
import playerTextureURL from '../assets/marble-texture.jpg';
import backgroundPicURL from '../assets/cloud_image.jpg';
import { vector2String, vectorAbsFloor } from "./utils";

// Behaviour Constants
const pushStep_z = 40;
const pushStep_x = 20;
const jump_strength = 80;

const initial_player_data = {
    position: new Vector3(0, 0, 0),
    speed: new Vector3(0, 0, 0),
    push: new Vector3(0, 0, 0),
    rotation: new Euler(),
    camera_z_offset: 4,
    camera_y_offset: 3,
  }  

const player_data = {
    position: new Vector3(0, 0, 0),
    speed: new Vector3(0, 0, 0),
    push: new Vector3(0, 0, 0),
    rotation: new Euler(),
    radius: 1,
    mass: 1,
    camera_z_offset: 4,
    camera_y_offset: 3,
    shouldUpdate: true, // temporary boolean to be able to finish the loop in case of error
    hasJumped: false, // to count between the keyDown and keyUp
  }

const scene_objects = {
  lights: [],
  textures: {},
  cameras: {},
  terrain_objects: [],
  player: {},
} 

const getPlayerData = () => player_data;

const reset_player_data = () => {
    player_data.position.copy(get_initial_player_position());
    player_data.position.setY(player_data.radius + 1); // +1 so that we have a cute bounce at the beginning
    player_data.speed.set(0, 0, 0);
    player_data.push.set(0, 0, 0);
    player_data.camera_y_offset = initial_player_data.camera_y_offset;
    player_data.camera_z_offset = initial_player_data.camera_z_offset;
  };  

const player_move_handler = {
  // Key pressed handlers -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  kd_moveRight: function()  {
      player_data.push.setX(-pushStep_x);
  },
  
  kd_moveLeft: function() {
      player_data.push.setX(pushStep_x);
  },
  
  kd_speedUp: function() {
      player_data.push.setZ(pushStep_z);
  },
  
  kd_slowDown: function() {
      player_data.push.setZ(-pushStep_z);
  },
  
  kd_startjump: function() {
      console.log('Jump detected!')
      if (player_data.hasJumped) {
        // To avoid keeping accelerating on the way up (and make jump strength consistent), we only 
        // count the jump strength during one burst
        player_data.push.setY(0);
      } else if(allow_jump(player_data.position, player_data.radius)) {
          console.log('Recording a jump event!')
          player_data.push.setY(jump_strength);
          player_data.hasJumped = true;
      }
  },
  // Key up handlers -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  ku_accelKey:  function() {
     player_data.push.setZ(0);
  },
  ku_moveXKey: function() {
     player_data.push.setX(0);     
  },
  ku_stopJump: function() {
     console.log('resetting jump')
     player_data.push.setY(0);
     player_data.hasJumped = false;
  },
}

const world_keydown_handler = keyEvent => {
  // lookup object to prevent a massive "if ... elseif ... elseif..."
  const keydownLookup = {
    ArrowUp: player_move_handler.kd_speedUp,
    ArrowDown: player_move_handler.kd_slowDown,
    ArrowLeft: player_move_handler.kd_moveLeft,
    ArrowRight: player_move_handler.kd_moveRight,
    Space: player_move_handler.kd_startjump,
  }

  if (keydownLookup[keyEvent.code] instanceof Function) {
    return keydownLookup[keyEvent.code]();
  }

  // TO DO -> Extract code into the camera handler and call those functions
  if (keyEvent.code == 'KeyW') {
    player_data.camera_z_offset = Math.max(2, player_data.camera_z_offset - 0.05);
  } else if (keyEvent.code == 'KeyS') {
    player_data.camera_z_offset = player_data.camera_z_offset + 0.05;
  } else if (keyEvent.code == 'KeyE') {
    player_data.camera_y_offset = Math.min(20, player_data.camera_y_offset + 0.05);
  } else if (keyEvent.code == 'KeyD') {
    player_data.camera_y_offset = Math.max(2, player_data.camera_y_offset - 0.05);                                                                                                               
  }

};

const world_keyup_handler = keyEvent => {
  const keyup_lookup = {
    ArrowUp: player_move_handler.ku_accelKey,
    ArrowDown: player_move_handler.ku_accelKey,
    ArrowLeft: player_move_handler.ku_moveXKey,
    ArrowRight: player_move_handler.ku_moveXKey,
    Space: player_move_handler.ku_stopJump,
  }
  
  if (keyup_lookup[keyEvent.code]) {
    return keyup_lookup[keyEvent.code]();
  }

};

const update_player_position = () => {
    const rounding_precision = 0.001;
  
    update_player_data(player_data);
    
    // Now we round the positions etc.
    vectorAbsFloor(player_data.position, rounding_precision);
    vectorAbsFloor(player_data.speed, rounding_precision);
    
    if (player_data.position.y - player_data.radius <= 0.01 && player_data.speed.y < 0) {
      console.log(`Going down - ${vector2String(player_data.position)} - ${vector2String(player_data.speed)}`);
    }
  
    player_data.rotation.set(
        player_data.position.z / player_data.radius,
        0,
        0 //-player_data.position.x / player_data.radius, 
        );
  
    scene_objects.player.mesh.position.copy(player_data.position);
    scene_objects.player.mesh.rotation.copy(player_data.rotation);
};

const test_player_death = () => {
  if (player_data.position.y < 0) {
    console.log(`Player death! pos: ${vector2String(player_data.position)}, speed: ${vector2String(player_data.speed)}`);
    return true;
  }
  return false;
}


const init_scene = () => {
  scene_objects.scene = new THREE.Scene(); // Scene = Container where we will put objects
  
  scene_objects.textures.bgTexture = new THREE.TextureLoader().load(backgroundPicURL);
  scene_objects.scene.background = scene_objects.textures.bgTexture;

  scene_objects.renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
  });

  scene_objects.renderer.setPixelRatio(window.devicePixelRatio);
  scene_objects.renderer.setSize(window.innerWidth, 0.9 * window.innerHeight);
}

const add_terrain_tiles = () => {
  for (const tile of get_terrain_tiles_list()) {
    scene_objects.terrain_objects.push(tile)
  }
}

const add_objects = () => {
  // Adding the main camera
  scene_objects.cameras.playerCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  scene_objects.scene.add(scene_objects.cameras.playerCamera);

  // Adding the main player object
  scene_objects.player.geometry = new THREE.SphereGeometry(player_data.radius);
  const imageTexture = new THREE.TextureLoader().load(playerTextureURL);
  scene_objects.player.material = new THREE.MeshBasicMaterial( { map: imageTexture});
  scene_objects.player.mesh = new THREE.Mesh(scene_objects.player.geometry, scene_objects.player.material);
  scene_objects.scene.add(scene_objects.player.mesh);

  // Adding ambientlight
  scene_objects.lights.push(new THREE.AmbientLight(0xffffff));
  for (const light of scene_objects.lights) {
    scene_objects.scene.add(light);
  }

  // Adding tiles (terrain)
  add_terrain_tiles();
  for (const tile of scene_objects.terrain_objects) {
    scene_objects.scene.add(tile);
  }

}

const init_world = () => {
  init_scene();
  add_objects();
  reset_player_data();
}

const updateCameraPosition = () => {
  const player_data = getPlayerData();
  scene_objects.cameras.playerCamera.position.x = player_data.position.x;
  scene_objects.cameras.playerCamera.position.y = player_data.position.y + player_data.camera_y_offset;
  scene_objects.cameras.playerCamera.position.z = player_data.position.z - player_data.camera_z_offset;
  scene_objects.cameras.playerCamera.lookAt(player_data.position);
}

const update_window_size = () => {
  scene_objects.renderer.setSize(window.innerWidth, 0.9 * window.innerHeight);
  scene_objects.cameras.playerCamera.aspect = window.innerWidth / ( 0.9 * window.innerHeight);
  scene_objects.cameras.playerCamera.updateProjectionMatrix();
}

const start_mainLoop = updateDisplayRoutine => {
  scene_objects.renderer.setAnimationLoop( () => {
    
    update_window_size();
    update_player_position();
    updateCameraPosition();
    if (updateDisplayRoutine instanceof Function) {
      updateDisplayRoutine();
    }
    
    //document.getElementById('position_log').innerHTML += `<p>${vector2String(player_data.position)}</p><p>${vector2String(player_data.speed)}</p>`

    if (test_player_death()) {
      stop_mainLoop();
    }

    scene_objects.renderer.render(scene_objects.scene, scene_objects.cameras.playerCamera);

  });
};

const stop_mainLoop = () => {
  scene_objects.renderer.setAnimationLoop(() => {});
};

export {
    getPlayerData,
    reset_player_data,
    world_keydown_handler,
    world_keyup_handler,
    update_player_position,
    init_world,
    start_mainLoop,
    stop_mainLoop
}
