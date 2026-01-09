// Auto-generated from hash_yield_LendingStrategyV0.contract_class.json
// Do not edit manually - run 'bun run sync:abis' to regenerate

export const strategyAbi = [
  {
    "type": "impl",
    "name": "StrategyImpl",
    "interface_name": "hash_yield::interfaces::strategy::IStrategy"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "interface",
    "name": "hash_yield::interfaces::strategy::IStrategy",
    "items": [
      {
        "type": "function",
        "name": "asset",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "total_assets",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "deposit",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw_all",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "harvest",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::integer::u256, core::integer::u256)"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "emergency_withdraw",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "StrategyViewImpl",
    "interface_name": "hash_yield::strategies::lending_strategy_v0::ILendingStrategyV0View"
  },
  {
    "type": "interface",
    "name": "hash_yield::strategies::lending_strategy_v0::ILendingStrategyV0View",
    "items": [
      {
        "type": "function",
        "name": "vault",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "v_token",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "last_reported_assets",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "v_token_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "asset_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "v_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "vault_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "owner_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Deposited",
    "kind": "struct",
    "members": [
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "v_token_shares",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Withdrawn",
    "kind": "struct",
    "members": [
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "v_token_shares",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Harvested",
    "kind": "struct",
    "members": [
      {
        "name": "profit",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "loss",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "total_assets",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::EmergencyWithdrawn",
    "kind": "struct",
    "members": [
      {
        "name": "amount_recovered",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "Deposited",
        "type": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Deposited",
        "kind": "nested"
      },
      {
        "name": "Withdrawn",
        "type": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Withdrawn",
        "kind": "nested"
      },
      {
        "name": "Harvested",
        "type": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::Harvested",
        "kind": "nested"
      },
      {
        "name": "EmergencyWithdrawn",
        "type": "hash_yield::strategies::lending_strategy_v0::LendingStrategyV0::EmergencyWithdrawn",
        "kind": "nested"
      }
    ]
  }
] as const;

export type StrategyAbiType = typeof strategyAbi;
