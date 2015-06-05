var getParsedTreeData = function(sentence) {  
  var query = {sentence: sentence};
  $.ajax({
    url: 'parse',
    dataType: 'json',
    type: 'POST',
    data: query,
    success: function(data) {
      console.log('got data');
      $('.rulesBox').addClass('visible');
      $('.rulesBox').removeClass('notVisible');

      $('#treesvg').remove();
      drawGraph(data.tree);
      $('.rulesForm').empty();
      displayRules(data.rules, data.headless);
    },
    error: function(xhr, status, err) {
      console.log(status);
    }
  });

};

var handleSubmit = function (rules, headless) {
  var inputs = $('.rulesForm').find('input');
  var badRules = [];
  var headlessWords = [];
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type === 'checkbox' && inputs[i].checked) {
      badRules.push(rules[i]);
    }
    if (inputs[i].type === 'text' && inputs[i].value !== '') {
      var ind = +inputs[i].id.split('word')[1];
      headlessWords.push([headless[ind]], inputs[i].value);
    }
  }
  var sentence = $('#sentence-input').val();
  var dataToSend = {
    sentence: sentence,
    badRules: badRules,
    headlessWords: headlessWords
  };
  if (badRules.length > 0 || headlessWords.length > 0) {
    $.ajax({
      url: 'feedback',
      type: 'POST',
      data: dataToSend,
      success: function(data) {
        console.log(data);
      },
      error: function(status, err) {
        console.log(err);
      }
    });
  }
};

var displayRules = function(rules, headless) {

  $('.rulesForm').append('<div class="rule cf ruleHeader">Rules Used</div>');

  // display rules
  rules.forEach(function (rule, i) {
    var verb = "depends on";
    var ruleString = '<div class="ruleField ruleType">';
    if (rule.rule === 'predepend') {
      ruleString += '[PRE]';
    } else if (rule.rule === 'postdepend') {
      ruleString += '[POST]';
    } else if (rule.rule === 'outrank') {
      ruleString += '[OUTR]';
      verb = "outranks";
    }
    ruleString += '</div><div class="ruleField ruleWord">' + rule.word1.word + ' (' + rule.word1.tag + ')</div>';
    ruleString += '<div class="ruleField ruleVerb">' + verb + '</div>';
    ruleString += '<div class="ruleField ruleWord">' + rule.word2.word + ' (' + rule.word2.tag + ')</div>';
    ruleString += '<div class="ruleField wrongBox">wrong? <input type="checkbox" id="cb' + i +'"></div>';
    var $newRow = $('<div></div>')
      .addClass('rule')
      .addClass('cf')
      .html(ruleString)
      .data("rule", rule);
    $('.rulesForm').append($newRow);
  });

  $('.rulesForm').append('<div class="rule cf ruleHeader">Words with no head:</div>');

  // display headless words
  headless.forEach(function (word, i) {
    var hString = '<div class="ruleField headless-word">';
    hString += word.word + ' (' + word.tag + ')</div>';
    hString += '<div class="ruleField headless-text">head should be</div>';
    hString += '<div class="ruleField input-cont"><input type="text" id="word' + i + '" placeholder="choose a word from the sentence" /></div>';

    var $headlessRow = $('<div></div>')
      .addClass('rule')
      .addClass('cf')
      .html(hString);
    $('.rulesForm').append($headlessRow);
  });


  // SEND button
  $sendButton = $('<button>Send Feedback</button>').addClass('send-button');
  $('.rulesForm').append($sendButton);

  // call event handler for send button
  $('.rulesForm').submit(function (event) {
    event.preventDefault();
    handleSubmit(rules, headless);
  });
};

var drawGraph = function (treeData) {
    //JSON object with the data
    treeData = treeData || {"name" : "A", "info" : "tst", "children" : [
          {"name" : "A1" },
          {"name" : "A2" },
          {"name" : "A3", "children": [
                {"name" : "A31", "children" :[
          {"name" : "A311" },
          {"name" : "A312" }
  ]}] }
    ]};

  var cont = d3.select('div#container');
  var svg = cont.append('svg')
    .attr('width', 600)
    .attr('height', 300)
    .attr('id', 'treesvg');

  var tree = d3.layout.tree().size([600,220]);

  var nodes = tree.nodes(treeData);
  var links = tree.links(nodes);

  var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.x, d.y+35]; });


  var link = svg.selectAll("pathlink")
    .data(links)
    .enter().append("svg:path")
    .attr("class", "link")
    .attr("d", diagonal);

  var node = svg.selectAll("g.node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + (d.y + 35) + ")";
    });

  node.append("circle")
    .attr("r", 25);

  node.append("text")
    .attr("dy", "-0.2em")
    .attr("text-anchor", "middle")
    .text(function (d) { return d.value.word; });

  node.append("text")
    .attr("dy", ".8em")
    .attr("text-anchor", "middle")
    .text(function (d) { return "(" + d.value.tag + ")"; });
};

var handleParseRequest = function(event) {
  event.preventDefault();
  var textToParse = document.getElementById('sentence-input').value;
  getParsedTreeData(textToParse);
};

var init = function () {
  var button = document.getElementById('graph-button');
  button.addEventListener('click', handleParseRequest);
};

init();