const { parse } = require('./index.js');

let isOk = process.argv.includes('fuzz') ?
    fuzz() :
    test();

if (!isOk) {
    process.exit(1);
} else {
    console.log('Everything OK!');
}

function test() {
    let paarseTests = [
        [
            `a=b "c"="d" key="multi word val" "multi word key"="multi word val"`,
            {a: 'b', c: 'd', key: 'multi word val', 'multi word key': 'multi word val'}
        ],
        [
            `'a'=b 'c'=\"d\" key='multi word val' 'multi word key'='multi word val'`,
            {a: 'b', c: 'd', key: 'multi word val', 'multi word key': 'multi word val'}
        ],
        [
            `a=b    c=d  'multiple spaces test'  =good`,
            {a: 'b', c: 'd', 'multiple spaces test': 'good'}
        ],
        [
            `'a'='"b"' "c=d"=e`,
            {a: '"b"', 'c=d': 'e'}
        ],
        [
            `malformed='missing last quote`,
            {malformed: 'missing last quote'},
        ],
        [
            `malformed=missing first quote'`,
            {malformed: 'missing', first: true, quote: true},
        ],
        [
            `malformed = "'wedew\\"'`,
            {malformed: `'wedew"'`},
        ],
        [
            `escapedquotes = "he said \\\"hello\\\" today" foo=1`,
            {escapedquotes: `he said "hello" today`, foo:'1'},
        ],
        [
            `escapedsinglequotes = 'he said \\\'hello\\\' today' foo=1`,
            {escapedsinglequotes: `he said 'hello' today`, foo:'1'},
        ],
        [
            `key = some\\ spaced\\ val foo=1`,
            {key: 'some spaced val', foo:'1'},
        ],
        [
            `key\\ with\\ spaces = some\\ spaced\\ val foo=1`,
            {'key with spaces': 'some spaced val', foo:'1'},
        ],
        [
            String.raw`key = a\ backslash\\\ in\ a\ value foo=1`,
            {key: 'a backslash\\ in a value', foo:'1'},
        ],
        [
            String.raw`key = end\ in\ a\ backslash\\ foo=1`,
            {key: 'end in a backslash\\', foo:'1'},
        ],
        [
            String.raw`backslash\key = a\ backslash\\ foo=1`,
            {'backslash\\key': 'a backslash\\', foo:'1'},
        ],
        [
            String.raw`a = "quoted spaces" b=slashed\ spaces\\ foo=1`,
            {a: 'quoted spaces', b: 'slashed spaces\\', foo:'1'},
        ],
        [
            String.raw`a = "quoted spaces" b= slashed\ spaces\\ foo=1`,
            {a: 'quoted spaces', b: 'slashed spaces\\', foo:'1'},
        ],
        [
            String.raw`many\ quotes = 6\\\\\\\\\\\\ foo=1`,
            {'many quotes': '6\\\\\\\\\\\\', foo:'1'},
        ],
        [
            String.raw`start_with_a_space = \ hello foo=1`,
            {'start_with_a_space': ' hello', foo:'1'},
        ],
        [
            String.raw`bad_escape = he\llo foo=1`,
            {'bad_escape': 'he\\llo', foo:'1'},
        ],
        [
            `foo = ba\nr foo=1`,
            {'foo': 'ba\nr', foo:'1'},
        ],
        [
            '',
            {}
        ],
        [
            `,`,
            {',': true}
        ],
        [
            '"',
            {'': true}
        ],
    ];

    // Shallow compare 2 objects
    function areObjectsEqual(a, b) {
        for(let key in a) {
            if(!(key in b) || a[key] !== b[key]) {
                return false;
            }
        }
        for(let key in b) {
            if(!(key in a) || a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    }

    let failed = 0;
    paarseTests.forEach(t => {
        let tags = parse(t[0]);
        if (!areObjectsEqual(tags, t[1])) {
            console.error('Test failed: ' + t[0], '\n  - Parsed:', tags, '\n  - Expected:', t[1]);
            failed++;
        }
    });

    if (failed > 0) {
        return false;
    }

    return true;
}


function fuzz() {
    // Just don't crash...
    // Generate random inputs, parse the, hope for the best

    const util = require('util');
    let failed = false;

    function rand(min, max) {
        // The maximum is exclusive and the minimum is inclusive
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }

    function genToken() {
        let quote1 = '';
        let quote2 = '';
        if (rand(0, 100) < 50) quote1 = '"';
        if (rand(0, 100) < 50) quote2 = "'";
        return quote1 + (Math.floor(Math.random()*10000)).toString(36) + quote2;
    }

    for(let i=0; i<1000000; i++) {
        let t1 = genToken();
        let t2 = rand(0, 100) < 50 ? genToken() : '';
        let spaces1 = ''.padEnd(rand(0, 7), ' ');
        let spaces2 = ''.padEnd(rand(0, 7), ' ');
        let spaces3 = ''.padEnd(rand(0, 7), ' ');
        let equals = '=';
        if(rand(0, 100) < 5) {
            equals = ''.padEnd(rand(0, 5), '=');
        }

        let input = spaces3 + t1 + spaces1 + equals + spaces2 + t2 + spaces3;
        if (rand(0, 100) < 5) {
            let pos = rand(0, input.length);
            input = input.substr(0, pos) + '\n' + input.substr(pos+1);
        }

        try {
            parse(input)
        } catch (err) {
            console.error('Parser crashed while parsing: ' + util.inspect(input));
            console.error('  - ' + err.stack);
            failed = true;
        }
    }

    return !failed;
}
