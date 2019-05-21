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

/*
#[no_mangle]
pub fn call() {
	let mut endpoint = smart_contract::SmartContractEndpoint::new(smart_contract::SmartContractInstance{});
    ret(&endpoint.dispatch(&input()));
}
*/

pub mod smart_contract {
	use pwasm_std::types::{H256, Address, U256};
	use pwasm_ethereum::{read, write, sender, value};
	use pwasm_std::String;
	use pwasm_abi_derive::eth_abi;

	fn recipient_key() -> H256 {
		H256::from([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn owner_key() -> H256 {
		H256::from([3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	#[eth_abi(SmartContractEndpoint, SmartContractClient)]
	pub trait SmartContract {
		/// The constructor
		fn constructor(&mut self, input: String);
		/// Total amount of donations
		#[constant]
		fn balance(&mut self) -> U256;
		/// Donate, whatever balance you send will be the donated amount
		fn give(&mut self);
		fn one(&mut self);
		/// Event declaration
		#[event]
		fn SmartContract(&mut self, indexed_from: Address, _value: U256);
	}

	pub struct SmartContractInstance;

	impl SmartContract for SmartContractInstance {
		fn constructor(&mut self, input: String) {
			write(&recipient_key(), &U256::from(0).into());
			write(&owner_key(), &H256::from(sender().clone()).into());
		}

		fn balance(&mut self) -> U256 {
			read(&recipient_key()).into()
		}

		fn give(&mut self) { // give ONE -> owner of contract pays 1
			let sender = sender().clone();
			let amount = value();
			let total: U256 = read(&recipient_key()).into();
			write(&recipient_key(), &(total + amount).into());
			self.SmartContract(sender, amount);
		}

		fn one(&mut self) {
			let amount = 1;
			let total: U256 = read(&owner_key()).into();
			write(&owner_key(), &(total + amount).into());
		}

	}

	fn address_of(key: &H256) -> Address {
		let h: H256 = read(key).into();
		Address::from(h)
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
