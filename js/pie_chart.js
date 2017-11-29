

var site_dropdown = d3.select("#pie").append("div")
 .attr("class", "site-dropdown")
 .append("select");

d3.csv("../data/moyenne_crypto_stock.csv", function(d) {
  return {
    date: d.date,
    values: [+d.Crypto, +d.Stock]
  };
}, function(error, data) {

site_dropdown.selectAll("option")
  .data(data)
  .enter()
  .append("option")
  .property("selected", function (d) { return d.date == '2015-08'; })
  .attr("value", function (d) { return d.values; })
  .text(function (d) { return d.date; });










  var svg5 = d3.select("#pie").append("svg")
  .attr("class", "pie-chart")
  .attr('height',520)
  .attr('width',520);
  
  width5 = +svg5.attr("width"),
  height5 = +svg5.attr("height"),
  radius = Math.min(width5, height5) / 2,
  g = svg5.append("g").attr("transform", "translate(" + width5 / 2 + "," + height5 / 2 + ")");
  
  var pie = d3.pie()
    .value(function(d) { return d.count; });  ;
  
  var path = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);
  
  var label = d3.arc()
    .outerRadius(radius - 60)
    .innerRadius(radius - 100);
  
  
    let color = d3.scaleOrdinal(["#00ff99", "#ff3399"]);
 
    let res = [
      { label: 'crypto', count: parseFloat(data[0].values[0]) }, 
      { label: 'stock', count: parseFloat(data[0].values[1])}
    ]
  
    var arc = g.selectAll(".arc")
    .data(pie(res))
    .enter().append("g")
      .attr("class", "arc");
  
    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { return color(d.data.count); });
  
    
    arc.append("text")
    .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
    .attr("dy", "0.35em")
    .text(function(d) { return d.data.label; });  







d3.selectAll(".site-dropdown")
    .selectAll("select")
    .on("change", updatePieChart);
});




function updatePieChart() {


d3.selectAll(".pie-chart").remove()
  
var svg5 = d3.select("#pie").append("svg")
.attr("class", "pie-chart")
.attr('height',520)
.attr('width',520);

width5 = +svg5.attr("width"),
height5 = +svg5.attr("height"),
radius = Math.min(width5, height5) / 2,
g = svg5.append("g").attr("transform", "translate(" + width5 / 2 + "," + height5 / 2 + ")");

var pie = d3.pie()
  .value(function(d) { return d.count; });  ;

var path = d3.arc()
  .outerRadius(radius - 10)
  .innerRadius(0);

var label = d3.arc()
  .outerRadius(radius - 60)
  .innerRadius(radius - 100);


  let color = d3.scaleOrdinal(["#00ff99", "#ff3399"]);
  let repartition = this.options[this.selectedIndex].value;
  let crypto = repartition.substring(0,repartition.indexOf(','))
  let stock = repartition.substring(repartition.indexOf(',') + 1,repartition.length)
  let res = [
    { label: 'crypto', count: parseFloat(crypto) }, 
    { label: 'stock', count: parseFloat(stock)}
  ]

  var arc = g.selectAll(".arc")
  .data(pie(res))
  .enter().append("g")
    .attr("class", "arc");

  arc.append("path")
      .attr("d", path)
      .attr("fill", function(d) { return color(d.data.count); });

  
  arc.append("text")
  .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
  .attr("dy", "0.35em")
  .text(function(d) { return d.data.label; });  
  }