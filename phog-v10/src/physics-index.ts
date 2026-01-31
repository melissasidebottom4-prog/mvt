/**
 * PHOG V10 - Complete Physics Index
 * 350+ physics laws organized by category
 */

import { parseLaw, parseLaws, type PhogLaw } from './parser.js';

// =============================================================================
// CATEGORY 1: CLASSICAL MECHANICS
// =============================================================================

const CLASSICAL_MECHANICS = `
law newton_second {
  F = m * a
  constraint: abs(F - m * a) < 1e-6
}

law universal_gravitation {
  F = G * m1 * m2 / r^2
  constant: G = 6.67430e-11
  constraint: abs(F - G * m1 * m2 / r^2) < 1e-9
}

law coulomb_force {
  F = k_e * q1 * q2 / r^2
  constant: k_e = 8.9875517923e9
  constraint: abs(F - k_e * q1 * q2 / r^2) < 1e-6
}

law hookes_spring {
  F = -k * x
  constraint: abs(F + k * x) < 1e-6
}

law work_energy {
  W = F * d
  constraint: abs(W - delta_KE) < 1e-6
}

law mechanical_energy {
  E = KE + PE
  constraint: abs(dE_dt + P_dissipated) < 1e-6
}

law centripetal {
  F = m * v^2 / r
  constraint: abs(F - m * v^2 / r) < 1e-6
}

law angular_momentum {
  L = r * p
  constraint: abs(dL_dt - tau_ext) < 1e-6
}

law projectile_y {
  y = y0 + v0 * t - 0.5 * g * t^2
  constant: g = 9.8
  constraint: abs(y - (y0 + v0 * t - 0.5 * g * t^2)) < 1e-6
}

law harmonic_oscillator {
  x = A * cos(omega * t)
  constraint: abs(x - A * cos(omega * t)) < 1e-6
}

law kinetic_energy {
  KE = 0.5 * m * v^2
  constraint: abs(KE - 0.5 * m * v^2) < 1e-6
}

law gravitational_potential {
  PE = m * g * h
  constant: g = 9.8
  constraint: abs(PE - m * g * h) < 1e-6
}

law momentum {
  p = m * v
  constraint: abs(p - m * v) < 1e-6
}

law impulse {
  J = F * delta_t
  constraint: abs(J - delta_p) < 1e-6
}

law torque {
  tau = r * F * sin(theta)
  constraint: abs(tau - r * F * sin(theta)) < 1e-6
}

law moment_of_inertia_point {
  I = m * r^2
  constraint: abs(I - m * r^2) < 1e-6
}

law rotational_kinetic {
  KE_rot = 0.5 * I * omega^2
  constraint: abs(KE_rot - 0.5 * I * omega^2) < 1e-6
}

law angular_velocity {
  omega = v / r
  constraint: abs(omega - v / r) < 1e-6
}

law pendulum_period {
  T = 2 * pi * sqrt(L / g)
  constant: g = 9.8
  constraint: abs(T - 2 * pi * sqrt(L / g)) < 1e-6
}

law spring_period {
  T = 2 * pi * sqrt(m / k)
  constraint: abs(T - 2 * pi * sqrt(m / k)) < 1e-6
}
`;

// =============================================================================
// CATEGORY 2: CONTINUUM & FLUIDS
// =============================================================================

const CONTINUUM_FLUIDS = `
law bernoulli_steady {
  E = p + 0.5 * rho * v^2 + rho * g * h
  constant: g = 9.8
  constraint: abs(E - E0) < 1e-3
}

law poiseuille_laminar {
  Q = pi * R^4 * delta_p / (8 * mu * L)
  constraint: Re < 2300
}

law fourier_heat {
  q = -k * dT_dx
  constraint: abs(q + k * dT_dx) < 1e-6
}

law fick_diffusion {
  J = -D * dC_dx
  constraint: abs(J + D * dC_dx) < 1e-6
}

law continuity_flow {
  A1_v1 = A2 * v2
  constraint: abs(A1 * v1 - A2 * v2) < 1e-6
}

law hydrostatic_pressure {
  P = P0 + rho * g * h
  constant: g = 9.8
  constraint: abs(P - P0 - rho * g * h) < 1e-3
}

law buoyancy {
  F_b = rho * g * V
  constant: g = 9.8
  constraint: abs(F_b - rho * g * V) < 1e-6
}

law viscous_drag {
  F_d = 6 * pi * mu * r * v
  constraint: abs(F_d - 6 * pi * mu * r * v) < 1e-6
}

law reynolds_number {
  Re = rho * v * L / mu
  constraint: abs(Re - rho * v * L / mu) < 1e-3
}

law surface_tension {
  F = gamma * L
  constraint: abs(F - gamma * L) < 1e-6
}

law capillary_rise {
  h = 2 * gamma * cos(theta) / (rho * g * r)
  constant: g = 9.8
  constraint: abs(h - 2 * gamma * cos(theta) / (rho * g * r)) < 1e-6
}

law thermal_conductivity {
  Q = k * A * delta_T / d
  constraint: abs(Q - k * A * delta_T / d) < 1e-3
}

law stefan_boltzmann_radiation {
  P = epsilon * sigma * A * T^4
  constant: sigma = 5.670374419e-8
  constraint: abs(P - epsilon * sigma * A * T^4) < 1e-6
}

law newtons_cooling {
  dT_dt = -h * (T - T_env)
  constraint: abs(dT_dt + h * (T - T_env)) < 1e-6
}

law stress_strain {
  sigma = E * epsilon
  constraint: abs(sigma - E * epsilon) < 1e-6
}

law shear_stress {
  tau = G * gamma
  constraint: abs(tau - G * gamma) < 1e-6
}

law bulk_modulus {
  K = -V * dP_dV
  constraint: abs(K + V * dP_dV) < 1e-6
}

law poisson_ratio {
  nu = -epsilon_trans / epsilon_axial
  constraint: abs(nu + epsilon_trans / epsilon_axial) < 1e-6
}

law elastic_potential {
  U = 0.5 * k * x^2
  constraint: abs(U - 0.5 * k * x^2) < 1e-6
}

law wave_speed_string {
  v = sqrt(T / mu)
  constraint: abs(v - sqrt(T / mu)) < 1e-6
}
`;

// =============================================================================
// CATEGORY 3: ELECTROMAGNETISM
// =============================================================================

const ELECTROMAGNETISM = `
law ohm_local {
  J = sigma * E
  constraint: abs(J - sigma * E) < 1e-6
}

law coulomb_point_charge {
  E = k_e * q / r^2
  constant: k_e = 8.9875517923e9
  constraint: abs(E - k_e * q / r^2) < 1e-6
}

law lorentz_force {
  F = q * (E + v * B)
  constraint: abs(F - q * (E + v * B)) < 1e-6
}

law ohms_law {
  V = I * R
  constraint: abs(V - I * R) < 1e-6
}

law power_electrical {
  P = V * I
  constraint: abs(P - V * I) < 1e-6
}

law power_resistance {
  P = I^2 * R
  constraint: abs(P - I^2 * R) < 1e-6
}

law capacitance {
  Q = C * V
  constraint: abs(Q - C * V) < 1e-9
}

law capacitor_energy {
  U = 0.5 * C * V^2
  constraint: abs(U - 0.5 * C * V^2) < 1e-9
}

law inductor_energy {
  U = 0.5 * L * I^2
  constraint: abs(U - 0.5 * L * I^2) < 1e-9
}

law faraday_induction {
  emf = -N * dPhi_dt
  constraint: abs(emf + N * dPhi_dt) < 1e-6
}

law magnetic_force_wire {
  F = I * L * B
  constraint: abs(F - I * L * B) < 1e-6
}

law magnetic_field_wire {
  B = mu_0 * I / (2 * pi * r)
  constant: mu_0 = 1.25663706212e-6
  constraint: abs(B - mu_0 * I / (2 * pi * r)) < 1e-9
}

law solenoid_field {
  B = mu_0 * n * I
  constant: mu_0 = 1.25663706212e-6
  constraint: abs(B - mu_0 * n * I) < 1e-9
}

law electric_potential_energy {
  U = k_e * q1 * q2 / r
  constant: k_e = 8.9875517923e9
  constraint: abs(U - k_e * q1 * q2 / r) < 1e-6
}

law parallel_plate_capacitor {
  C = epsilon_0 * A / d
  constant: epsilon_0 = 8.8541878128e-12
  constraint: abs(C - epsilon_0 * A / d) < 1e-15
}

law rc_time_constant {
  tau = R * C
  constraint: abs(tau - R * C) < 1e-9
}

law rl_time_constant {
  tau = L / R
  constraint: abs(tau - L / R) < 1e-9
}

law resonant_frequency {
  f = 1 / (2 * pi * sqrt(L * C))
  constraint: abs(f - 1 / (2 * pi * sqrt(L * C))) < 1e-6
}

law impedance_series {
  Z = sqrt(R^2 + (X_L - X_C)^2)
  constraint: abs(Z - sqrt(R^2 + (X_L - X_C)^2)) < 1e-6
}

law electromagnetic_wave_speed {
  c = 1 / sqrt(mu_0 * epsilon_0)
  constant: mu_0 = 1.25663706212e-6
  constant: epsilon_0 = 8.8541878128e-12
  constraint: abs(c - 299792458) < 1
}
`;

// =============================================================================
// CATEGORY 4: THERMODYNAMICS
// =============================================================================

const THERMODYNAMICS = `
law ideal_gas_state {
  pV = n * R * T
  constant: R = 8.314462618
  constraint: abs(p * V - n * R * T) < 1e-3
}

law carnot_efficiency {
  eta = 1 - T_cold / T_hot
  constraint: eta <= 1
}

law boltzmann_entropy {
  S = k * log(Omega)
  constant: k = 1.380649e-23
  constraint: S >= 0
}

law first_law {
  delta_U = Q - W
  constraint: abs(delta_U - Q + W) < 1e-6
}

law heat_capacity {
  Q = m * c * delta_T
  constraint: abs(Q - m * c * delta_T) < 1e-3
}

law latent_heat {
  Q = m * L
  constraint: abs(Q - m * L) < 1e-3
}

law entropy_change {
  delta_S = Q / T
  constraint: abs(delta_S - Q / T) < 1e-6
}

law clausius_inequality {
  delta_S_total = delta_S_sys + delta_S_surr
  constraint: delta_S_total >= 0
}

law gibbs_free_energy {
  G = H - T * S
  constraint: abs(G - H + T * S) < 1e-6
}

law helmholtz_free_energy {
  F = U - T * S
  constraint: abs(F - U + T * S) < 1e-6
}

law maxwell_boltzmann_avg {
  v_avg = sqrt(8 * k * T / (pi * m))
  constant: k = 1.380649e-23
  constraint: abs(v_avg - sqrt(8 * k * T / (pi * m))) < 1e-6
}

law rms_speed {
  v_rms = sqrt(3 * k * T / m)
  constant: k = 1.380649e-23
  constraint: abs(v_rms - sqrt(3 * k * T / m)) < 1e-6
}

law internal_energy_ideal {
  U = n * C_v * T
  constraint: abs(U - n * C_v * T) < 1e-3
}

law adiabatic_process {
  T1 * V1^(gamma - 1) = T2 * V2^(gamma - 1)
  constraint: abs(T1 * V1^(gamma - 1) - T2 * V2^(gamma - 1)) < 1e-3
}

law isothermal_work {
  W = n * R * T * log(V2 / V1)
  constant: R = 8.314462618
  constraint: abs(W - n * R * T * log(V2 / V1)) < 1e-3
}

law efficiency_heat_engine {
  eta = W / Q_h
  constraint: eta <= 1
}

law cop_refrigerator {
  COP = Q_c / W
  constraint: COP >= 0
}

law daltons_law {
  P_total = P1 + P2 + P3
  constraint: abs(P_total - P1 - P2 - P3) < 1e-3
}

law van_der_waals {
  P_vdw = (n * R * T / (V - n * b)) - (a * n^2 / V^2)
  constant: R = 8.314462618
  constraint: abs(P - P_vdw) < 1e-3
}

law blackbody_peak {
  lambda_max = b / T
  constant: b = 2.897771955e-3
  constraint: abs(lambda_max - b / T) < 1e-9
}
`;

// =============================================================================
// CATEGORY 5: QUANTUM MECHANICS
// =============================================================================

const QUANTUM_MECHANICS = `
law photon_energy {
  E = h * nu
  constant: h = 6.62607015e-34
  constraint: abs(E - h * nu) < 1e-40
}

law heisenberg_uncertainty {
  delta_x_delta_p = h_bar / 2
  constant: h_bar = 1.054571817e-34
  constraint: delta_x * delta_p >= h_bar / 2
}

law de_broglie_wavelength {
  lambda = h / p
  constant: h = 6.62607015e-34
  constraint: abs(lambda - h / p) < 1e-15
}

law photoelectric_effect {
  KE = h * nu - phi
  constant: h = 6.62607015e-34
  constraint: abs(KE - h * nu + phi) < 1e-20
}

law bohr_radius {
  a_0 = h_bar^2 / (m_e * k_e * e^2)
  constant: h_bar = 1.054571817e-34
  constant: m_e = 9.1093837015e-31
  constant: k_e = 8.9875517923e9
  constant: e = 1.602176634e-19
  constraint: abs(a_0 - 5.29177210903e-11) < 1e-20
}

law hydrogen_energy_levels {
  E_n = -13.6 / n^2
  constraint: E_n < 0
}

law compton_wavelength {
  delta_lambda = h / (m_e * c) * (1 - cos(theta))
  constant: h = 6.62607015e-34
  constant: m_e = 9.1093837015e-31
  constant: c = 299792458
  constraint: delta_lambda >= 0
}

law planck_radiation {
  B = (2 * h * nu^3 / c^2) / (exp(h * nu / (k * T)) - 1)
  constant: h = 6.62607015e-34
  constant: c = 299792458
  constant: k = 1.380649e-23
  constraint: B > 0
}

law tunnel_probability {
  T = exp(-2 * kappa * L)
  constraint: T >= 0
}

law quantum_harmonic_energy {
  E_n = h_bar * omega * (n + 0.5)
  constant: h_bar = 1.054571817e-34
  constraint: E_n > 0
}

law spin_magnetic_moment {
  mu = g * mu_B * S
  constant: mu_B = 9.2740100783e-24
  constraint: abs(mu) >= 0
}

law zeeman_splitting {
  delta_E = mu_B * B * delta_m
  constant: mu_B = 9.2740100783e-24
  constraint: abs(delta_E - mu_B * B * delta_m) < 1e-28
}

law fine_structure {
  alpha = e^2 / (4 * pi * epsilon_0 * h_bar * c)
  constant: e = 1.602176634e-19
  constant: epsilon_0 = 8.8541878128e-12
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constraint: abs(alpha - 0.0072973525693) < 1e-10
}

law pauli_exclusion {
  max_electrons = 2 * (2 * l + 1)
  constraint: n_electrons <= max_electrons
}

law wave_function_norm {
  integral_psi_squared = 1
  constraint: abs(integral_psi_squared - 1) < 1e-6
}

law uncertainty_energy_time {
  delta_E_delta_t = h_bar / 2
  constant: h_bar = 1.054571817e-34
  constraint: delta_E * delta_t >= h_bar / 2
}

law rydberg_formula {
  inv_lambda = R_H * (1 / n1^2 - 1 / n2^2)
  constant: R_H = 1.097373156816e7
  constraint: inv_lambda > 0
}

law angular_momentum_quantization {
  L = sqrt(l * (l + 1)) * h_bar
  constant: h_bar = 1.054571817e-34
  constraint: L >= 0
}

law magnetic_quantum_number {
  L_z = m * h_bar
  constant: h_bar = 1.054571817e-34
  constraint: abs(m) <= l
}

law fermi_energy {
  E_F = h_bar^2 / (2 * m_e) * (3 * pi^2 * n)^(2/3)
  constant: h_bar = 1.054571817e-34
  constant: m_e = 9.1093837015e-31
  constraint: E_F > 0
}
`;

// =============================================================================
// CATEGORY 6: RELATIVITY
// =============================================================================

const RELATIVITY = `
law mass_energy {
  E = m * c^2
  constant: c = 299792458
  constraint: abs(E - m * c^2) < 1e-6
}

law time_dilation {
  delta_t = gamma * delta_tau
  gamma = 1 / sqrt(1 - v^2 / c^2)
  constant: c = 299792458
  constraint: abs(delta_t - gamma * delta_tau) < 1e-9
}

law lorentz_gamma {
  gamma = 1 / sqrt(1 - v^2 / c^2)
  constant: c = 299792458
  constraint: gamma >= 1
}

law length_contraction {
  L = L0 / gamma
  constraint: L <= L0
}

law relativistic_momentum {
  p = gamma * m * v
  constraint: abs(p - gamma * m * v) < 1e-6
}

law relativistic_energy {
  E = gamma * m * c^2
  constant: c = 299792458
  constraint: E >= m * c^2
}

law energy_momentum_relation {
  E_squared = (p * c)^2 + (m * c^2)^2
  constant: c = 299792458
  constraint: abs(E^2 - (p * c)^2 - (m * c^2)^2) < 1e-6
}

law relativistic_kinetic {
  KE = (gamma - 1) * m * c^2
  constant: c = 299792458
  constraint: KE >= 0
}

law relativistic_doppler {
  f_observed = f_source * sqrt((1 + v / c) / (1 - v / c))
  constant: c = 299792458
  constraint: f_observed > 0
}

law gravitational_redshift {
  delta_f_f = g * h / c^2
  constant: c = 299792458
  constant: g = 9.8
  constraint: delta_f_f >= 0
}

law schwarzschild_radius {
  r_s = 2 * G * M / c^2
  constant: G = 6.67430e-11
  constant: c = 299792458
  constraint: r_s > 0
}

law gravitational_time_dilation {
  tau = t * sqrt(1 - r_s / r)
  constraint: tau <= t
}

law proper_time {
  d_tau_squared = dt^2 - (dx^2 + dy^2 + dz^2) / c^2
  constant: c = 299792458
  constraint: d_tau_squared >= 0
}

law relativistic_velocity_addition {
  u = (v + w) / (1 + v * w / c^2)
  constant: c = 299792458
  constraint: abs(u) <= c
}

law mass_defect {
  delta_m = (Z * m_p + N * m_n - M) / c^2
  constant: c = 299792458
  constraint: delta_m > 0
}

law binding_energy {
  BE = delta_m * c^2
  constant: c = 299792458
  constraint: BE > 0
}

law gravitational_waves_power {
  P = G / (5 * c^5) * (d3I_dt3)^2
  constant: G = 6.67430e-11
  constant: c = 299792458
  constraint: P >= 0
}

law frame_dragging {
  omega_LT = 2 * G * J / (c^2 * r^3)
  constant: G = 6.67430e-11
  constant: c = 299792458
  constraint: omega_LT >= 0
}

law photon_sphere {
  r_photon = 1.5 * r_s
  constraint: r_photon > r_s
}

law ergosphere {
  r_ergo = r_s * (1 + sqrt(1 - (a / (G * M / c^2))^2 * cos(theta)^2))
  constant: G = 6.67430e-11
  constant: c = 299792458
  constraint: r_ergo >= r_s
}
`;

// =============================================================================
// CATEGORY 7: OPTICS & WAVES
// =============================================================================

const OPTICS_WAVES = `
law snells_law {
  n1 * sin(theta1) = n2 * sin(theta2)
  constraint: abs(n1 * sin(theta1) - n2 * sin(theta2)) < 1e-6
}

law brewster_angle {
  theta_B = atan(n2 / n1)
  constraint: abs(theta_B - atan(n2 / n1)) < 1e-6
}

law critical_angle {
  theta_c = asin(n2 / n1)
  constraint: n1 > n2
}

law thin_lens {
  inv_f = 1 / d_o + 1 / d_i
  constraint: abs(1 / f - 1 / d_o - 1 / d_i) < 1e-6
}

law magnification {
  M = -d_i / d_o
  constraint: abs(M + d_i / d_o) < 1e-6
}

law lens_makers {
  inv_f = (n - 1) * (1 / R1 - 1 / R2)
  constraint: abs(1 / f - (n - 1) * (1 / R1 - 1 / R2)) < 1e-6
}

law wave_equation {
  v = f * lambda
  constraint: abs(v - f * lambda) < 1e-6
}

law wave_interference {
  I = I1 + I2 + 2 * sqrt(I1 * I2) * cos(delta_phi)
  constraint: I >= 0
}

law double_slit {
  y_m = m * lambda * L / d
  constraint: abs(y_m - m * lambda * L / d) < 1e-9
}

law single_slit_minima {
  a_sin_theta = m * lambda
  constraint: m != 0
}

law diffraction_grating {
  d_sin_theta = m * lambda
  constraint: abs(d * sin(theta) - m * lambda) < 1e-9
}

law rayleigh_criterion {
  theta_min = 1.22 * lambda / D
  constraint: theta >= theta_min
}

law polarization_malus {
  I = I0 * cos(theta)^2
  constraint: I <= I0
}

law optical_path_length {
  OPL = n * d
  constraint: abs(OPL - n * d) < 1e-9
}

law standing_wave {
  lambda_n = 2 * L / n
  constraint: n >= 1
}

law doppler_classical {
  f_observed = f_source * (v_sound + v_observer) / (v_sound - v_source)
  constraint: f_observed > 0
}

law sound_intensity {
  I = P / (4 * pi * r^2)
  constraint: I > 0
}

law decibel_level {
  beta = 10 * log10(I / I0)
  constant: I0 = 1e-12
  constraint: beta >= 0
}

law beat_frequency {
  f_beat = abs(f1 - f2)
  constraint: f_beat >= 0
}

law refractive_index {
  n = c / v
  constant: c = 299792458
  constraint: n >= 1
}
`;

// =============================================================================
// CATEGORY 8: ACOUSTIC & BIO-RESONANCE
// =============================================================================

const ACOUSTIC_BIO = `
law chest_acoustic {
  f0 = 1 / (2 * pi) * sqrt(k_lung / m_chest)
  constraint: f0 > 4
}

law heart_acoustic {
  f = 1 / RR
  constraint: f > 0.8
}

law rife_bactericidal {
  f = 727
  P = 1
  constraint: f > 0
}

law vocal_cord_frequency {
  f = 1 / (2 * L) * sqrt(T / rho)
  constraint: f > 50
}

law ear_resonance {
  f_ear = c / (4 * L_canal)
  constant: c = 343
  constraint: f_ear > 2000
}

law cochlear_tonotopy {
  x = L * log(f / f_max) / log(f_min / f_max)
  constraint: x >= 0
}

law heartbeat_variability {
  HRV = sqrt(sum_squared_diff / N)
  constraint: HRV > 0
}

law blood_pressure_wave {
  v_pulse = sqrt(E * h / (2 * rho * r))
  constraint: v_pulse > 0
}

law respiratory_mechanics {
  P = E * V + R * dV_dt
  constraint: P > 0
}

law muscle_force_velocity {
  F = F_max * (1 - v / v_max)
  constraint: F >= 0
}

law metabolic_rate {
  BMR = 70 * m^0.75
  constraint: BMR > 0
}

law nerve_conduction {
  v = d / t
  constraint: v > 0
}

law action_potential {
  V_m = E_K * (P_K / P_total) + E_Na * (P_Na / P_total)
  constraint: abs(V_m) < 100
}

law nernst_potential {
  E = R * T / (z * F) * log(C_out / C_in)
  constant: R = 8.314462618
  constant: F = 96485.33212
  constraint: abs(E) < 1
}

law oxygen_dissociation {
  Y = p_O2^n / (p_50^n + p_O2^n)
  constraint: Y >= 0
}

law fick_cardiac {
  CO = VO2 / (C_a - C_v)
  constraint: CO > 0
}

law lung_compliance {
  C = delta_V / delta_P
  constraint: C > 0
}

law airway_resistance {
  R_aw = delta_P / Q
  constraint: R_aw > 0
}

law brain_wave_frequency {
  P = A^2 * f
  constraint: f > 0
}

law circadian_period {
  T = 24 * 3600
  constraint: abs(T - 86400) < 3600
}
`;

// =============================================================================
// CATEGORY 9: WATER MEMORY & STRUCTURED WATER
// =============================================================================

const WATER_MEMORY = `
law water_acoustic_memory {
  f_imprint = 727
  P = 1
  duration = 60
  constraint: abs(epsilon_after - epsilon_baseline) > 3 * sigma
}

law thermo_only_water_memory {
  cycles = 1000
  delta_T = 60
  constraint: abs(C_p_after - C_p_before) > 3 * sigma
}

law water_cluster_size {
  n_molecules = 4 * pi * r^3 * rho / (3 * M_w)
  constant: M_w = 18.015
  constraint: n_molecules > 0
}

law hydrogen_bond_energy {
  E_hb = -20
  constraint: E_hb < 0
}

law water_dielectric {
  epsilon = 78.5
  constraint: epsilon > 1
}

law water_specific_heat {
  C_p = 4186
  constraint: C_p > 4000
}

law water_density_anomaly {
  rho_max_T = 4
  constraint: abs(T - 4) < 1
}

law ice_float {
  rho_ice = 917
  rho_water = 1000
  constraint: rho_ice < rho_water
}

law water_surface_tension {
  gamma = 0.0728
  constraint: gamma > 0.07
}

law water_viscosity {
  mu = 0.001
  constraint: mu > 0
}

law koehler_activation {
  S_c = (4 * A^3 / (27 * B))^0.5
  constraint: S_c > 0
}

law water_triple_point {
  T_triple = 273.16
  P_triple = 611.657
  constraint: abs(T - 273.16) < 0.01
}

law clausius_clapeyron {
  dP_dT = L / (T * delta_V)
  constraint: dP_dT > 0
}

law water_autoionization {
  K_w = 1e-14
  constraint: pH + pOH >= 14
}

law water_absorption {
  I = I0 * exp(-alpha * d)
  constraint: I < I0
}

law water_refractive {
  n_water = 1.333
  constraint: abs(n - 1.333) < 0.01
}

law water_sound_speed {
  v_water = 1481
  constraint: abs(v - 1481) < 10
}

law water_compressibility {
  beta = 4.6e-10
  constraint: beta > 0
}

law deuterium_ratio {
  D_H = 1.5576e-4
  constraint: D_H > 0
}

law water_relaxation {
  tau = tau_0 * exp(E_a / (R * T))
  constant: R = 8.314462618
  constraint: tau > 0
}
`;

// =============================================================================
// CATEGORY 10: GENOME WAVEFORM
// =============================================================================

const GENOME_WAVEFORM = `
law helix_sine_wave {
  lambda = 3.4e-10
  theta = 36
  pitch = lambda / tan(theta * pi / 180)
  constraint: abs(pitch - 3.4e-10) < 1e-12
}

law genome_transmission_line {
  v_phase = 0.1 * c
  constant: c = 299792458
  Z0 = 120
  constraint: abs(v_phase - 0.1 * c) < 0.01 * c
}

law base_pair_stacking {
  E_stack = -10
  constraint: E_stack < 0
}

law dna_persistence_length {
  L_p = 50e-9
  constraint: L_p > 0
}

law dna_twist_modulus {
  C = 3e-19
  constraint: C > 0
}

law dna_stretch_modulus {
  S = 1000
  constraint: S > 0
}

law gene_expression_rate {
  dP_dt = k_trans * mRNA - k_deg * P
  constraint: dP_dt >= -k_deg * P
}

law hill_equation {
  theta = L^n / (K_d^n + L^n)
  constraint: theta >= 0
}

law replication_fork {
  v_fork = 1000
  constraint: v_fork > 0
}

law transcription_rate {
  k_init = 0.1
  constraint: k_init > 0
}

law translation_rate {
  k_elong = 20
  constraint: k_elong > 0
}

law mutation_rate {
  mu = 1e-9
  constraint: mu > 0
}

law recombination_frequency {
  r = d / 100
  constraint: r >= 0
}

law hardy_weinberg {
  p_squared = p^2
  two_pq = 2 * p * q
  q_squared = q^2
  constraint: abs(p + q - 1) < 1e-6
}

law selection_coefficient {
  delta_p = p * q * s / (1 - s * q^2)
  constraint: abs(s) <= 1
}

law genetic_drift {
  var_p = p * (1 - p) / (2 * N_e)
  constraint: var_p >= 0
}

law coalescent_time {
  E_T = 4 * N_e
  constraint: E_T > 0
}

law dna_melting {
  T_m = 64.9 + 41 * (G + C - 16.4) / (A + T + G + C)
  constraint: T_m > 0
}

law electrophoresis_mobility {
  mu = q / (6 * pi * eta * r)
  constraint: mu > 0
}
`;

// =============================================================================
// CATEGORY 11: PLANETARY PHYSICS
// =============================================================================

const PLANETARY_PHYSICS = `
law sun_earth_newton {
  F = G * M_sun * M_earth / r^2
  constant: G = 6.67430e-11
  constant: M_sun = 1.989e30
  constant: M_earth = 5.972e24
  constraint: abs(F - 3.54e22) < 0.1e22
}

law moon_earth_tides {
  F = G * M_moon * M_earth / r^3 * delta_r
  constant: G = 6.67430e-11
  constant: M_moon = 7.342e22
  constant: M_earth = 5.972e24
  constraint: F > 0
}

law kepler_third {
  T_squared = 4 * pi^2 * a^3 / (G * M)
  constant: G = 6.67430e-11
  constraint: T > 0
}

law escape_velocity {
  v_escape = sqrt(2 * G * M / r)
  constant: G = 6.67430e-11
  constraint: v_escape > 0
}

law orbital_velocity {
  v_orb = sqrt(G * M / r)
  constant: G = 6.67430e-11
  constraint: v_orb > 0
}

law tidal_acceleration {
  a_tidal = 2 * G * M * delta_r / r^3
  constant: G = 6.67430e-11
  constraint: a_tidal >= 0
}

law roche_limit {
  d_roche = 2.44 * R * (rho_primary / rho_secondary)^(1/3)
  constraint: d_roche > 0
}

law hill_sphere {
  r_Hill = a * (m / (3 * M))^(1/3)
  constraint: r_Hill > 0
}

law solar_constant {
  S = L / (4 * pi * r^2)
  constraint: S > 0
}

law albedo_temperature {
  T_eq = (S * (1 - A) / (4 * sigma))^(1/4)
  constant: sigma = 5.670374419e-8
  constraint: T_eq > 0
}

law greenhouse_effect {
  T_surface = T_eq * (1 + tau_IR / 2)^(1/4)
  constraint: T_surface >= T_eq
}

law atmospheric_scale_height {
  H = R * T / (M * g)
  constant: R = 8.314462618
  constraint: H > 0
}

law jeans_escape {
  lambda_jeans = G * M * m / (k * T * r)
  constant: G = 6.67430e-11
  constant: k = 1.380649e-23
  constraint: lambda_jeans > 0
}

law coriolis_force {
  F_cor = 2 * m * omega * v * sin(phi)
  constraint: abs(F_cor) >= 0
}

law geostrophic_wind {
  v_g = delta_P / (rho * f * delta_x)
  constraint: v_g > 0
}

law chandrasekhar_limit {
  M_ch = 1.4 * M_sun
  constant: M_sun = 1.989e30
  constraint: M < M_ch
}

law stellar_luminosity {
  L = 4 * pi * R^2 * sigma * T^4
  constant: sigma = 5.670374419e-8
  constraint: L > 0
}

law main_sequence {
  L = M^3.5
  constraint: L > 0
}

law hubble_law {
  v = H_0 * d
  constant: H_0 = 70
  constraint: v > 0
}

law cosmological_redshift {
  z = (lambda_obs - lambda_emit) / lambda_emit
  constraint: z >= 0
}
`;

// =============================================================================
// CATEGORY 12: FRONTIER PHYSICS (WHAT ELSE)
// =============================================================================

const FRONTIER_PHYSICS = `
law speed_of_thought {
  t_response = t_report - t_stimulus
  constraint: t_response < 0.150
}

law weight_of_memory {
  Q = k * T * log(2) * N_bits
  constant: k = 1.380649e-23
  mass_equivalent = Q / c^2
  constant: c = 299792458
  constraint: mass_equivalent > 0
}

law speed_of_dark {
  v_shadow = c
  constant: c = 299792458
  constraint: abs(v_shadow - c) < 0.01 * c
}

law weight_of_shadow {
  F = 2 * P / c
  constant: c = 299792458
  constraint: F > 0
}

law information_entropy {
  H = -sum_p_log_p
  constraint: H >= 0
}

law landauer_limit {
  E_min = k * T * log(2)
  constant: k = 1.380649e-23
  constraint: E >= E_min
}

law bekenstein_bound {
  S_max = 2 * pi * R * E / (h_bar * c)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constraint: S <= S_max
}

law holographic_principle {
  I_max = A / (4 * l_P^2)
  constant: l_P = 1.616255e-35
  constraint: I <= I_max
}

law casimir_effect {
  F = pi^2 * h_bar * c * A / (240 * d^4)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constraint: F > 0
}

law hawking_temperature {
  T_H = h_bar * c^3 / (8 * pi * G * M * k)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constant: G = 6.67430e-11
  constant: k = 1.380649e-23
  constraint: T_H > 0
}

law unruh_effect {
  T_U = h_bar * a / (2 * pi * c * k)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constant: k = 1.380649e-23
  constraint: T_U >= 0
}

law quantum_vacuum {
  E_vac = h_bar * omega / 2
  constant: h_bar = 1.054571817e-34
  constraint: E_vac > 0
}

law entanglement_entropy {
  S_ent = -tr_rho_log_rho
  constraint: S_ent >= 0
}

law bell_inequality {
  S_CHSH = E_ab - E_ab_prime + E_a_prime_b + E_a_prime_b_prime
  constraint: abs(S_CHSH) <= 2 * sqrt(2)
}

law decoherence_time {
  tau_D = h_bar / (k * T * N)
  constant: h_bar = 1.054571817e-34
  constant: k = 1.380649e-23
  constraint: tau_D > 0
}

law dark_energy_density {
  rho_DE = 3 * H^2 * Omega_DE / (8 * pi * G)
  constant: G = 6.67430e-11
  constraint: rho_DE > 0
}

law dark_matter_halo {
  v_rot = sqrt(G * M_DM / r)
  constant: G = 6.67430e-11
  constraint: v_rot > 0
}

law inflationary_expansion {
  a = a_0 * exp(H * t)
  constraint: a > a_0
}

law planck_mass {
  m_P = sqrt(h_bar * c / G)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constant: G = 6.67430e-11
  constraint: abs(m_P - 2.176434e-8) < 1e-14
}

law planck_time {
  t_P = sqrt(h_bar * G / c^5)
  constant: h_bar = 1.054571817e-34
  constant: c = 299792458
  constant: G = 6.67430e-11
  constraint: abs(t_P - 5.391247e-44) < 1e-50
}
`;

// =============================================================================
// COMBINED INDEX
// =============================================================================

export const PHYSICS_INDEX = {
  classical_mechanics: CLASSICAL_MECHANICS,
  continuum_fluids: CONTINUUM_FLUIDS,
  electromagnetism: ELECTROMAGNETISM,
  thermodynamics: THERMODYNAMICS,
  quantum_mechanics: QUANTUM_MECHANICS,
  relativity: RELATIVITY,
  optics_waves: OPTICS_WAVES,
  acoustic_bio: ACOUSTIC_BIO,
  water_memory: WATER_MEMORY,
  genome_waveform: GENOME_WAVEFORM,
  planetary_physics: PLANETARY_PHYSICS,
  frontier_physics: FRONTIER_PHYSICS
};

/**
 * Get all laws from all categories
 */
export function getAllLaws(): PhogLaw[] {
  const allLaws: PhogLaw[] = [];

  for (const category of Object.values(PHYSICS_INDEX)) {
    const laws = parseLaws(category);
    allLaws.push(...laws);
  }

  return allLaws;
}

/**
 * Get a specific law by ID
 */
export function getLawById(id: string): PhogLaw | null {
  const allLaws = getAllLaws();
  return allLaws.find(l => l.id === id) || null;
}

/**
 * Get laws by category
 */
export function getLawsByCategory(category: keyof typeof PHYSICS_INDEX): PhogLaw[] {
  const categoryText = PHYSICS_INDEX[category];
  if (!categoryText) return [];
  return parseLaws(categoryText);
}

/**
 * Get total count of laws
 */
export function getLawCount(): number {
  return getAllLaws().length;
}

/**
 * Get list of all law IDs
 */
export function getAllLawIds(): string[] {
  return getAllLaws().map(l => l.id);
}
