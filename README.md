# Nexus: A Domain-Specific Language for Financial Smart Contracts

Financial institutions rely more and more on blockchain technology and financial smart contracts are becoming more prominent as time goes by. Financial smart contracts allow for efficient automation of contract execution and their contractual terms, while providing the cost and security benefits of blockchain technology.

The most prominent platform for smart contracts is Ethereum. Ethereum smart contracts are implemented in the Solidity programming language. Because of the design and underlying complexity of this high-level language, which allows for many unsafe programming patterns, large amounts of Ether (the cryptocurrency used in Ethereum) have been locked and stolen. Generally speaking, smart contract development in Solidity is non-trivial and highly prone to a number of security vulnerabilities.

As a result of the above, we introduce Nexus: a high-level domain-specific programming language for writing safer financial smart contracts. This language is based on previous work in the financial engineering industry conducted by Simon Peyton Jones, Jean-Marc Eber, and Julian Seward [1]. Nexus is a high-level programming language that is straightforward to use, efficient, and easily portable to any underlying blockchain. We also present an accompanying web application that allows users to easily compose smart contracts in Nexus, while handling their compilation in the background. The interface of the web application also enables users to interact with Nexus smart contracts, evaluate these, as well as visualise their evolution. This allows for smart contract transparency, effectively enabling users to reason more easily about financial smart contracts.



## System Architecture

<p align="center">
  <img width="859" alt="Screenshot 2019-09-10 at 21 55 08" src="https://user-images.githubusercontent.com/16804823/64649851-b1914480-d415-11e9-978d-cabfc0dfd5f7.png"
</p>



## Nexus Grammar (inspired by [1])

Contracts composed in Nexus will be of the following syntax (note that Nexus enforces parentheses):
<p align="center">
  <img width="587" alt="Screenshot 2019-09-10 at 21 50 36" src="https://user-images.githubusercontent.com/16804823/64649580-139d7a00-d415-11e9-96a1-70501723ec80.png"
</p>
  
In addition to the above, Nexus allows conditional statements of the form *if (condition) {consequence} else {alternative}*, where the *else* and *alternative* are optional (both together). A *condition* is of the form *c1 compOp c2*, where *compOp* is one of: >,<,>=,<=,==,[>],[<],[>=],[<=],[==],{>},{<},{>=},{<=},{==}.
  
  

## User Manual

This chapter will walk through the actions that need to be taken in order to run the system on a local machine. It is divided into three sections. Firstly, we will explain how to install the software and required libraries. Following this, we will explain how to test, build and run the software on a local server. Lastly, we will go on to elaborate on how to interact with the web application and compose a Nexus smart contract. First of all, the instructions in the tutorial at https://github.com/paritytech/pwasm-tutorial should be followed to set up a small pWasm project, install the libraries and tools that are required for this project, and become familiar with the pWasm and Rust environment.


### Installation & Setup

#### Prerequisites: Rust, Parity, Wasm-build

The instructions in this guide assume that npm (or yarn on Linux) is installed on the machine being used. If this is not the case, the instructions on the [npm](https://www.npmjs.com/get-npm) (or [yarn](https://yarnpkg.com/lang/en/docs/install/#mac-stable)) website can be followed to to install the missing tools.

Run the following commands in order to install the Rust nightly toolchain as well as wasm32-unknown-unknown to compile Nexus contracts into Wasm.
```
$ rustup install nightly-2018-11-12
$ rustup target add wasm32-unknown-unknown
```
Additionally, **wasm-build** needs to be installed to allow compilation from the .wasm binary file into a contract JSON code executable on the Ethereum blockchain.
```
$ cargo install pwasm-utils-cli --bin wasm-build
```
Follow the [instructions](https://wiki.parity.io/Setup) provided by parity to install Parity version **1.9.5** or greater.

#### Software

Clone the repository onto your machine, head to the root directory of the repository and run
```
$ npm install
```
on Mac or
```
$ yarn install
```
on Linux. This will install all missing npm libraries that are needed to run the software. 

#### Libra

In order to install Libra, one needs to head to https://github.com/libra/libra and clone the repository. This will download the Libra repository onto the machine that is being used. Once the download has completed, the user can change directory to the root directory of the repository. Following this, one can run Libra locally in the terminal by running
```
$ ulimit -n 4096
$ cargo run -p libra_swarm -- -s
```
This will launch a single Libra validator node locally on your own blockchain. The running node, however, is not connected to the Libra testnet. This allows you to play around with Libra accounts and exercise the functionality offered by the Move IR. Furthermore, this can be used to send transactions that publish a module, run the transaction script and so one. As of now, the documentation for this is sparse and the Libra Association are currently working on supplying more functionality.

In addition to the above, one can change directory to `libra/language/functional_tests/tests/testsuite` to verify the semantics and correctness of any given Libra code, allowing you to exercise modules that modify the global blockchain state in the same way you could do on a real blockchain. After the Move IR source code file named *script.mvir* has been successfully downloaded (this happens when a contract is acquired), this can be located inside the directory above. Running
```
$ cargo test script.mvir
```
will then execute the transactions in the downloaded module and verify its correctness.


### Project Test, Build, and Run

After the software has been downloaded and required libraries have been installed, you can test the software by running
```
$ npm run test -js
```
to execute the given set of JavaScript tests, or
```
$ npm run test-rust
```
to execute our Rust tests. Running
```
$ npm run build
```
will compile the Rust smart contract into its corresponding JSON contract code using Wasm. Following this, running
```
$ gulp
```
will bundle the JavaScript files and launch a local server hosted at `localhost:9001` to execute these and launch our web application. Before accessing the web application, the user must run
```
$ ./run-parity-chain.sh
```
in a separate terminal window in order to run a local blockchain instance of the parity development chain. Heading to `localhost:9001` in Google Chrome will give you access to the we application. Alternatively, you can run
```
$ npm start
```
to execute all the steps mentioned above in their order given.


### Using the Web Application

The web application can be accessed at `localhost:9001` using Google Chrome. The instructions in this section assume that MetaMask is correctly installed and set up. If this is not the case, you can head to https://metamask.io/ to follow their instructions to install MetaMask, import the parity development blockchain with http://127.0.0.1:8545 as the RPC URL, and import the accounts registered on the local parity development blockchain. When running the application for the first time or on restarting the browser, the user will be presented with a MetaMask window, asking to allow the web application to access MetaMask. After having confirmed this, the selected network in MetaMask should be switched to the parity development blockchain network and one of the imported blockchain accounts should be selected. Once these instructions have been followed and the web application is up and running, the user will be presented with the following user interface.

<img width="1438" alt="screenshot1" src="https://user-images.githubusercontent.com/16804823/64494004-ae684e00-d287-11e9-8ec1-d0e9aac9eb09.png">

The user can then provide two parity development chain account addresses to be used for the contract and press the Create Contract button to proceed. This will trigger MetaMask showing the window presented below, asking the user to confirm the transaction.

<p align="center">
  <img width="359" alt="screenshot2" src="https://user-images.githubusercontent.com/16804823/64494005-af00e480-d287-11e9-9750-8c5e9cfcc112.png"
</p>

Confirming this transaction will enable the deposit buttons in the web user interface, allowing the user to deposit a specified amount of Ether into both accounts. In order to deposit Ether, the account that is placing the deposit must be selected in MetaMask, otherwise the user will be notified with an error message in the user interface. After both accounts have deposited an arbitrary amount of Ether, the input textarea titled Construct Smart Contract Transactions: will be enabled and the user can start composing Nexus contracts by providing a syntactically correct contract from the textarea and then pressing the Make Transaction button. This will add the contract provided by the user to the list of pending contracts and display this in the table presented in the following figure. In the following figure, the most recently added contract corresponds to *zero and give (zero)*, where both subcontracts are displayed as a single combined supercontract.

<img width="1440" alt="screenshot3" src="https://user-images.githubusercontent.com/16804823/64494006-af997b00-d287-11e9-8714-801122dd6532.png">

Following this, the user can freely use the web application interface to extend the language, add new contracts, evaluate and manage contracts or acquire pending contracts.



## References 

1. S. P. Jones, J.-M. Eber, and J. Seward, “Composing contracts: An adventure in financial engineering,” Lecture notes in computer science., vol. 2021, 2001.
