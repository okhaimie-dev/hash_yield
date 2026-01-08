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

// Unit tests
pub mod vault_test;
pub mod strategy_test;

// Integration tests
pub mod integration_test;

// Security tests
pub mod security_test;
