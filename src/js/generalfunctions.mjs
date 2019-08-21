/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

function sleep(ms) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > ms){
            break;
        }
    }
}

/*
* @author Vitim.us https://gist.github.com/victornpb/7736865
* @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
*/
export function occurrences(string, subString, allowOverlapping) {

   string += "";
   subString += "";
   if (subString.length <= 0) return (string.length + 1);

   var n = 0,
       pos = 0,
       step = allowOverlapping ? 1 : subString.length;

   while (true) {
       pos = string.indexOf(subString, pos);
       if (pos >= 0) {
           ++n;
           pos += step;
       } else break;
   }
   return n;
}

export function isNumeric(num){
    return !isNaN(num);
}

// for debugging
function printStack(stack, name) {
    console.log(name + ": " + stack.length);
    var x;
    for (var x = 0; x < stack.length; ++x) {
        console.log(name + " - " + x + ": " + stack[x]);
    }
}
