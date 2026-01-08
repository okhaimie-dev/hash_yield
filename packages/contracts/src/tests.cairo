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
pub mod strategy_test;

// Unit tests
pub mod vault_test;
// Integration tests (placeholder - implement in Gate 4 part 2)
// pub mod integration_test;

// Security tests (placeholder - implement in Gate 4 part 2)
// pub mod security_test;


