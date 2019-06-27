extern crate pwasm_std;

use pwasm_std::{Vec, String};

pub fn parse(inputString: String) -> Vec<i32> { //try with i32 instead of string
	//let x: String = inputString[0];
	//let y: String = inputString[1];
	let mut vec = Vec::new();
	//let ref x = &inputString[0];
	//let ref y = &inputString[1];
	vec.push(1);
	vec.push(10);
	vec

	//let outputArr: [String; 2] = [x, y];
	//outputArr
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
