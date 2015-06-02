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

Queue.prototype.peek = function () {
  if (this.last - this.first <= 0) {
    return null;
  }
  return this.storage[this.first];
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
  this.stack = [];
  this.buffer = new Queue();
  this.arcs = {};
};

TransitionParser.prototype.init = function (words) {
  this.words = words;
  this.stack.push({index: 'ROOT'});
  for (var i = 0; i < this.words.length; i++) {
    this.buffer.enqueue(words[i]);
  }
};

TransitionParser.prototype.simplifyPOS = function (pos) {
  //console.log('simplifying ' + pos);
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
      break;
    case 'VB': // verb base form
    case 'VBD': // verb past tense
    case 'VBP': // verb present
    case 'VBZ': // verb present
      simplePos = 'verb';
      break;
    case 'IN': // preposition
    case 'TO': // to
      simplePos = 'prep';
      break;
    case '.':
      simplePos = '.';
      break;
    default:
      simplePos = 'undefinedPOS';
  }
  //console.log(simplePos);
  return simplePos;
};

TransitionParser.prototype.getRelationship = function (word1, word2) {
  var pos1 = this.simplifyPOS(word1.tag);
  var pos2 = this.simplifyPOS(word2.tag);

  var relationships = {
    noun: {
      adj: 1,
      verb: -1,
      prep: 1
    },
    verb: {
      noun: 1
    },
    adj: {
      noun: -1
    },
    prep: {
      noun: -1
    },
    ".": {
      verb: -1,
      noun: -1,
      adj: -1,
      prep: -1
    }
  };

  // console.log(word1, word2);
  // console.log(pos1, pos2);
  // positive: word1 depends on word2
  // negative: word2 depends on word1
  return relationships[pos1][pos2];
};

TransitionParser.prototype.parse = function () {
  // clear queue
  while (this.buffer.length() > 0) {
    var nextWord = this.buffer.peek();
    if (this.simplifyPOS(nextWord.tag) === '.') {
      break;
    }
    var newWord = this.buffer.dequeue();
    // if period, clear stack
    console.log('------------');
    console.log('new word: ' + newWord.word);
    var oldWord = this.stack.pop();
    if (oldWord.index === 'ROOT') {
      this.stack.push(oldWord);
    }
    if (this.simplifyPOS(oldWord.tag) === 'verb' && !this.arcs['ROOT']) {
      this.arcs['ROOT'] = [oldWord.index];
    }

    var relationship = this.getRelationship(newWord, oldWord);
    var parent;
    console.log('relationship: ' + relationship);

    // if new word beats old word
    // create arc new word -> old word
    if (relationship === 1) {
      console.log('creating arc ' + newWord.index + ' to ' + oldWord.index);
      if (this.arcs[newWord.index]) {
        this.arcs[newWord.index].push(oldWord.index);
      } else {
        this.arcs[newWord.index] = [oldWord.index];
      }
    } else if (relationship === -1) {
      console.log('creating arc ' + oldWord.index + ' to ' + newWord.index);
      if (this.arcs[oldWord.index]) {
        this.arcs[oldWord.index].push(newWord.index);
      } else {
        this.arcs[oldWord.index] = [newWord.index];
      }
    }

    console.log('arc of whats on top of stack');
    console.log(this.stack[this.stack.length-1].index);
    console.log(this.arcs[this.stack[this.stack.length-1].index]);

    if (this.arcs[this.stack[this.stack.length-1].index] && this.arcs[this.stack[this.stack.length-1].index].some(function (item) {
      return item === oldWord.index;
    })) {
      console.log('parent is in stack');
      this.stack.push(oldWord);
    }
    else if (this.arcs[oldWord.index] && this.arcs[oldWord.index].some(function (item) {
      return item === newWord.index;
    })) {
      console.log('parent is oldWord');
      this.stack.push(oldWord);
    }

    this.stack.push(newWord);
    console.log('STACK:');
    console.log(this.stack);

  }
  console.log('ARCS:');
  console.log(this.arcs);
};
var words = tokenizer.tokenize("Economic news had little effect on financial markets.");


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

