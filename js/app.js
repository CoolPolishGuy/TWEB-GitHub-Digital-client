const margin = {
  top: 20, right: 200, bottom: 100, left: 50,
};
const margin2 = {
  top: 430, right: 10, bottom: 20, left: 40,
};
const width = 1300 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 500 - margin2.top - margin2.bottom;

const parseDate = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');

const xScale = d3.scaleUtc()
  .range([0, width]);

const xScale2 = d3.scaleUtc()
  .range([0, width]); // Duplicate xScale for brushing ref later

const yScale = d3.scaleLinear()
  .range([height, 0]);

const color = d3.scaleOrdinal().range(['#48A36D', '#7FC9BD', '#80A8CE', '#9788CD', '#B681BE']);

const xAxis = d3.axisBottom()
  .scale(xScale);


const xAxis2 = d3.axisBottom() // xAxis for brush slider
  .scale(xScale2);

const yAxis = d3.axisLeft()
  .scale(yScale);

const line = d3.line()
  .curve(d3.curveBasisOpen)
  .x((d => xScale(d.date)))
  .y((d => yScale(d.rating)))
  .defined((d => d.rating)); // Hiding line value defaults of 0 for missing data

let maxY; // Defined later to update yAxis

const svg = d3.select('#chart').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Create invisible rect for mouse tracking
svg.append('rect')
  .attr('width', width)
  .attr('height', height)
  .attr('x', 0)
  .attr('y', 0)
  .attr('id', 'mouse-tracker')
  .style('fill', 'white');

const context = svg.append('g') // Brushing context box container
  .attr('transform', `translate(${0},${410})`)
  .attr('class', 'context');

svg.append('defs')
  .append('clipPath')
  .attr('id', 'clip')
  .append('rect')
  .attr('width', width)
  .attr('height', height);

function findMaxY(data) { // Define function "findMaxY"
  const maxYValues = data.map((d) => {
    if (d.visible) {
      return d3.max(d.values, value => // Return max rating value
        value.rating);
    }
    return undefined;
  });
  return d3.max(maxYValues);
}

d3.csv('data/data_all.csv', (error, data) => {
  color.domain(d3.keys(data[0]).filter(key => key !== 'date'));

  data.forEach((d) => { // Make every date in the csv data a javascript date object format
    d.date = parseDate(d.date);
  });

  const categories = color.domain().map(name => ({
    name, // "name": the csv headers except date
    values: data.map(d => ({
      date: d.date,
      rating: +(d[name]),
    })),
    visible: (name === 'BTC'), // "visible": all false except for economy which is true.
  }));

  xScale.domain(d3.extent(data, d => d.date)); // extent = highest and lowest points,

  const maxValue = d3.max(data, d => parseFloat(d.BTC));
  yScale.domain([0, maxValue]);

  xScale2.domain(xScale.domain()); // Setting a duplicate xdomain for brushing reference later
  const issue = svg.selectAll('.issue')
    .data(categories) // Select nested data and append to new svg group elements
    .enter().append('g')
    .attr('class', 'issue');

  issue.append('path')
    .attr('class', 'line')
    .style('pointer-events', 'none') // Stop line interferring with cursor
    .attr('id', d =>
      `line-${d.name.replace(' ', '').replace('/', '')}`)
    .attr('d', d => (d.visible ? line(d.values) : null))
    .attr('clip-path', 'url(#clip)')
    .style('stroke', d => color(d.name));
  // for brusher of the slider bar at the bottom
  function brushed() {
    xScale.domain(d3.event.selection.map(xScale2.invert, xScale2));

    svg.select('.x.axis') // replot xAxis with transition when brush used
      .transition()
      .call(xAxis);

    maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
    yScale.domain([0, maxY]); // Redefine yAxis domain based on highest y

    svg.select('.y.axis') // Redraw yAxis
      .transition()
      .call(yAxis);

    issue.select('path') // Redraw lines based on brush xAxis scale and domain
      .transition()
      .attr('d', d => (d.visible ? line(d.values) : null));
  }


  const brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on('brush', brushed);

  context.append('g') // Create brushing xAxis
    .attr('class', 'x axis1')
    .attr('transform', `translate(0,${height2})`)
    .call(xAxis2);

  const contextArea = d3.area() // Set attributes for area chart in brushing context graph
    .x(d => xScale2(d.date)) // x is scaled to xScale2
    .y0(height2) // Bottom line begins at height2 (area chart not inverted)
    .y1(0); // Top line of area, 0 (area chart not inverted)

  // plot the rect as the bar at the bottom
  context.append('path') // Path is created using svg.area details
    .attr('class', 'area')
    .attr('d', contextArea(categories[0].values))
    .attr('fill', '#F1F1F2');

  context.append('g')
    .attr('class', 'x brush')
    .call(brush);

  // draw line graph
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('x', -10)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text('Issues Rating');
  // draw legend
  const legendSpace = 450 / categories.length; // 450/number of issues (ex. 40)

  issue.append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('x', (width + (margin.right / 3)) - 15)
    .attr('y', (d, i) => ((legendSpace) + (i * (legendSpace))) - 8) // spacing
    .attr('fill', d =>
      (d.visible ? color(d.name) : '#F1F1F2'))
    .attr('class', 'legend-box')

    .on('click', (d) => { // On click make d.visible
      d.visible = !d.visible;

      maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
      yScale.domain([0, maxY]);
      svg.select('.y.axis')
        .transition()
        .call(yAxis);

      issue.select('path')
        .transition()
        .attr('d', d =>
          (d.visible ? line(d.values) : null));

      issue.select('rect')
        .transition()
        .attr('fill', d => (d.visible ? color(d.name) : '#F1F1F2'));
    });

  issue.append('text')
    .attr('x', width + (margin.right / 3))
    .attr('y', (d, i) => (legendSpace) + (i * legendSpace)) // (return (11.25/2 =) 5.625) + i * (5.625)
    .text(d => d.name);
}); // End Data callback function
