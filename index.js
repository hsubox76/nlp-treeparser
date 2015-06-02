var LSU = require('./lsu.js');
var pos = require('pos');
var natural = require('natural');

var tokenizer = new natural.TreebankWordTokenizer();
var words = tokenizer.tokenize("Economic news had little effect on financial markets.");
var taggedWords = new pos.Tagger().tag(words);
taggedWords = LSU.processWords(taggedWords);

var deps = LSU.getArcs(taggedWords).deps;
console.log(deps);
var tree = LSU.parse(taggedWords);