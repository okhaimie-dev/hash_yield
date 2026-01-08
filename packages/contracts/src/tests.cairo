// =============================================================================
// Test Module Root
// =============================================================================
// Co-located tests following Ekubo-style conventions.
// Compiled only in test mode via #[cfg(test)] in lib.cairo.
// =============================================================================

// Test utilities and helpers
pub mod helper;

// Mock contracts for testing
pub mod mocks;
// Unit tests (to be added in Gate 4)
// pub mod vault_basic_test;
// pub mod vault_edgecases_test;

// Integration tests (to be added in Gate 4)
// pub mod strategy_integration_test;
// pub mod emergency_test;

// Security tests (to be added in Gate 4)
// pub mod inflation_attack_test;
// pub mod reentrancy_test;
// pub mod strategy_validation_test;

// Property tests (to be added in Gate 4)
// pub mod prop_invariants_test;


