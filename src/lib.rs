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
mod parser;
mod dec2sign;

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
	use pwasm_std::{String, Vec};
	use pwasm_abi_derive::eth_abi;
	use parser;
	use dec2sign;

	fn holder_key() -> H256 {
		H256::from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn counter_party_key() -> H256 {
		H256::from([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn transfer_dest() -> H256 { // 0 = holder, 1 = counter-party
		H256::from([2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn amount_to_transfer() -> H256 {
		H256::from([3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	#[eth_abi(SmartContractEndpoint, SmartContractClient)]
	pub trait SmartContract {
		/// The constructor
		fn constructor(&mut self, recipient_address: Address, input_string_vector: Vec<i64>);
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
		#[constant]
		fn printLn(&mut self, input: U256) -> U256;
		#[payable]
		fn depositCollateral(&mut self, amount: U256);
		/// Event declaration
		#[event]
		fn SmartContract(&mut self, indexed_from: Address, _value: U256);
		#[event]
        fn Transfer(&mut self, indexed_from: Address, indexed_to: Address, _value: U256);
	}

	pub struct SmartContractInstance;

	impl SmartContract for SmartContractInstance {
		fn constructor(&mut self, counter_party_address: Address, input_string_vector: Vec<i64>) {
			write(&holder_key(), &H256::from(sender().clone()).into());
			write(&counter_party_key(), &H256::from(counter_party_address).into());

			// Parsing done here
			let str: String = dec2sign::convert(input_string_vector);

			// getting output array:
			// - index 0 stores whether standard or give transfer
			// - index 1 stores amount to transfer
			let output_arr = parser::parse(str);
			write(&transfer_dest(), &U256::from(output_arr[0]).into());
			write(&amount_to_transfer(), &U256::from(output_arr[1]).into());
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
            if amount == 0.into() || senderBalance < amount || to == from {
            } else {
                let new_sender_balance = senderBalance - amount;
                let new_recipient_balance = recipientBalance + amount;
                write(&balance_key(&from), &new_sender_balance.into());
                write(&balance_key(&to), &new_recipient_balance.into());
                self.Transfer(from, to, amount);
            }
        }

		fn printLn(&mut self, input: U256) -> U256 {
			input
		}

		fn depositCollateral(&mut self, amount: U256) {
			let sender = sender();
			let sender_balance = read_balance(&sender);
            let new_sender_balance = sender_balance + amount;
			write(&balance_key(&sender), &new_sender_balance.into());
			// check the input to make the transfer

			let curr_transfer_dest: U256 = read(&transfer_dest()).into();
			let curr_amount_to_transfer: U256 = read(&amount_to_transfer()).into();

			if curr_transfer_dest == 0.into() {
				self.transfer(address_of(&counter_party_key()), address_of(&holder_key()), curr_amount_to_transfer);
			} else if curr_transfer_dest == 1.into() {
				self.transfer(address_of(&holder_key()), address_of(&counter_party_key()), curr_amount_to_transfer);
			}
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
