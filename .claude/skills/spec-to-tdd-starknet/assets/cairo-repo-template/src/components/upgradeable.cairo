use starknet::ClassHash;

#[starknet::interface]
pub trait IUpgradeable<TContractState> {
    fn replace_class_hash(ref self: TContractState, new_class_hash: ClassHash);
}

#[starknet::component]
pub mod Upgradeable {
    use starknet::syscalls::replace_class_syscall;
    use starknet::ClassHash;
    use super::IUpgradeable;

    #[storage]
    pub struct Storage {}

    #[derive(starknet::Event, Drop)]
    pub struct ClassHashReplaced {
        pub new_class_hash: ClassHash,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ClassHashReplaced: ClassHashReplaced,
    }

    #[embeddable_as(UpgradeableImpl)]
    pub impl Upgradeable<
        TContractState, +Drop<TContractState>, +HasComponent<TContractState>,
    > of IUpgradeable<ComponentState<TContractState>> {
        fn replace_class_hash(
            ref self: ComponentState<TContractState>, new_class_hash: ClassHash,
        ) {
            replace_class_syscall(new_class_hash).expect('REPLACE_CLASS_FAILED');
            self.emit(ClassHashReplaced { new_class_hash });
        }
    }
}
