/* 
 * main.js
 *
 * File which contains the game backbone, i.e. key handlers, menus, state machine, main loop, sidebar management etc...
 * 
*/ 

import '../style.css'

import {  world_keydown_handler, world_keyup_handler, getPlayerData, reset_player_data, init_world, start_mainLoop } from './world';

// Keypressed Event and player position update

const keydown_handler = keyEvent => {
  keyEvent.preventDefault();  
  world_keydown_handler(keyEvent);
};

const keyup_handler = keyEvent => {
  keyEvent.preventDefault();
  world_keyup_handler(keyEvent);
}

const initEventHandlers = () => {
  document.addEventListener('keydown', keydown_handler);
  document.addEventListener('keyup', keyup_handler);
  document.getElementById('reset_button').addEventListener('click', reset_player_data);
}


// Function which returns whether the player is allowed to jump or not (similar to collision, the player is allowed
// to jump only "near surfaces")
 
const display_player_stats = () => {
  // helper function to round to 2 digits
  const _2digits = x => Math.round(x*100)/100;
  const player_data = getPlayerData();

  const panel = document.getElementById('score_panel');
  const position_string = `Position: (${_2digits(player_data.position.x)},${_2digits(player_data.position.y)},${_2digits(player_data.position.z)})`;
  const speed_string = `Speed: (${_2digits(player_data.speed.x)},${_2digits(player_data.speed.y)},${_2digits(player_data.speed.z)})`;
  const push_string = `Push: (${_2digits(player_data.push.x)},${_2digits(player_data.push.y)},${_2digits(player_data.push.z)})`;
  const rot_string = `Rotation: (${_2digits(player_data.rotation.x)},${_2digits(player_data.rotation.y)},${_2digits(player_data.rotation.z)})`
  panel.innerText = [ position_string, speed_string, push_string, rot_string].join('\n');
};


// Init functions 
init_world();
initEventHandlers();

start_mainLoop(display_player_stats);