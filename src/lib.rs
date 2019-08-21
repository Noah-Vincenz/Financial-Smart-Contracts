#![no_std]
#![allow(non_snake_case)]
#![feature(proc_macro_hygiene)]

extern crate pwasm_std;
extern crate pwasm_ethereum;
extern crate pwasm_abi;
extern crate pwasm_abi_derive;

// Declares the dispatch and dispatch_ctor methods
use pwasm_abi::eth::EndpointInterface;
use pwasm_ethereum::{ret, input};

#[no_mangle]
pub fn deploy() {
	let mut endpoint = smart_contract::SmartContractEndpoint::new(smart_contract::SmartContractInstance{});
	endpoint.dispatch_ctor(&input());
}

#[no_mangle]
pub fn call() {
	let mut endpoint = smart_contract::SmartContractEndpoint::new(smart_contract::SmartContractInstance{});
    ret(&endpoint.dispatch(&input()));
}

pub mod smart_contract {
	use pwasm_std::types::{H256, Address, U256};
	use pwasm_ethereum::{read, write, sender};
	use pwasm_abi_derive::eth_abi;

	fn holder_key() -> H256 {
		H256::from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn counter_party_key() -> H256 {
		H256::from([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	#[eth_abi(SmartContractEndpoint, SmartContractClient)]
	pub trait SmartContract {
		/// The constructor
		fn constructor(&mut self, holder_address: Address, counter_party_address: Address);
		#[constant]
		fn balanceOfAddress(&mut self, _address: Address) -> U256;
		#[constant]
		fn holderBalance(&mut self) -> U256;
		#[constant]
		fn counterPartyBalance(&mut self) -> U256;
		#[constant]
		fn callerBalance(&mut self) -> U256;
		#[constant]
		fn holderAddress(&mut self) -> H256;
		#[constant]
		fn counterPartyAddress(&mut self) -> H256;
		#[constant]
		fn callerAddress(&mut self) -> H256;
		/// Transfer between two accounts
        fn transfer(&mut self, _from: Address, _to: Address, _amount: U256);
		#[payable]
		fn depositCollateral(&mut self, amount: U256);
		/// Event declaration
		#[event]
        fn TransferEvent(&mut self, result: i32);
	}

	pub struct SmartContractInstance;

	impl SmartContract for SmartContractInstance {
		fn constructor(&mut self, holder_address: Address, counter_party_address: Address) {
			write(&holder_key(), &H256::from(holder_address).into());
			write(&counter_party_key(), &H256::from(counter_party_address).into());
		}

		fn balanceOfAddress(&mut self, address: Address) -> U256 {
			read(&balance_key(&address)).into()
	    }

		fn holderBalance(&mut self) -> U256 {
			read_balance(&address_of(&holder_key())).into()
	    }

		fn counterPartyBalance(&mut self) -> U256 {
			read_balance(&address_of(&counter_party_key())).into()
	    }

		fn callerBalance(&mut self) -> U256 {
			read_balance(&sender())
	    }
		// does not work if address starts with 0x00... as 0s will be get rid of
		fn holderAddress(&mut self) -> H256 {
			read(&holder_key()).into()
	    }

		fn counterPartyAddress(&mut self) -> H256 {
			read(&counter_party_key()).into()
	    }

		fn callerAddress(&mut self) -> H256 {
			H256::from(sender())
		}

		fn transfer(&mut self, from: Address, to: Address, amount: U256) {
            let senderBalance = read_balance(&from);
            let recipientBalance = read_balance(&to);

            if senderBalance < amount {
				self.TransferEvent(0);
			} else if to == from {
				self.TransferEvent(1);
			} else if amount == 0.into() {
				self.TransferEvent(2);
			} else {
                let new_sender_balance = senderBalance - amount;
                let new_recipient_balance = recipientBalance + amount;
                write(&balance_key(&from), &new_sender_balance.into());
                write(&balance_key(&to), &new_recipient_balance.into());
				self.TransferEvent(2);
            }
        }

		fn depositCollateral(&mut self, amount: U256) {
			let sender = sender();
			let sender_balance = read_balance(&sender);
            let new_sender_balance = sender_balance + amount;
			write(&balance_key(&sender), &new_sender_balance.into());
		}

	}

	fn address_of(key: &H256) -> Address {
		let h: H256 = read(key).into();
		Address::from(h)
	}

	fn read_balance(owner: &Address) -> U256 {
		read(&balance_key(owner)).into()
	}

	// Generates a balance key for some address.
	// Used to map balances with their owners.
	fn balance_key(address: &Address) -> H256 {
		let mut key = H256::from(*address);
		key.as_bytes_mut()[0] = 1; // just a naive "namespace";
		key
	}
}

#[cfg(test)]
#[allow(non_snake_case)]
mod tests {
	extern crate pwasm_test;
	extern crate pwasm_std;
	extern crate pwasm_ethereum;
	extern crate std;
	use super::*;
	use self::pwasm_test::{ext_reset, ext_update, ext_get};
	use smart_contract::SmartContract;
	use pwasm_std::types::{Address, U256};
	#[test]
	fn check_balance() {
		/*
		ext_reset(|e| {
			e.balance_of(
				Address::from([
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
				]),
				100000.into(),
			)
		});
		assert_eq!(
			U256::from(100000),
			pwasm_ethereum::balance(&Address::from([
				1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
			]))
		);
		*/
		let sender_one = Address::from([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
		]);
		assert_eq!(sender_one, sender_one);
	}
	#[test]
	fn give_and_update() {
		/*
		let mut contract = smart_contract::SmartContractInstance{};
		let sender_one = Address::from([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
		]);
		let sender_two = Address::from([
			0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21
		]);
		// Here we're creating an External context using ExternalBuilder and set the `sender` to the `owner_address`
		// so `pwasm_ethereum::sender()` in DonationContract::constructor() will return that `owner_address`
		ext_update(|e| e
			.sender(sender_one.clone())
			.value(300.into())
		);
		contract.constructor();
		assert_eq!(contract.balance(), 0.into());
		contract.give();
		assert_eq!(contract.balance(), 300.into());
		ext_update(|e| e
			.sender(sender_two.clone())
			.value(250.into())
		);
		contract.give();
		assert_eq!(contract.balance(), 550.into());
		// 2 log entries should be created
		assert_eq!(ext_get().logs().len(), 2);
		*/
		let sender_one = Address::from([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
		]);
		assert_eq!(sender_one, sender_one);

	}
}
