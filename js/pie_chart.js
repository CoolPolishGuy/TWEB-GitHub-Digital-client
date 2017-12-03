const siteDropdown = d3.select('#pie').append('div')
  .attr('class', 'site-dropdown')
  .append('select');

let svg5 = d3.select('#pie').append('svg')
  .attr('class', 'pie-chart')
  .attr('height', 600)
  .attr('width', 800);

let width5 = +svg5.attr('width');
let height5 = +svg5.attr('height');
let radius = 520 / 2;
let g = svg5.append('g').attr('transform', `translate(${width5 / 2},${height5 / 2})`);

const path = d3.arc()
  .outerRadius(radius - 30)
  .innerRadius(75);

const label = d3.arc()
  .outerRadius(radius + 20)
  .innerRadius(radius + 10);

const pie = d3.pie()
  .value(d => d.count);

const color1 = d3.scaleOrdinal(['#00ff99', '#ff3399']);
// Define the div for the tooltip
const div = d3.select('body').append('div')
  .attr('class', 'tooltip');

function mouseover() {
  div.transition()
    .duration(500)
    .style('opacity', 0.9);
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform', (d) => {
      const dist = 15;
      d.midAngle = ((d.endAngle - d.startAngle) / 2) + d.startAngle;
      const x = Math.sin(d.midAngle) * dist;
      const y = -Math.cos(d.midAngle) * dist;
      return `translate(${x},${y})`;
    });
}

function mousemove() {
  div
    .html(`Average price: <br/>${Math.round(this.current.value * 100) / 100} $`)
    .style('left', `${d3.event.pageX}px`)
    .style('top', `${(d3.event.pageY) + 20}px`);
}

function mouseout() {
  div.transition()
    .duration(500)
    .style('opacity', 0);
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform', 'translate(0,0)');
}
function buildGraph(res) {
  const arc = g.selectAll('.arc')
    .data(pie(res))
    .enter().append('g')
    .attr('class', 'arc');

  arc.append('path')
    .attr('d', path)
    .attr('fill', d => color1(d.data.count))
    .transition()
    .delay((d, i) => i * 250)
    .duration(250)
    .attrTween('d', (d) => {
      const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
      return function (t) {
        d.endAngle = i(t);
        return path(d);
      };
    });

  arc.each(function (d) { this.current = d; })
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);

  arc.append('text')
    .attr('transform', d => `translate(${label.centroid(d)})`)
    .attr('dy', '0.35em')
    .transition()
    .delay(500)
    .text(d => d.data.label);
}

function updatePieChart() {
  d3.selectAll('.pie-chart').remove();

  svg5 = d3.select('#pie').append('svg')
    .attr('class', 'pie-chart')
    .attr('height', 600)
    .attr('width', 800);

  width5 = +svg5.attr('width');
  height5 = +svg5.attr('height');
  radius = 520 / 2;
  g = svg5.append('g').attr('transform', `translate(${width5 / 2},${height5 / 2})`);

  const repartition = this.options[this.selectedIndex].value;
  const crypto = repartition.substring(0, repartition.indexOf(','));
  const stock = repartition.substring(repartition.indexOf(',') + 1, repartition.length);
  const res = [
    { label: 'crypto', count: parseFloat(crypto) },
    { label: 'stock', count: parseFloat(stock) },
  ];

  buildGraph(res);
}

d3.csv('data/moyenne_crypto_stock.csv', d => ({
  date: d.date,
  values: [+d.Crypto, +d.Stock],
}), (error, data) => {
  siteDropdown.selectAll('option')
    .data(data)
    .enter()
    .append('option')
    .property('selected', d => d.date === '2015-08')
    .attr('value', d => d.values)
    .text(d => d.date);

  const res = [
    { label: 'crypto', count: parseFloat(data[0].values[0]) },
    { label: 'stock', count: parseFloat(data[0].values[1]) },
  ];

  buildGraph(res);

  d3.selectAll('.site-dropdown')
    .selectAll('select')
    .on('change', updatePieChart);
});
