var site_dropdown = d3.select("#pie").append("div")
  .attr("class", "site-dropdown")
  .append("select");

var svg5 = d3.select("#pie").append("svg")
  .attr("class", "pie-chart")
  .attr('height', 600)
  .attr('width', 800);

var width5 = +svg5.attr("width");
var height5 = +svg5.attr("height");
var radius = 520 / 2;
var g = svg5.append("g").attr("transform", "translate(" + width5 / 2 + "," + height5 / 2 + ")");

var path = d3.arc()
  .outerRadius(radius - 30)
  .innerRadius(75);

var label = d3.arc()
  .outerRadius(radius + 20)
  .innerRadius(radius + 10);

var pie = d3.pie()
  .value(function (d) { return d.count; });;

var color1 = d3.scaleOrdinal(["#00ff99", "#ff3399"]);
// Define the div for the tooltip
var div = d3.select("body").append("div")
  .attr("class", "tooltip")

d3.csv("../data/moyenne_crypto_stock.csv", function (d) {
  return {
    date: d.date,
    values: [+d.Crypto, +d.Stock]
  };
}, function (error, data) {

  site_dropdown.selectAll("option")
    .data(data)
    .enter()
    .append("option")
    .property("selected", function (d) { return d.date == '2015-08'; })
    .attr("value", function (d) { return d.values; })
    .text(function (d) { return d.date; });

  var res = [
    { label: 'crypto', count: parseFloat(data[0].values[0]) },
    { label: 'stock', count: parseFloat(data[0].values[1]) }
  ]

  buildGraph(res)

  d3.selectAll(".site-dropdown")
    .selectAll("select")
    .on("change", updatePieChart);
});

function buildGraph(res) {
  var arc = g.selectAll(".arc")
    .data(pie(res))
    .enter().append("g")
    .attr("class", "arc");

  arc.append("path")
    .attr("d", path)
    .attr("fill", function (d) { return color1(d.data.count); })
    .transition().delay(function (d, i) {
      return i * 250;
    })
    .duration(250)
    .attrTween('d', function (d) {
      var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
      return function (t) {
        d.endAngle = i(t);
        return path(d)
      }
    });

  arc.each(function (d) { this._current = d; })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);

  arc.append("text")
    .attr("transform", function (d) { return "translate(" + label.centroid(d) + ")"; })
    .attr("dy", "0.35em")
    .transition()
    .delay(500)
    .text(function (d) { return d.data.label; });
}


function updatePieChart() {


  d3.selectAll(".pie-chart").remove()

  svg5 = d3.select("#pie").append("svg")
    .attr("class", "pie-chart")
    .attr('height', 600)
    .attr('width', 800);

  width5 = +svg5.attr("width");
  height5 = +svg5.attr("height");
  radius = 520 / 2;
  g = svg5.append("g").attr("transform", "translate(" + width5 / 2 + "," + height5 / 2 + ")");

  let repartition = this.options[this.selectedIndex].value;
  let crypto = repartition.substring(0, repartition.indexOf(','))
  let stock = repartition.substring(repartition.indexOf(',') + 1, repartition.length)
  let res = [
    { label: 'crypto', count: parseFloat(crypto) },
    { label: 'stock', count: parseFloat(stock) }
  ]

  buildGraph(res)
}
















function mouseover() {
  div.transition()
    .duration(500)
    .style("opacity", .9);
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform', function (d) {
      var dist = 15;
      d.midAngle = ((d.endAngle - d.startAngle) / 2) + d.startAngle;
      var x = Math.sin(d.midAngle) * dist;
      var y = -Math.cos(d.midAngle) * dist;
      return 'translate(' + x + ',' + y + ')';
    });
}

function mousemove() {
  div
    .html("Average price: <br/>" + Math.round(this._current.value * 100) / 100 + " $")
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY) + 20 + "px");
}

function mouseout() {
  div.transition()
    .duration(500)
    .style("opacity", 0);
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform', 'translate(0,0)');
}
