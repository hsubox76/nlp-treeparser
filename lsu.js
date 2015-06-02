var pos = require('pos');

var natural = require('natural'),
  tokenizer = new natural.TreebankWordTokenizer();

var words = tokenizer.tokenize("Economic news had little effect on financial markets.");

var taggedWords = new pos.Tagger().tag(words);

var List = function () {
  this.head = null;
  this.tail = null;
};

var ListNode = function (value) {
  this.value = value;
  this.prev = null;
  this.next = null;
};

List.prototype.addToTail = function (value) {
  var newNode = new ListNode(value);
  if (this.head === null) {
    this.head = newNode;
    this.tail = newNode;
  } else {
    this.tail.next = newNode;
    newNode.prev = this.tail;
    this.tail = newNode;
  }
  return newNode;
};

List.prototype.addToHead = function (value) {
  var newNode = new ListNode(value);
  if (this.head === null) {
    this.head = newNode;
    this.tail = newNode;
  } else {
    this.head.prev = newNode;
    newNode.next = this.head;
    this.head = newNode;
  }
  return newNode;
};

List.prototype.removeHead = function () {
  var headValue = this.head.value;
  this.head = this.head.next;
};

List.prototype.remove = function (value) {
  console.log('value to remove:');
  console.log(value);
  var curNode = this.head;
  console.log(curNode.value.index, value.index);
  while (curNode) {
    if (curNode.value.index === value.index) {
      if (curNode.prev) {
        curNode.prev.next = curNode.next;
      } else {
        this.head = curNode.next;
      }
      if (curNode.next) {
        curNode.next.prev = curNode.prev;
      } else {
        this.tail = curNode.prev;
      }
      curNode = undefined;
      break;
    }
    curNode = curNode.next;
  }
};

List.prototype.print = function () {
  var curNode = this.head;
  var results = [];
  while (curNode) {
    results.push(curNode.value.word);
    curNode = curNode.next;
  }
  console.log(results.join(','));
};

var Tree = function (value) {
  this.value = value;
  this.children = [];
  this.parent = null;
};

Tree.prototype.addChild = function (value) {
  var child = new Tree(value);
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
// test list
// var list = new List();
// list.add(1);
// list.add(2);
// list.add(3);

// var curNode = list.tail;
// while(curNode) {
//   console.log(curNode.value);
//   curNode = curNode.prev;
// }

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

var simplifyPOS = function (pos) {
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

var dependsOn = function (word1, word2) {
  var pos1 = simplifyPOS(word1.tag);
  var pos2 = simplifyPOS(word2.tag);

  var relationships = {
    noun: {
      adj: -1,
      verb: 1,
      prep: -1
    },
    verb: {
      noun: -1,
      adv: -1
    },
    adj: {
      noun: 1
    },
    prep: {
      noun: 1
    },
    ".": {
      verb: 1,
      noun: 1,
      adj: 1,
      prep: 1
    }
  };
  return relationships[pos1][pos2];
};

var outranks = function (word1, word2) {
  var pos1 = simplifyPOS(word1.tag);
  var pos2 = simplifyPOS(word2.tag);

  console.log(pos1, pos2);

  var outranks = {
    noun: {
      adj: 1,
      verb: -1,
      prep: 1,
      adv: 1
    },
    verb: {
      noun: 1,
      adv: 1,
      adj: 1,
      prep: 1
    },
    adj: {
      noun: -1,
      verb: -1,
      adv: 1,
      prep: -1
    },
    prep: {
      noun: 1,
      adj: 1,
      verb: -1,
      adv: 1
    },
    ".": {
      verb: 1,
      noun: 1,
      adj: 1,
      prep: 1
    }
  };

  return outranks[pos1][pos2];
};


var headList = new List();
var wordList = new List();
var deps = {};

// fill both lists with words
// taggedWords.forEach(function (item) {
//   headList.addToHead(item);
//   wordList.addToHead(item);
// });

taggedWords.forEach(function (w, index) {
  // item = next word to be parsed
  wNode = wordList.addToHead(w);

  var d = headList.head;

  while (d) {
    console.log('---------');
    console.log('trying to find a head for ' + d.value.word);
    if (dependsOn(d.value, w) > 0) {
      console.log(d.value.word + ' depends on ' + w.word);
      headList.print();
      wordList.print();
      if (deps[w.index]) {
        deps[w.index].push(d.value.index);
      } else {
        deps[w.index] = [d.value.index];
      }
      console.log('removing ' + d.value.word + ' from headlist');
      headList.remove(d.value);
      headList.print();
    } else {
      break;
    }
    d = d.next;
  }

  var h = wordList.head;
  var hFound = false;
  var strikes = 0;

  while (h) {
    console.log('---------');
    console.log('trying to find a head for ' + w.word);
    console.log('checking against ' + h.value.word);
    if (h.value.index > w.index - 1) {
      h = h.next;
      continue;
    }
    if (dependsOn(w, h.value) > 0) {
      console.log(w.word + ' depends on ' + h.value.word);
      headList.print();
      wordList.print();
      if (deps[h.value.index]) {
        deps[h.value.index].push(w.index);
      } else {
        deps[h.value.index] = [w.index];
      }
      hFound = true;
      break;
    } else {
      if (outranks(h.value,w) > 0) {
        console.log(outranks(h.value, w));
        console.log('breaking because ' + h.value.word + ' outranks ' + w.word);
        break;
      }
    }
    h = h.next;
  }

  if (!hFound) {
    headList.addToHead(w);
  }
});

console.log(deps);
