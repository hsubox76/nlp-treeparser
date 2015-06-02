var pos = require('pos');

var natural = require('natural'),
  tokenizer = new natural.TreebankWordTokenizer();


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

Tree.prototype.removeMe = function () {
  console.log('removing ' + this.word + ' from parent ' + this.parent.word);
  var index = this.parent.children.indexOf(this);
  this.parent.children.splice(index, 1);
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
  var nounMode = false;
  var adjMode = false;
  var lastVerb;
  var lastAdverb;
  var lastNoun;
  var lastAdj;
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
    console.log('-------');
    console.log('verb mode: ' + verbMode);
    console.log('noun mode: ' + nounMode);
    console.log("word: " + wordData.word + " tag: " + wordData.tag);
    // adverb while in verb mode
    if (wordData.tag === 'RB' && verbMode === true) {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = true;
      verbMode = false;
      nounMode = false;
      adjMode = false;
      lastAdverb = newNode;
    }
    // adverb while in adjective mode
    else if (wordData.tag === 'RB' && adjMode === true) {
      newNode = lastAdverb.addChild(wordData.word, wordData.tag);
      lastAdverb = newNode;
    }
    // adverb while in adverb mode
    else if (wordData.tag === 'RB' && adverbMode === true) {
      newNode = lastAdverb.addChild(wordData.word, wordData.tag);
      lastAdverb = newNode;
    }
    // noun... any mode?
    else if (wordData.tag === 'NN' || wordData.tag === 'NNP' || wordData.tag === 'NNPS' || wordData.tag === 'NNS' || wordData.tag === 'PRP') {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = false;
      verbMode = false;
      nounMode = true;
      adjMode = false;
      lastNoun = newNode;
    }
    // adjective while in noun mode
    else if (nounMode && (wordData.tag === 'JJ' || wordData.tag === 'JJR' || wordData.tag === 'JJS')) {
      newNode = lastNoun.addChild(wordData.word, wordData.tag);
      adjMode = true;
      lastAdj = newNode;
    }
    // determiner while in noun mode
    else if (wordData.tag === 'DT' || wordData.tag === 'PDT' && nounMode === true) {
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
    console.log('-------');
    console.log('verb mode: ' + verbMode);
    console.log('noun mode: ' + nounMode);
    console.log('last noun: ' + lastNoun.word);
    console.log("word: " + wordData.word + " tag: " + wordData.tag);
    // adverb
    if (wordData.tag === 'RB' || wordData.tag === 'RBR' || wordData.tag === 'RBS') {
      if (verbMode) {
        newNode = lastVerb.addChild(wordData.word, wordData.tag);
        lastAdverb = newNode;
      }
    }
    // adjective while in verb mode (bad grammar but everyone does it)
    else if (verbMode && (wordData.tag === 'JJ' || wordData.tag === 'JJR' || wordData.tag === 'JJS')) {
      console.log('opt 2');
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = true;
      verbMode = false;
      nounMode = false;
      lastAdverb = newNode;
    }
    // verb in verb mode
    else if (verbMode && (wordData.tag === 'VBD' || wordData.tag === 'VB' || wordData.tag === 'VBP' || wordData.tag === 'VBZ')) {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = false;
      verbMode = true;
      nounMode = false;
      adjMode = false;
      lastVerb = newNode;
    }
    // verb in noun mode
    else if (nounMode && (wordData.tag === 'VBD' || wordData.tag === 'VB' || wordData.tag === 'VBP' || wordData.tag === 'VBZ')) {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      lastNoun.removeMe();
      newNode.children.push(lastNoun);
      lastNoun.parent = newNode;
      adverbMode = false;
      verbMode = true;
      nounMode = false;
      adjMode = false;
      lastVerb = newNode;
    }
    // noun... subject of verb?
    else if (wordData.tag === 'NN' || wordData.tag === 'NNP' || wordData.tag === 'NNPS' || wordData.tag === 'NNS' || wordData.tag === 'PRP') {
      newNode = lastVerb.addChild(wordData.word, wordData.tag);
      adverbMode = false;
      verbMode = false;
      nounMode = true;
      adjMode = false;
      lastNoun = newNode;
    }
  };

  console.log(words);
  currentIndex = rootIndex;
  while (currentIndex > 0) {
    walkLeft();
  }
  currentIndex = rootIndex;
  verbMode = true;
  while (currentIndex < words.length - 1) {
    walkRight();
  }
  console.log(words[currentIndex]);

  tree.print();

};

//makeParseTree(taggedWords);

var Stack = function () {
  this.storage = {};
  this.first = 0;
  this.last = 0;
};

Stack.prototype.push = function (value) {
  this.storage[this.last] = value;
  this.last++;
};

Stack.prototype.pop = function () {
  if (this.size() === 0) {
    return null;
  }
  var tmp = this.storage[this.last];
  delete this.storage[this.last];
  this.last--;
  return tmp;
};

Stack.prototype.size = function () {
  return this.last - this.first;
};

Stack.prototype.top = function () {
  return this.storage[this.last-1];
};

var TransitionParser = function () {
  this.stack = new Stack();
  this.buffer = new Queue();
  this.arcs = {};
};

TransitionParser.prototype.init = function (words) {
  this.words = words;
  this.stack.push('ROOT');
  for (var i = 0; i < this.words.length; i++) {
    this.buffer.enqueue(words[i]);
  }
};

TransitionParser.prototype.simplifyPOS = function (pos) {
  var simplePos;
  switch (pos) {
    case 'JJ': // adjective
    case 'JJR': // adj, comparative
    case 'JJS': // adj, superlative
      simplePos = 'adj';
      break;
    case 'NN': // noun
    case 'NNP': // proper noun
    case 'NNPS': // plural proper noun
    case 'NNS': // plural noun
    case 'PRP': // personal pronoun
      simplePos = 'noun';
      break;
    case 'RB': //adverb
      simplePos = 'adv';
  }
  console.log(simplePos);
  return simplePos;
};

TransitionParser.prototype.getRelationship = function (word1, word2) {
  console.log(word1, word2);
  var pos1 = this.simplifyPOS(word1.tag);
  var pos2 = this.simplifyPOS(word2.tag);
  console.log(pos1, pos2);

  var relationships = {
    adj: {
      noun: 1,
      adv: -1
    }
  };

  // positive: word1 depends on word2
  // negative: word2 depends on word1
  return relationships[pos1][pos2] > 0;
};

TransitionParser.prototype.parse = function () {
  while (this.buffer.length() > 0) {
    var word = this.buffer.dequeue();
    // if there's only the root
    if (this.stack.size() <= 1) {
      this.stack.push(word);
    } else {
      var relationship = this.getRelationship(this.stack.top(), word);
      if (relationship === 1) {
        arcs[word.i] = { start: word, end: this.stack.pop() };
      } else if (relationship === -1) {
        arcs[word.i] = { start: this.stack.pop(), end: word };
      }
    }
  }
};
var words = tokenizer.tokenize("Economic news");


var taggedWords = new pos.Tagger().tag(words);

// second tag pass looking for negatives?

taggedWords = taggedWords.map(function(word, i) {
  if (word[0] === "'s") {
    word[1] = 'POS';
  }
  if (word[0] === "ca" && taggedWords[i+1][0] === "n't") {
    word[0] = "can";
    word[1] = "VB";
  }
  if (i > 0) {
    // like and love should be verbs if they come right after a noun
    if (word[0] === 'like' || word[0] === 'likes' || word[0] === 'love' || word[0] === 'loves' ||
      word[0] === 'liked' || word[0] === 'loved') {
      var prevTag = taggedWords[i-1][1];
      if (prevTag === 'NN' || prevTag === 'NNP' || prevTag === 'NNPS' || prevTag === 'NNS' || prevTag === 'PRP') {
        word[1] = 'VB';
      }
    }
  }
  return {word: word[0], tag: word[1], index: i};
});

var tp = new TransitionParser();
tp.init(taggedWords);
tp.parse();

