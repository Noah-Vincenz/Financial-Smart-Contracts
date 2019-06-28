extern crate pwasm_std;
extern crate pwasm_ethereum;

use pwasm_std::{Vec, String};
use pwasm_ethereum::{timestamp};

pub fn parse(input_string: String) -> Vec<i32> { //try with i32 instead of string

	let mut recipient = 0;
	let mut amount = 1;
	let mut acquire_at_horizon = 0; // acquired at contract horizon - 0 or 1
	let mut truncate_given = 0; // truncated to certain date - 0 or 1
	let mut horizon = 0;
	let mut vec = Vec::new(); // final vector to return

	let splitted_vec: Vec<_> = input_string.split_whitespace().collect();
	//let result : Vec<_> = s.split_whitespace().collect();
	'outer: for str in splitted_vec.iter() {
		match str {
			&"one" => amount = amount * 1,
			&"zero" => amount = amount * 0,
			&"give" => recipient = 1,
			&"scaleK" => continue 'outer,
			&"get" => acquire_at_horizon = 1,
			&"truncate" => {
	            truncate_given = 1;
				continue 'outer
        	}
			&"\"[0-9]+\"" => {
				let now = timestamp(); // = u64
				horizon = str.parse::<i32>().unwrap() - now as i32; // may need to be u64
			}
			&_ => amount = amount * str.parse::<i32>().unwrap() // when str is number
		}
	}
	vec.push(recipient);
	vec.push(amount);
	vec
}

/*
val SYM = CSET(('a' to 'z').toSet ++ ('A' to 'Z').toSet)
val DIGIT = CSET(('0' to '9').toSet)
val ID = SYM ~ ("_" | SYM | DIGIT).%
val DIGIT2 = CSET(('1' to '9').toSet)
val NUM = DIGIT | ( DIGIT2 ~ DIGIT.% )
val KEYWORD : Rexp = "while" | "if" | "then" | "else" | "do" | "for" | "to" | "true" | "false" | "read" | "write" | "skip"
val SEMI: Rexp = ";"
val OP: Rexp = ":=" | "==" | "-" | "+" | "*" | "!=" | "<" | ">" | "&&" | "||" | "%" | "/"
val WHITESPACE = (" " | "\n" | "\t") ~ (" " | "\n" | "\t").%
val PAREN: Rexp = ")" | "{" | "}" | "("
val STRING: Rexp = "\"" ~ SYM.% ~ "\""
*/

/*
#[derive(Debug)]
enum GrammarItem {
    Product,
    Sum,
    Number(i64),
    Paren
}

#[derive(Debug, Clone)]
enum LexItem {
    Paren(char),
    Op(char),
    Num(i64),
}

#[derive(Debug)]
struct ParseNode {
    children: Vec<ParseNode>,
    entry: GrammarItem,
}

impl ParseNode {
    pub fn new() -> ParseNode {
        ParseNode {
            children: Vec::new(),
            entry: GrammarItem::Paren,
        }
    }
}

fn lex(input: &String) -> Result<Vec<LexItem>, String> {
	let mut result = Vec::new();

	let mut it = input.chars().peekable();
	while let Some(&c) = it.peek() {
		match c {
			'0'...'9' => {
				it.next();
				let n = get_number(c, &mut it);
				result.push(LexItem::Num(n));
			}
			'+' | '*' => {
				result.push(LexItem::Op(c));
				it.next();
			}
			'(' | ')' | '[' | ']' | '{' | '}' => {
				result.push(LexItem::Paren(c));
				it.next();
			}
			' ' => {
				it.next();
			}
			_ => {
				return Err(format!("unexpected character {}", c));
			}
		}
	}
	Ok(result)
}

fn get_number<T: Iterator<Item = char>>(c: char, iter: &mut Peekable<T>) -> i64 {
    let mut number = c.to_string().parse::<i64>().expect("The caller should have passed a digit.");
    while let Some(Ok(digit)) = iter.peek().map(|c| c.to_string().parse::<i64>()) {
        number = number * 10 + digit;
        iter.next();
    }
    number
}
*/
