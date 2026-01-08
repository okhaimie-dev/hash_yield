use core::traits::TryInto;
use starknet::ContractAddress;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

pub fn default_owner() -> ContractAddress {
    12121212121212.try_into().unwrap()
}

pub fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

pub fn deploy_contract_with_calldata(name: ByteArray, calldata: @Array<felt252>) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(calldata).unwrap();
    contract_address
}

pub fn diff(x: u256, y: u256) -> (u256, bool) {
    if x < y {
        (y - x, true)
    } else {
        (x - y, false)
    }
}
