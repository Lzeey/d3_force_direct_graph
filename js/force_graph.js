// Function for drawing a force-directed graph to represent browsing activities to new destinations.
// The data filtering function will then search for other users that browses to the same destinations (but without showing their own ND's to avoid cluttering the graph)
// Nodes represent either user or domain
// Links weights are the counts 

// v1.0: Written on 26 Nov 16 by Zeyi. Based on Mike Bostock's original at http://bl.ocks.org/mbostock/4600693
// TODO: Show symbol of domain on circle
// TODO: Allow user to switch links to traffic load
// TODO: Use different symbol/style for users
// TODO: Include mouse-over info
// TODO: Include legend on categories
// TODO: Include custom data filtering
function force_graph(div_id) {
    "use strict";

    var curDate, curUser, dayData;
    
    var div = d3.select(div_id),
        width = +div.attr("width"),
        height = +div.attr("height"),
        dot_radius = 5;
    
    var svg = div.append("svg")
                 .attr("width", width)
                 .attr("height", height);
    
    var tooltip = d3.select('body').append('div')
                .attr('class','tooltipdiv')
                .style("opacity", 0);
    
    var color = d3.scaleOrdinal(d3.schemeCategory20); //Specify category data here for color mapping
    
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().distance(10).strength(0.5))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
    
    // TODO: Perform data transformation here
    // For reference, current data format is nodes (array of objects, each object has group, id)
    // 
    graph();
    function graph() {
        d3.json("miserables.json", function(error, graph) {
            if (error) throw error;

            var nodes = graph.nodes,
              nodeById = d3.map(nodes, function(d) { return d.id; }),
              links = graph.links,
              bilinks = [];

            links.forEach(function(link) {
            var s = link.source = nodeById.get(link.source),
                t = link.target = nodeById.get(link.target),
                i = {}; // intermediate node
            nodes.push(i);
            links.push({source: s, target: i}, {source: i, target: t});
            bilinks.push([s, i, t]);
            });

            var link = svg.selectAll(".link")
            .data(bilinks)
            .enter().append("path")
              .attr("class", "link");

            var node = svg.selectAll(".node")
            .data(nodes.filter(function(d) { return d.id; }))
            .enter().append("circle")
              .attr("class", "node")
              .attr("r", dot_radius)
              .attr("fill", function(d) { return color(d.group); })
              .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended));

            node.on("mouseover", mouseOverHandle)
              .on("mouseout", mouseOutHandle);

            // TODO: Remove this portion if don't want browser tooltip
            node.append("title") //TODO: Edit this
              .text(function(d) { return d.id; });

            simulation
              .nodes(nodes)
              .on("tick", ticked);

            simulation.force("link")
              .links(links);

            function ticked() {
            link.attr("d", positionLink);
            node.attr("transform", positionNode);
            }
        });
    }
    
    function positionLink(d) {
      return "M" + d[0].x + "," + d[0].y
           + "S" + d[1].x + "," + d[1].y
           + " " + d[2].x + "," + d[2].y;
    }

    function positionNode(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x, d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x, d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null, d.fy = null;
    }
    
    //Define mouseover events here for tooltips
    function mouseOverHandle(d) {
        tooltip.transition()
        .duration(200)
        .style('opacity',0.9);
        tooltip.html(sprintf('ID: %s<br/>',d.id))
        .style('left', d3.event.pageX + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');

        d3.select(this)
        .attr('r',dot_radius*2)
        .style('fill','red');
    }

    function mouseOutHandle(d) {
        tooltip.transition()
        .duration(400)
        .style('opacity',0);

        d3.select(this)
        .attr('r',dot_radius)
        .style('fill', function(d) { return color(d.group); });
    }
    
    return graph;
}