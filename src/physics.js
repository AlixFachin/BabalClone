import { Vector3 } from 'three';

const config_forces = {
  dt: 0.01,
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SIMPLE PHYSICS ENGINE
// Each force will be represented by a function, which takes a scalar float as argument and returns a acceleration modifier

// The final acceleration will be the result of the player strength and 

const calc_air_resistance = (player_data) => {
    const air_resistance_factor = 0.2;
    
    return player_data.speed.clone().negate().multiplyScalar(air_resistance_factor);
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

  const get_surface_force = (player_data, total_basic_force) => {
    const collision_threshold = 0.01;

    if (Math.abs(player_data.position.y - player_data.radius) < collision_threshold && 
        total_basic_force.y < 0) {
        return new Vector3(0, -total_basic_force.y, 0);
    }

    // No collision - no surface force
    return new Vector3(0, 0, 0);
  };

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
    // We have the sum of all forces -> before making it the new acceleration, we have to apply the 
    // surface forces
    const surface_force = get_surface_force(player_data, new_accel);

    new_accel.add(surface_force);

    return new_accel.multiplyScalar( 1 / player_data.mass);
  };

  // ------------------------ COLLISION detection_range
  
  const get_new_position_speed_with_collisions = (player_position, sphere_radius, player_speed) => {
    // If the player is "close enough" to the ground, we allow the ball to "bounce" of the surface 
    const detection_range = 0.01;
    // bounce_dissipation_coeff will indicate how much energy is "lost" during the bounce
    const bounce_dissipation_coeff = 0.8; 
  
    const new_position = player_position.clone().addScaledVector(player_speed, config_forces.dt);
    const adjusted_speed = player_speed.clone();

    if ( player_position.y - sphere_radius > 0 &&
         player_position.y + (player_speed.y * config_forces.dt)  - sphere_radius <= detection_range) {
     
      console.log(`Collision detected! Position: ${player_position.y}, Speed: ${player_speed.y}, radius: ${sphere_radius}`);
      adjusted_speed.setY(  -player_speed.y * bounce_dissipation_coeff);
      console.log(`New vertical speed: ${adjusted_speed.y}`);
    }

    return {
        new_position: new_position,
        adjusted_speed: adjusted_speed,
    }
  
  };

  // ------------- MAIN FUNCTIONS 

  const update_player_data = (player_data) => {
   
    const updated_acceleration = calc_acceleration(player_data);

    // Computing the speed from the player's acceleration
    const new_speed = player_data.speed.clone();
    new_speed.addScaledVector(updated_acceleration, config_forces.dt)

    // Now that we have new speed, we have to detect and apply collisions to compute final speed
    // and final position
    const { new_position, adjusted_speed } = get_new_position_speed_with_collisions(player_data.position, player_data.radius, new_speed);

    player_data.position.copy(new_position);
    player_data.speed.copy(adjusted_speed);
  
  };
  
  export { update_player_data };