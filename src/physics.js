import { Vector3 } from 'three';
import { get_terrain_type } from './map';
import { vector2String } from './utils';

const config_forces = {
  dt: 0.01,
  precision: 0.0001,
  collision_threshold: 0.005,
  speed_threshold: 0.07,
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SIMPLE PHYSICS ENGINE
// Each force will be represented by a function, which takes a scalar float as argument and returns a acceleration modifier

// The final acceleration will be the result of the player strength and 

const calc_air_resistance = (player_data) => {
    const air_resistance_factor = 0.9;
    const air_resistance = player_data.speed.clone().negate().multiplyScalar(air_resistance_factor);
    air_resistance.setY(0)

    return air_resistance;
  }
  
  const calc_gravity = () => {
    const gravity_constant = 10; // We don't need to be equal to acceleration at earth surface as we scale everything with the ball's mass.
  
    return new Vector3(0, -gravity_constant, 0);
  
  }
  
  // -=-=-=-=-=-=-=--=- MAIN FUNCTIONS -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  const basic_forces = [
      { f: calc_air_resistance, weight: 1},
      { f: calc_gravity, weight: 1 },
  ];

  // calc_acceleration: according to the current position, will compute basic forces and surface forces
  // and return a new acceleration
  const calc_acceleration = (player_data) => {
    const new_accel = new Vector3();
    // First, let's look at the force which the player is giving to the ball
    new_accel.copy(player_data.push);
    // Then, let's add all the basic forces
    for (const force of basic_forces) {
        new_accel.addScaledVector(force.f(player_data), force.weight);
    }

    return new_accel.multiplyScalar( 1 / player_data.mass);
  };

  // apply_collisions will compute and update player coordinates:
  //   - if no collisions (far away and not crossing), then return a basic computation
  //   - if touching the surface with negligible speed, will "stick" the player to the surface and 
  //      compute surface force
  //   - if the speed is not negligible and will traverse a surface, will update player data 
  //      so that it bounces off the surface, orthogonal to the surface direction
  //
  const apply_collisions = (player_data, new_acceleration, dt) => {
    
    if (player_data.position.y - player_data.radius <= config_forces.collision_threshold && 
        Math.abs(player_data.speed.y) < config_forces.speed_threshold &&
        get_terrain_type(player_data.position) > 0) {
          // the player is "resting" on the surface without speed, we apply surface forces
          const updated_acceleration = new_acceleration.clone();
          updated_acceleration.y = Math.max(0, new_acceleration.y);
          player_data.speed.y = 0;
          player_data.speed.addScaledVector(updated_acceleration, dt);
          player_data.position.addScaledVector(player_data.speed, dt);
          // DEBUG
          player_data.contact = true;
          return;
      }

    const bounce_dissipation_coeff = 0.8; 
    player_data.contact = false;

    // Computing the speed from the player's acceleration
    const new_speed = player_data.speed.clone().addScaledVector(new_acceleration, dt);
    const new_position = player_data.position.clone().addScaledVector(new_speed, config_forces.dt);
    
    // Case 2: Speed if big and we detect an impact
    if (new_speed.y < 0 && 
        player_data.position.y - player_data.radius >= 0 &&
        new_position.y  - player_data.radius < 0) {
        console.log(`Pot bounce! Pos:${vector2String(player_data.position)}, Spd: ${vector2String(new_speed)}},Pos2: ${vector2String(new_position)}`);
        // computing the (X, Z) of impact point
        const impact_dt = (player_data.radius - player_data.position.y) / new_speed.y;
        const impact_x = player_data.position.x + new_speed.x * impact_dt;
        const impact_z = player_data.position.z + new_speed.z * impact_dt;
        const impact_point = new Vector3(impact_x, 0, impact_z);
        const tile_type = get_terrain_type(impact_point);
        console.log(`Impact point:${vector2String(impact_point)}, tile type: ${tile_type}`); 

        if (tile_type > 0) {
          new_speed.setY( -new_speed.y * bounce_dissipation_coeff);
          // The new y will "bounce" as well on the "y=radius" line (i.e. take symetrical point)
          new_position.setY(2 * player_data.radius - new_position.y);
          console.log(`New vertical speed: ${new_speed.y}, new pos: ${vector2String(new_position)}`);
        }
    }

    player_data.position.copy(new_position);
    player_data.speed.copy(new_speed);

  };

  // ------------- MAIN FUNCTIONS 

  const update_player_data = (player_data) => {
   
    const updated_acceleration = calc_acceleration(player_data);

    // Computing the speed from the player's acceleration
    const new_speed = player_data.speed.clone();
    new_speed.addScaledVector(updated_acceleration, config_forces.dt)

    // Now that we have new speed, we have to detect and apply collisions to compute final speed
    // and final position
    apply_collisions(player_data, updated_acceleration, config_forces.dt);  
  };
  
  export { update_player_data };