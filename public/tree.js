var getParsedTreeData = function(sentence) {  
  var query = {sentence: sentence};
  $.ajax({
    url: 'parse',
    dataType: 'json',
    type: 'POST',
    data: query,
    success: function(data) {
      console.log('got data');
      drawGraph(data);
    },
    error: function(xhr, status, err) {
      console.log(status);
    }
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

  var cont = d3.select('body').append('div')
    .attr('id', 'container');;
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