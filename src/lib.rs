#![no_std]
#![allow(non_snake_case)]
#![feature(proc_macro_hygiene)]

extern crate pwasm_std;
extern crate pwasm_ethereum;
extern crate pwasm_abi;
extern crate pwasm_abi_derive;

// Declares the dispatch and dispatch_ctor methods
use pwasm_abi::eth::EndpointInterface;
use pwasm_ethereum::{ret, input, value};
//mod parser; // parse = parser.rs file
//use parser::parse();

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
	use pwasm_ethereum::{read, write, sender, value};
	use pwasm_std::{String, Vec};
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
		fn constructor(&mut self, recipient_address: Address);
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
        fn transfer(&mut self, _from: Address, _to: Address, _amount: U256) -> bool;
		#[constant]
		fn printLn(&mut self, input: U256) -> U256;
		#[payable]
		fn depositCollateral(&mut self, amount: U256);
		#[payable]
		fn val(&mut self) -> U256;
		/// Event declaration
		#[event]
		fn SmartContract(&mut self, indexed_from: Address, _value: U256);
		#[event]
        fn Transfer(&mut self, indexed_from: Address, indexed_to: Address, _value: U256);
	}

	pub struct SmartContractInstance;

	impl SmartContract for SmartContractInstance {
		fn constructor(&mut self, counter_party_address: Address) {

			write(&holder_key(), &H256::from(sender().clone()).into());
			write(&counter_party_key(), &H256::from(counter_party_address).into());

			// TODO: do parsing here
			// string command = parse(input);
			// if (command = "give") {give();}
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

		fn transfer(&mut self, from: Address, to: Address, amount: U256) -> bool {
            let senderBalance = read_balance(&from);
            let recipientBalance = read_balance(&to);
            if amount == 0.into() || senderBalance < amount || to == from {
                false
            } else {
                let new_sender_balance = senderBalance - amount;
                let new_recipient_balance = recipientBalance + amount;
                write(&balance_key(&from), &new_sender_balance.into());
                write(&balance_key(&to), &new_recipient_balance.into());
                self.Transfer(from, to, amount);
                true
            }
        }

		fn printLn(&mut self, input: U256) -> U256 {
			input
		}

		fn depositCollateral(&mut self, amount: U256) {
			let sender = sender();
			let senderBalance = read_balance(&sender);
            let new_sender_balance = senderBalance + amount;
			write(&balance_key(&sender), &new_sender_balance.into())
		}

		fn val(&mut self) -> U256 {
			pwasm_ethereum::value()
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


// DateTime Parser
/*
extern crate chrono;
use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime};
use chrono::format::ParseError;


fn main() -> Result<(), ParseError> {
    let rfc2822 = DateTime::parse_from_rfc2822("Tue, 1 Jul 2003 10:52:37 +0200")?;
    println!("{}", rfc2822);

    let rfc3339 = DateTime::parse_from_rfc3339("1996-12-19T16:39:57-08:00")?;
    println!("{}", rfc3339);

    let custom = DateTime::parse_from_str("5.8.1994 8:00 am +0000", "%d.%m.%Y %H:%M %P %z")?;
    println!("{}", custom);

    let time_only = NaiveTime::parse_from_str("23:56:04", "%H:%M:%S")?;
    println!("{}", time_only);

    let date_only = NaiveDate::parse_from_str("2015-09-05", "%Y-%m-%d")?;
    println!("{}", date_only);

    let no_timezone = NaiveDateTime::parse_from_str("2015-09-05 23:56:04", "%Y-%m-%d %H:%M:%S")?;
    println!("{}", no_timezone);

    Ok(())
}
*/
/*
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
	}

	#[test]
	fn give_and_update() {
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
	}
}
*/
