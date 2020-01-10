const chalk = require('chalk');

class Console {
    static successPrint(){
        console.log(...Array.from(arguments).map(a => chalk.ansi256(216).underline.bold(a)));
    }
    static commonPrint(){
        console.log(...Array.from(arguments).map(a => chalk.ansi256(217).bold(a)));
    }
    static hightlightedPrint(){
        console.log(...Array.from(arguments).map(a => chalk.ansi256(33).bold(a)));
    }
    static errorPrint(){
        console.log(...Array.from(arguments).map(a => chalk.bgAnsi256(52)(a)));
    }
}

module.exports = Console;