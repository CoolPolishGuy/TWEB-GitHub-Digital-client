const margin4 = { top: 8, right: 10, bottom: 2, left: 10 };
const width3 = 960 - margin4.left - margin4.right;
const height3 = 69 - margin4.top - margin4.bottom;

const parseDate3 = d3.timeParse('%b %Y');

const x = d3.scaleLinear()
  .range([0, width3]);

const y = d3.scaleLinear()
  .range([height3, 0]);

const area = d3.area()
  .x((d) => { return x(d.date); })
  .y0(height3)
  .y1((d) => { return y(d.price); });

const line3 = d3.line()
  .x((d) => { return x(d.date); })
  .y((d) => { return y(d.price); });

d3.csv('data/final_dataSet_test.csv', type, (error, data) => {

  const symbols = d3.nest()
    .key((d) => { return d.symbol; })
    .entries(data);

    // Compute the maximum price per symbol, needed for the y-domain.
  symbols.forEach((s) => {
    s.maxPrice = d3.max(s.values, (d) => { return d.price; });
  });

  // Compute the minimum and maximum date across symbols.
  // We assume values are sorted by date.
  x.domain([
    d3.min(symbols, (s) => { return s.values[0].date; }),
    d3.max(symbols, (s) => { return s.values[s.values.length - 1].date; })
  ]);

  // Add an SVG element for each symbol, with the desired dimensions and margin.
  const svg = d3.select('#chart2').selectAll('svg')
    .data(symbols)
    .enter().append('svg')
    .attr('width', width3 + margin4.left + margin4.right)
    .attr('height', height3 + margin4.top + margin4.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin4.left + ',' + margin4.top + ')');

    // Add the area path elements. Note: the y-domain is set per element.
    svg.append('path')
        .attr('class', 'area')
        .attr('d', (d) => { y.domain([0, d.maxPrice]); return area(d.values); });

    // Add the line path elements. Note: the y-domain is set per element.
    svg.append('path')
        .attr('class', 'line2')
        .attr('d', (d) => { y.domain([0, d.maxPrice]); return line3(d.values); });

    // Add a small label for the symbol name.
    svg.append('text')
        .attr('x', width3 - 6)
        .attr('y', height3 - 6)
        .style('text-anchor', 'end')
        .text((d) => { return d.key; });
});

function type(d) {
    d.price = +d.price;
    d.date = parseDate3(d.date);
    return d;
}