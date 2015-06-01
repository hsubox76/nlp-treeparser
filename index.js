var pos = require('pos');

var natural = require('natural'),
  tokenizer = new natural.TreebankWordTokenizer();
var words = tokenizer.tokenize("Joe's old brown cow - very strangely - didn't really eat the grass.");

console.log(words);

var taggedWords = new pos.Tagger().tag(words);

// second tag pass looking for negatives?

taggedWords = taggedWords.map(function(word) {
  if (word[0] === "'s") {
    word[1] = 'POS';
  }
  return {word: word[0], tag: word[1]};
});

// for (var i = 0; i < taggedWords.length; i++) {
//     var taggedWord = taggedWords[i];
//     if (taggedWord[0] === "'s") {
//       taggedWord[1] = 'POS';
//     }
//     var word = taggedWord[0];
//     var tag = taggedWord[1];
//     console.log(word + " /" + tag);
// }

var Queue = function () {
  this.storage = {};
  this.first = 0;
  this.last = 0;
};

Queue.prototype.enqueue = function (value) {
  this.storage[this.last] = value;
  this.last++;
};

Queue.prototype.dequeue = function () {
  if (this.last - this.first <= 0) {
    return null;
  }
  var tmp = this.storage[this.first];
  delete this.storage[this.first];
  this.first++;
  return tmp;
};

Queue.prototype.length = function () {
  return this.last - this.first;
};

var Tree = function (word, pos) {
  this.word = word;
  this.pos = pos;
  this.children = [];
  this.parent = null;
};

Tree.prototype.addChild = function (word, pos) {
  var child = new Tree(word, pos);
  child.parent = this;
  this.children.push(child);
  return child;
};

// breadth first tree print to console
Tree.prototype.print = function () {
  var queue = new Queue();
  var rows = [];
  var recurse = function (node, depth) {
    if (!rows[depth]) {
      rows[depth] = "";
    }
    var x = node.parent ? node.parent.word : 'null';
    rows[depth] = rows[depth].concat(' [ ' + node.word + ' | ' + node.pos + ' | ' + x + ' ] ');
    for (var i = 0; i < node.children.length; i++) {
      queue.enqueue([node.children[i], depth+1]);
    }
    while (queue.length() > 0) {
      var currentNode = queue.dequeue();
      recurse(currentNode[0], currentNode[1]);
    }
  };
  recurse (this, 0);
  rows.forEach(function(row) {
    console.log(row);
  });
};

var tree = new Tree('ate', 'VBD');
var child1 = tree.addChild('cow', 'NN');
var child2 = tree.addChild('grass', 'NN');
child1.addChild('the', 'DT');
child2.addChild('the', 'DT');

//tree.print();

// RULES
// (1) Find a verb - root
// (2) Set verb mode - store verb in lastVerb
//    Go left 
//    if adverb && verbMode make child of lastVerb
//       set adverb mode - store adverb in lastAdverb
//    if adverb & adverbMode - make child of lastAdverb
//        store adverb in lastAdverb
//    if noun && lastVerb - make child of lastVerb
//        store noun in lastNoun

var makeParseTree = function (words) {
  var tree = new Tree();
  var verbMode = false;
  var adverbMode = false;
  var nounMode = true;
  var lastVerb;
  var lastAdverb;
  var lastNoun;
  var rootIndex;
  var currentIndex;
  var newNode;

  // find first verb
  for (var i = 0; i < words.length; i++) {
    var word = words[i].word;
    var tag = words[i].tag;
    if (tag === 'VBD' || tag === 'VB' || tag === 'VBP' || tag === 'VBZ') {
      tree.word = word;
      tree.pos = tag;
      verbMode = true;
      lastVerb = tree;
      rootIndex = i;
      break;
    }
  }

  var walkLeft = function() {
    currentIndex--;
    wordData = words[currentIndex];
    // adverb while in verb mode
    if (wordData.tag === 'RB' && verbMode === true) {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = true;
      verbMode = false;
      nounMode = false;
      lastAdverb = newNode;
    }
    // adverb while in adverb mode
    else if (wordData.tag === 'RB' && adverbMode === true) {
      newNode = lastAdverb.addChild(wordData.word, wordData.tag);
      lastAdverb = newNode;
    }
    // noun... any mode?
    else if (wordData.tag === 'NN' || wordData.tag === 'NNP' || wordData.tag === 'NNPS' || wordData.tag === 'NNS') {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = false;
      verbMode = false;
      nounMode = true;
      lastNoun = newNode;
    }
    // adjective while in noun mode
    else if (nounMode && wordData.tag === 'JJ' || wordData.tag === 'JJR' || wordData.tag === 'JJS') {
      newNode = lastNoun.addChild(wordData.word, wordData.tag);
    }
    // determiner while in noun mode
    else if (wordData.tag === 'DT' && nounMode === true) {
      newNode = lastNoun.addChild(wordData.word, wordData.tag);
      nounMode = false;
    }
    // possessive ending
    else if (wordData.tag === 'POS') {
      newNode = lastNoun.addChild(wordData.word, wordData.tag);
      currentIndex--;
      newNode = newNode.addChild(words[currentIndex].word, words[currentIndex].tag);
    }
  };

  var walkRight = function() {
    currentIndex++;
    wordData = words[currentIndex];
    // adverb while in verb mode
    if (verbMode && wordData.tag === 'RB' || wordData.tag === 'RBR' || wordData.tag === 'RBS') {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = true;
      verbMode = false;
      nounMode = false;
      lastAdverb = newNode;
    }
  };

console.log(words);
currentIndex = rootIndex;
while (currentIndex > 0) {
  walkLeft();
}
while (currentIndex < words.length - 1) {
  walkRight();
}
console.log(words[currentIndex]);

  tree.print();

};

makeParseTree(taggedWords);

