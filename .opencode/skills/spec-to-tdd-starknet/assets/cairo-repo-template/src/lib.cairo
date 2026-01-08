// Main contract modules (add as needed)
// pub mod core;

// Co-located tests (compile only in test mode)
#[cfg(test)]
pub(crate) mod tests;

// Reusable components
pub mod components {
    pub mod owned;
    pub mod upgradeable;
}

// Interface/trait definitions
pub mod interfaces {
    // pub mod core;
    pub mod erc20;
}

// Custom types and structs
pub mod types {
    // pub mod keys;
}
