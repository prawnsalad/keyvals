module.exports.parse = kvParse;

function kvParse(inp) {
    let data = {};
    let pos = 0;
    let escapeChar = '\\';
    let escapeVals = Object.create(null);
    escapeVals['"'] = '"';
    escapeVals["'"] = "'";
    escapeVals[' '] = ' ';
    escapeVals['\\'] = '\\';


    while (pos < inp.length) {
        let key = '';
        let val = '';

        key = readToken();
        ffwd();
        if (inp[pos] === '=') {
            skip();
            val = readToken({isValue: true});
        } else {
            ffwd();
            val = true;
        }

        data[key] = val;
    }

    return data;

    // Fast forward past whitespace
    function ffwd() {
        while (inp[pos] === ' ' && pos < inp.length) {
            pos++;
        }
    }

    // Skip the current position
    function skip() {
        pos++;
    }

    // Read a block of characters. Quoted allows spaces
    function readToken(opts={isValue:false}) {
        let currentQuote = '';
        let escaped = false;
        let buffer = '';

        ffwd();
        do {
            let cur = inp[pos];
            if (!cur) {
                break;
            }
    
            //  Opening quote
            if (!currentQuote && isQuote(cur)) {
                currentQuote = cur;
                continue;
            }
    
            // Escaping the next character
            if (!escaped && cur === escapeChar && isEscapable(inp[pos+1])) {
                escaped = true;
                continue;
            }

            if (isEscapable(cur) && escaped) {
                escaped = false;
                buffer += escapeVals[cur];
                continue;
            }

            // Escaped closing quote is not a closing quote
            if (currentQuote && currentQuote === cur && escaped) {
                console.log('#####');
                // TODO: is this check needed or does the above block catch this now?
                buffer += cur;
                continue;
            }
    
            // Closing quote
            if (currentQuote && currentQuote === cur && !escaped) {
                currentQuote = '';
                skip();
                break;
            }

            if (!opts.isValue) {
                // Keys stop at a space or = character
                if (!currentQuote && (cur === ' ' || cur === '=')) {
                    break;
                }
            } else {
                // Unquoted values stop at a space
                if (!currentQuote && cur === ' ') {
                    break;
                }
            }

            buffer += cur;
        } while(++pos < inp.length) 

        return buffer;
    }

    function isQuote(char) {
        return char === '"' || char === "'";
    }

    function isEscapable(char) {
        return typeof escapeVals[char] !== 'undefined';
    }
}
