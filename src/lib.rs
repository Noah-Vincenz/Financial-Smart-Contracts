#![no_std]
#![allow(non_snake_case)]
#![feature(proc_macro_hygiene)]

// Daniel Version
/*
extern crate pwasm_ethereum;
extern crate pwasm_abi;
extern crate pwasm_abi_derive;

// Declares the dispatch and dispatch_ctor methods
use pwasm_abi::eth::EndpointInterface;
use pwasm_abi_derive::eth_abi;

#[no_mangle]
pub fn deploy() {
	let smartcontract = SmartContractInstance { };
    let mut endpoint = SmartContractEndpoint::new(smartcontract);
    endpoint.dispatch_ctor(&pwasm_ethereum::input());
}

#[no_mangle]
pub fn call() {
	let smartcontract = SmartContractInstance { };
    let mut endpoint = SmartContractEndpoint::new(smartcontract);
    pwasm_ethereum::ret(&endpoint.dispatch(&pwasm_ethereum::input()));
}

#[eth_abi(SmartContractEndpoint)]
pub trait SmartContract {
    fn constructor(&mut self);
}

struct SmartContractInstance {
}

impl SmartContract for SmartContractInstance {
    fn constructor(&mut self) {
        return;
    }
}
*/


// My Version


extern crate pwasm_std;
extern crate pwasm_ethereum;
extern crate pwasm_abi;
extern crate pwasm_abi_derive;

// Declares the dispatch and dispatch_ctor methods
use pwasm_abi::eth::EndpointInterface;
use pwasm_ethereum::{ret, input};
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
	use pwasm_std::String;
	use pwasm_abi_derive::eth_abi;

/*
	fn recipient_key() -> H256 {
		H256::from([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}

	fn owner_key() -> H256 {
		H256::from([3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
	}
*/

	#[eth_abi(SmartContractEndpoint, SmartContractClient)]
	pub trait SmartContract {
		/// The constructor
		fn constructor(&mut self);
		// Total amount of donations

		#[constant]
		fn balanceOf(&mut self, _owner: Address) -> U256;
		#[constant]
		fn ownBalance(&mut self) -> U256;
		/// Transfer the balance from owner's account to another account
        fn give(&mut self, _to: Address, _amount: U256) -> bool;
		//fn give(&mut self);
		//fn one(&mut self);
		#[constant]
		fn printLn(&mut self, input: U256) -> U256;
		/// Event declaration


		#[event]
		fn SmartContract(&mut self, indexed_from: Address, _value: U256);
		#[event]
        fn Transfer(&mut self, indexed_from: Address, indexed_to: Address, _value: U256);


	}

	pub struct SmartContractInstance;

	impl SmartContract for SmartContractInstance {
		fn constructor(&mut self) {

			// String addr, String addr, input string MUST BE VECTOR OF INTS!!! is parsed and then give is called if input string is give

			//write(&recipient_key(), &U256::from(0).into());
			//write(&owner_key(), &H256::from(sender().clone()).into()); // owner = msg.sender(); ?

			/*
			write(&owner_key(), H256::from_slice(addr1.as_bytes()));
			write(&recipient_key(), H256::from_slice(addr2.as_bytes()));
			*/


			//let owner_address = Address::from("0xea674fdde714fd979de3edf0f56aa9716b898ec8");
        	//let sam_address = Address::from("0xdb6fd484cfa46eeeb73c71edee823e4812f9e2e1");
			// TODO: do parsing here
			// string command = parse(input);
			// if (command = "give") {give();}
		}


		fn balanceOf(&mut self, owner: Address) -> U256 {
	        balance(&owner)
	    }

		fn ownBalance(&mut self) -> U256 {
			let sender = pwasm_ethereum::sender();
            balance(&sender)
			//U256::from(70000)
	    }



		fn give(&mut self, to: Address, amount: U256) -> bool {
            let sender = pwasm_ethereum::sender();
            let senderBalance = balance(&sender);
            let recipientBalance = balance(&to);
            if amount == 0.into() || senderBalance < amount || to == sender {
                false
            } else {
                let new_sender_balance = senderBalance - amount;
                let new_recipient_balance = recipientBalance + amount;
                pwasm_ethereum::write(&balance_key(&sender), &new_sender_balance.into());
                pwasm_ethereum::write(&balance_key(&to), &new_recipient_balance.into());
                self.Transfer(sender, to, amount);
                true
            }
        }

		/*
		fn give(&mut self) { // give ONE -> owner of contract pays 1
			let sender = sender().clone();
			let amount = value();
			let total: U256 = read(&recipient_key()).into();
			write(&recipient_key(), &(total + amount).into());
			self.SmartContract(sender, amount);
		}
		*/
		/*
		fn one(&mut self) {
			let amount = 1;
			let total: U256 = read(&owner_key()).into();
			write(&owner_key(), &(total + amount).into());
		}
		*/

		fn printLn(&mut self, input: U256) -> U256 {
			input
		}


	}

	fn address_of(key: &H256) -> Address {
		let h: H256 = read(key).into();
		Address::from(h)
	}

	fn balance(owner: &Address) -> U256 {
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
