
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
const bisectDate = d3.bisector((d => d.date)).left;

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

  const brushElem = context.append('g')
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

  // draw legend
  const legendSpace = 450 / categories.length; // 450/number of issues (ex. 40)

  issue.append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('x', width + (margin.right / 3) - 15)
    .attr('y', (d, i) => (legendSpace) + i * (legendSpace) - 8) // spacing
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
    })

    .on('mouseover', (d) => {
      d3.select(this)
        .transition()
        .attr('fill', d => color(d.name));

      d3.select(`#line-${d.name.replace(' ', '').replace('/', '')}`)
        .transition()
        .style('stroke-width', 2.5);
    })

    .on('mouseout', (d) => {
      d3.select(this)
        .transition()
        .attr('fill', d => (d.visible ? color(d.name) : '#F1F1F2'));

      d3.select(`#line-${d.name.replace(' ', '').replace('/', '')}`)
        .transition()
        .style('stroke-width', 1.5);
    });

  issue.append('text')
    .attr('x', width + (margin.right / 3))
    .attr('y', (d, i) => (legendSpace) + i * (legendSpace)) // (return (11.25/2 =) 5.625) + i * (5.625)
    .text(d => d.name);

  // Hover line
  const hoverLineGroup = svg.append('g')
    .attr('class', 'hover-line');

  const hoverLine = hoverLineGroup // Create line with basic attributes
    .append('line')
    .attr('id', 'hover-line')
    .attr('x1', 10).attr('x2', 10)
    .attr('y1', 0)
    .attr('y2', height + 10)
    .style('pointer-events', 'none') // Stop line interferring with cursor
    .style('opacity', 1e-6); // Set opacity to zero

  const hoverDate = hoverLineGroup
    .append('text')
    .attr('class', 'hover-text')
    .attr('y', height - (height - 40)) // hover date text position
    .attr('x', width - 150) // hover date text position
    .style('fill', '#E6E7E8');

  const columnNames = d3.keys(data[0]) // grab the key values from your first data row
    // these are the same as your column names
    .slice(1); // remove the first column name (`date`);

  // Add mouseover events for hover line.
  d3.select('#mouse-tracker') // select chart plot background rect #mouse-tracker
    .on('mousemove', mousemove) // on mousemove activate mousemove function defined below
    .on('mouseout', () => {
      hoverDate
        .text(null); // on mouseout remove text for hover date

      d3.select('#hover-line')
        .style('opacity', 1e-6); // On mouse out making line invisible
    });

  function mousemove() {
    const mouseX = d3.mouse(this)[0]; // Finding mouse x position on rect
    const graphX = xScale.invert(mouseX);

    const format = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');

    hoverDate.text(format(graphX));

    d3.select('#hover-line') // select hover-line and changing attributes to mouse position
      .attr('x1', mouseX)
      .attr('x2', mouseX)
      .style('opacity', 1); // Making line visible

    const x0 = xScale.invert(d3.mouse(this)[0]);
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
  }

  // for brusher of the slider bar at the bottom
  function brushed() {
    const selection = d3.event.selection;
    xScale.domain(selection.map(xScale2.invert, xScale2));

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
}); // End Data callback function

function findMaxY(data) { // Define function "findMaxY"
  const maxYValues = data.map((d) => {
    if (d.visible) {
      return d3.max(d.values, value => // Return max rating value
        value.rating);
    }
  });
  return d3.max(maxYValues);
}
