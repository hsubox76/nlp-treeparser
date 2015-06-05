// LSU (list-based search with uniqueness) based on algorithm here:
// http://web.stanford.edu/~mjkay/covington.pdf
var negWords = require('./negationList.js');

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
  var curNode = this.head;
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
  console.log('| ' + results.join(',') + ' |');
};

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
var Tree = function (value) {
  this.value = value;
  this.children = [];
  //this.parent = null;
};

Tree.prototype.addChild = function (value) {
  var child = new Tree(value);
  //child.parent = this;
  this.children.push(child);
  return child;
};

Tree.prototype.removeMe = function () {
  console.log('removing ' + this.word + ' from parent ' + this.parent.word);
  var index = this.parent.children.indexOf(this);
  //this.parent.children.splice(index, 1);
};

// breadth first tree print to console
Tree.prototype.print = function () {
  var queue = new Queue();
  var rows = [];
  var recurse = function (node, depth) {
    if (!rows[depth]) {
      rows[depth] = "";
    }
    //var x = node.parent ? node.parent.value.word : 'null';
    var x = 'x';
    rows[depth] = rows[depth].concat(' [ ' + node.value.word + ' | ' + node.value.tag + ' | ' + x + ' ] ');
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

var simplifyPOS = function (pos) {
  //console.log('simplifying ' + pos);
  var simplePos;

  var posTranslate = {
    'CC': 'conj',
    'PP': 'adj',
    'PP$': 'adj', // possessive pronoun
    'PDT': 'adj', // predeterminer
    'DT': 'adj', // determiner
    'CD': 'adj', // cardinal number
    'JJ': 'adj', // adjective
    'JJR': 'adj', // adj, comparative
    'JJS': 'adj', // adj, superlative
    'NN': 'noun', // noun
    'NNP': 'noun', // proper noun
    'NNPS': 'noun', // plural proper noun
    'NNS': 'noun', // plural noun
    'PRP': 'noun', // personal pronoun
    'RB': 'adv', //adverb
    'MD': 'verb', // modal (can, should)
    'VB': 'verb', // verb base form
    'VBD': 'verb', // verb past tense
    'VBP': 'verb', // verb present
    'VBZ': 'verb', // verb present
    'VBG': 'verb', // gerund - may have to do something special
    'IN': 'prep', // preposition
    'TO': 'prep', // to
    'SYM': 'sym', // +,%,&
    ':': 'sym', // mid-sentence punctuation
    '$': 'sym', // $
    '#': 'sym', // #
    '"': 'quote',
    '(': 'lparen',
    ')': 'rparen',
    'WDT': 'adj', // wh-determiner
    'WP': 'noun', // wh-pronoun
    'WP$': 'adj', // possessive-wh
    'WRB': 'adv', // wh adverb
  };



  // list of POS abbrevs that just return themselves
  // . (end of sentence)
  // , (comma)
  // EX (existential there)
  // FW (foreign word)
  // LS (list item marker)
  // RP (particle)
  // UH (interjection)


  //console.log(simplePos);
  if (posTranslate[pos]) {
    return posTranslate[pos];
  } else {
    return pos;
  }
};

var simplifyTag = function (wordObj) {
  wordObj.tag = simplifyPOS(wordObj.tag);
  return wordObj;
};

var dependsOn = function (word1, word2, dir) {
  dir = dir || 'pre';

  var pos1 = simplifyPOS(word1.tag);
  var pos2 = simplifyPOS(word2.tag);

  if (!pos1) {
    console.log('No POS defined for ' + word1.word);
  }
  if (!pos2) {
    console.log('No POS defined for ' + word2.word);
  }

  // simplified types:
  // adj
  // adv
  // conj
  // noun
  // prep
  // verb
  // ignore for now:
  // quote
  // sym
  // lparen
  // rparen

  var preRelationships = {
    adj: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: 1,
      prep: -1,
      verb: 1,
    },
    adv: {
      adj: -1,
      adv: 1,
      conj: -1,
      noun: -1,
      prep: -1,
      verb: 1,
    },
    conj: {
      adj: 1,
      adv: 1,
      conj: 1,
      noun: 1,
      prep: 1,
      verb: 1,
    },
    noun: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: 1,
      prep: -1,
      verb: 1,
    },
    prep: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: 1,
      prep: -1,
      verb: 1,
    },
    verb: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: -1,
      prep: -1,
      verb: -1,
    },
    ".": {
      adj: 1,
      adv: 1,
      conj: 1,
      noun: 1,
      prep: 1,
      verb: 1,
    }
  };

  var postRelationships = {
    adj: {
      adj: -1,
      adv: 1,
      conj: -1,
      noun: 1,
      prep: -1,
      verb: -1,
    },
    adv: {
      adj: -1,
      adv: 1,
      conj: -1,
      noun: -1,
      prep: -1,
      verb: 1,
    },
    conj: {
      adj: 1,
      adv: 1,
      conj: 1,
      noun: 1,
      prep: 1,
      verb: 1,
    },
    noun: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: -1,
      prep: 1,
      verb: 1,
    },
    prep: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: 1,
      prep: -1,
      verb: 1,
    },
    verb: {
      adj: -1,
      adv: -1,
      conj: -1,
      noun: -1,
      prep: -1,
      verb: 1,
    },
    ".": {
      adj: 1,
      adv: 1,
      conj: 1,
      noun: 1,
      prep: 1,
      verb: 1,
    }
  };

  if (dir === 'pre') {
    if (!preRelationships[pos1]) {
      console.log('No pre relationship found for ' + pos1 + ' to ' + pos2);
    } else {
      return preRelationships[pos1][pos2];
    }
  } else if (dir === 'post') {
    if (!postRelationships[pos1]) {
      console.log('No post relationship found for ' + pos1 + ' to ' + pos2);
    } else {
      return postRelationships[pos1][pos2];
    }
  }
};

var outranks = function (word1, word2) {
  var pos1 = simplifyPOS(word1.tag);
  var pos2 = simplifyPOS(word2.tag);

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
    adv: {
      verb: -1
    },
    ".": {
      verb: 1,
      noun: 1,
      adj: 1,
      prep: 1
    }
  };

  if (!outranks[pos1]) {
    console.log('No rank relationship found for ' + pos1 + ' to ' + pos2);
  } else {
    return outranks[pos1][pos2];
  }
};

var processWords = function (words) {
  var isNeg = false;
  return words.map(function(word, i) {
    isNeg = false;
    if (word[0] in negWords) {
      isNeg = true;
    }
    if (word[0] === "'s") {
      word[1] = 'POS';
    }
    if (word[0] === "n't") {
      word[1] = 'RB';
    }
    if (word[0] === "ca" && words[i+1][0] === "n't") {
      word[0] = "can";
      word[1] = "VB";
    }
    if (i > 0) {
      // like and love should be verbs if they come right after a noun
      if (word[0] === 'like' || word[0] === 'likes' || word[0] === 'love' || word[0] === 'loves' ||
        word[0] === 'liked' || word[0] === 'loved') {
        var prevTag = words[i-1][1];
        if (prevTag === 'NN' || prevTag === 'NNP' || prevTag === 'NNPS' || prevTag === 'NNS' || prevTag === 'PRP') {
          word[1] = 'VB';
        }
      }
    }
    return {word: word[0], tag: word[1], negator: isNeg, negated: false, index: i};
  });
};


var getArcs = function(wordData) {
  var headList = new List();
  var wordList = new List();
  var deps = {};
  var rulesUsed = [];
  var headless = [];

  wordData.forEach(function (w, index) {
    // item = next word to be parsed
    wNode = wordList.addToHead(w);

    var d = headList.head;

    // seeing if this word can be a parent of any preceding words
    while (d) {
      if (dependsOn(d.value, w, 'pre') > 0) {
        rulesUsed.push({
          word1: simplifyTag(d.value),
          word2: simplifyTag(w),
          rule: 'predepend'
        });
        // console.log(d.value.word + ' depends on ' + w.word);
        // headList.print();
        // wordList.print();
        if (deps[w.index]) {
          deps[w.index].push(d.value.index);
        } else {
          deps[w.index] = [d.value.index];
        }
        // console.log('removing ' + d.value.word + ' from headlist');
        headList.remove(d.value);
      } else {
        break;
      }
      d = d.next;
    }

    var h = wordList.head;
    var hFound = false;
    var strikes = 0;

    // seeing if this word is a dependent of any preceding words
    while (h) {
        // console.log('trying to find a head for' + w.word);
        // console.log('trying ' + h.value.word);
        // console.log(dependsOn(w, h.value, 'post'));
      if (h.value.index > w.index - 1) {
        h = h.next;
        continue;
      }
      if (dependsOn(w, h.value, 'post') > 0) {
        rulesUsed.push({
          word1: simplifyTag(w),
          word2: simplifyTag(h.value),
          rule: 'postdepend'
        });
        // console.log(w.word + ' depends on ' + h.value.word);
        // headList.print();
        // wordList.print();
        if (deps[h.value.index]) {
          deps[h.value.index].push(w.index);
        } else {
          deps[h.value.index] = [w.index];
        }
        hFound = true;
        break;
      } else {
        if (outranks(h.value,w) > 0) {
          rulesUsed.push({
            word1: simplifyTag(h.value),
            word2: simplifyTag(w),
            rule: 'outrank'
          });
          // console.log('breaking because ' + h.value.word + ' outranks ' + w.word);
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
  var x = headList.head;
  var root;
  while (x) {
    if (deps[x.value.index]) {
      root = x;
      break;
    }
    x = x.next;
  }
  return { head: root, deps: deps, rules: rulesUsed };
};

// build a tree
var parse = function(wordData) {
  var arcData = getArcs(wordData);
  // find root
  var arcs = arcData.deps;
  var root = arcData.head;
  var tree = new Tree(root.value);
  var inTree = {};
  var headless = [];
  //console.log(root);
  var recurse = function (head, node) {
    if (arcs[head]) {
      arcs[head].forEach( function (dependent) {
        var parent = wordData[head];
        var thisWord = wordData[dependent];
        // parent is negator and not negated
        if (parent.negator === true && parent.negated === false) {
          thisWord.negated = true;
        }
        // parent is negated and not negator
        if (parent.negator === false && parent.negated === true) {
          thisWord.negated = true;
        }
        var newNode = node.addChild(thisWord);
        inTree[wordData[dependent].index] = true;
        if (arcs[dependent]) {
          recurse(dependent, newNode);
        }
      });
    } else {
      //console.log(head);
    }
  };
  recurse(root.value.index, tree);
  wordData.forEach(function (word) {
    if (!inTree[word.index] && word.index !== root.value.index ) {
      console.log('headless word:');
      console.log(word);
      headless.push(simplifyTag(word));
    }
  });
  //tree.print();
  return {tree: tree, rules: arcData.rules, headless: headless };
};

exports.getArcs = getArcs;
exports.parse = parse;
exports.processWords = processWords;
// parse(taggedWords);

