var LSU = require('./lsu.js');
var pos = require('pos');
var natural = require('natural');
var d3 = require('d3');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var tokenizer = new natural.TreebankWordTokenizer();

var server = app.listen(3000, function () {
  console.log('app listening on 3000');
});

app.use(express.static('public'));
app.use(bodyParser());

app.get('/', function(req,res) {
  res.render('public/index.html');
});

app.post('/parse', function(req,res) {
  var sentence = req.body.sentence;
  console.log("------");
  console.log(sentenceToTree(sentence));
  console.log("------");
  res.json(sentenceToTree(sentence));
});

var sentenceToTree = function(sentence) {
  var words = tokenizer.tokenize(sentence);
  var taggedWords = new pos.Tagger().tag(words);
  taggedWords = LSU.processWords(taggedWords);

  //console.log(taggedWords);

  var tree = LSU.parse(taggedWords);
  //console.log(tree);
  return tree;
};