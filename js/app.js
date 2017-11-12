/*d3.csv('data/data_BTC.csv', (data =>   {
    dataset = data.map((d => { return [ d["price"], +new Date(d["date"]) ]; }));
   //var format = d3.time.format("%y-%m-%d");
    console.log(dataset)
}));*/


let margin = {top: 20, right: 50, bottom: 30, left: 50};
let width = 960 - margin.left - margin.right;
let height = 500 - margin.top - margin.bottom;

let parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
let bisectDate = d3.bisector(function(d) { return d.date; }).left;
let formatValue = d3.format(",.2f");
let formatCurrency = function(d) { return "$" + formatValue(d); };

const x = d3.scaleUtc()
  .range([0, width]);

const y = d3.scaleLinear()
  .range([height, 0]);

const xAxis = d3.axisBottom()
  .scale(x);

const yAxis = d3.axisLeft()
  .scale(y);

const line = d3.line()
  .x(function(d) { return x(d.date); })
  .y(function(d) { return y(d.price); });

let svg = d3.select('#chart').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv('data/data_BTC.csv', function(error, data) {
    if (error) throw error;

    data.forEach(function (d) {
        d.date = parseDate(d.date);
        d.price = +d.price;
    });

    data.sort(function (a, b) {
        return a.date - b.date;
    });

    x.domain([data[0].date, data[data.length - 1].date]);
    y.domain(d3.extent(data, function (d) { return d.price; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)");

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 4.5);

    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function () { focus.style("display", null); })
        .on("mouseout", function () { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d.price) + ")");
        focus.select("text").text(formatCurrency(d.price));
    }
});
