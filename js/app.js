const margin = { top: 20, right: 200, bottom: 100, left: 50 };
const margin2 = { top: 430, right: 10, bottom: 20, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 500 - margin2.top - margin2.bottom;

const parseDate = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');
const bisectDate = d3.bisector(((d) => { return d.date; })).left;

const xScale = d3.scaleUtc()
  .range([0, width]);

const xScale2 = d3.scaleUtc()
  .range([0, width]); // Duplicate xScale for brushing ref later

const yScale = d3.scaleLinear()
  .range([height, 0]);

// 40 Custom DDV colors 
const color = d3.scaleOrdinal().range(['#48A36D', '#7FC9BD', '#80A8CE', '#9788CD', '#B681BE']);


const xAxis = d3.axisBottom()
  .scale(xScale);


const xAxis2 = d3.axisBottom() // xAxis for brush slider
  .scale(xScale2);

const yAxis = d3.axisLeft()
  .scale(yScale);

const line = d3.line()
  .curve(d3.curveBasisOpen)
  .x(((d) => { 
    return xScale(d.date); 
  }))
  .y(((d) => { return yScale(d.rating); }))
  .defined(((d) => { return d.rating; }));  // Hiding line value defaults of 0 for missing data

let maxY; // Defined later to update yAxis

const svg = d3.select('#chart').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom) //height + margin.top + margin.bottom
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Create invisible rect for mouse tracking
svg.append('rect')
  .attr('width', width)
  .attr('height', height)
  .attr('x', 0)
  .attr('y', 0)
  .attr('id', 'mouse-tracker')
  .style('fill', 'white');

//for slider part-----------------------------------------------------------------------------------

const context = svg.append('g') // Brushing context box container
  .attr('transform', 'translate(' + 0 + ',' + 410 + ')')
  .attr('class', 'context');

//append clip path for lines plotted, hiding those part out of bounds
svg.append('defs')
  .append('clipPath')
  .attr('id', 'clip')
  .append('rect')
  .attr('width', width)
  .attr('height', height);

//end slider part----------------------------------------------------------------------------------- 

d3.csv('data/data_all.csv',  (error, data) => {
  color.domain(d3.keys(data[0]).filter((key) =>{ // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
    return key !== 'date';
  }));

  data.forEach((d) => { // Make every date in the csv data a javascript date object format
    d.date = parseDate(d.date);
  });

  const categories = color.domain().map((name) => { // Nest the data into an array of objects with new keys

    return {
      name: name, // "name": the csv headers except date
      values: data.map((d) => { // "values": which has an array of the dates and ratings
        return {
          date: d.date,
          rating: +(d[name]),
        };
      }),
      visible: (name === 'BTC' ? true : false) // "visible": all false except for economy which is true.
    };
  });

  xScale.domain(d3.extent(data, (d) => { return d.date; })); // extent = highest and lowest points,

  const maxValue = d3.max(data, (d) => {
    return parseFloat(d.BTC);
  });
  yScale.domain([0, maxValue]);

  xScale2.domain(xScale.domain()); // Setting a duplicate xdomain for brushing reference later

  //for slider part-----------------------------------------------------------------------------------

  const brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on('brush', brushed);

  context.append('g') // Create brushing xAxis
    .attr('class', 'x axis1')
    .attr('transform', 'translate(0,' + height2 + ')')
    .call(xAxis2);

  const contextArea = d3.area() // Set attributes for area chart in brushing context graph
    .x((d) => { return xScale2(d.date); }) // x is scaled to xScale2
    .y0(height2) // Bottom line begins at height2 (area chart not inverted) 
    .y1(0); // Top line of area, 0 (area chart not inverted)

  //plot the rect as the bar at the bottom
  context.append('path') // Path is created using svg.area details
    .attr('class', 'area')
    .attr('d', contextArea(categories[0].values)) // pass first categories data .values to area path generator 
    .attr('fill', '#F1F1F2');

  //append the brush for the selection of subsection  
  const brushElem = context.append('g')
    .attr('class', 'x brush')
    .call(brush);
  //end slider part-----------------------------------------------------------------------------------

  // draw line graph
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
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
    .attr('id',  (d) => {
      return 'line-' + d.name.replace(' ', '').replace('/', ''); // Give line id of line-(insert issue name, with any spaces replaced with no spaces)
    })
    .attr('d',  (d) => {
      return d.visible ? line(d.values) : null; // If array key "visible" = true then draw line, if not then don't 
    })
    .attr('clip-path', 'url(#clip)')//use clip path to make irrelevant part invisible
    .style('stroke', (d) => { return color(d.name); });

  // draw legend
  const legendSpace = 450 / categories.length; // 450/number of issues (ex. 40)    

  issue.append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('x', width + (margin.right / 3) - 15)
    .attr('y', (d, i) => { return (legendSpace) + i * (legendSpace) - 8; })  // spacing
    .attr('fill', (d) => {
      return d.visible ? color(d.name) : '#F1F1F2'; // If array key "visible" = true then color rect, if not then make it grey 
    })
    .attr('class', 'legend-box')

    .on('click', (d) => { // On click make d.visible 
      d.visible = !d.visible; // If array key for this data selection is "visible" = true then make it false, if false then make it true

      maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
      yScale.domain([0, maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
      svg.select('.y.axis')
        .transition()
        .call(yAxis);

      issue.select('path')
        .transition()
        .attr('d', (d) => {
          return d.visible ? line(d.values) : null; // If d.visible is true then draw line for this d selection
        })

      issue.select('rect')
        .transition()
        .attr('fill', (d) => {
          return d.visible ? color(d.name) : '#F1F1F2';
        });
    })

    .on('mouseover', (d) => {

      d3.select(this)
        .transition()
        .attr('fill', (d) => { return color(d.name); });

      d3.select('#line-' + d.name.replace(' ', '').replace('/', ''))
        .transition()
        .style('stroke-width', 2.5);
    })

    .on('mouseout', (d) => {

      d3.select(this)
        .transition()
        .attr("fill", (d) => {
          return d.visible ? color(d.name) : '#F1F1F2';
        });

      d3.select('#line-' + d.name.replace(' ', '').replace('/', ''))
        .transition()
        .style('stroke-width', 1.5);
    })

  issue.append('text')
    .attr('x', width + (margin.right / 3))
    .attr('y', (d, i)=> { return (legendSpace) + i * (legendSpace); })  // (return (11.25/2 =) 5.625) + i * (5.625) 
    .text((d) => { return d.name; });

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

  const columnNames = d3.keys(data[0]) //grab the key values from your first data row
    //these are the same as your column names
    .slice(1); //remove the first column name (`date`);

  // Add mouseover events for hover line.
  d3.select('#mouse-tracker') // select chart plot background rect #mouse-tracker
    .on('mousemove', mousemove) // on mousemove activate mousemove function defined below
    .on('mouseout', () => {
      hoverDate
        .text(null) // on mouseout remove text for hover date

      d3.select('#hover-line')
        .style('opacity', 1e-6); // On mouse out making line invisible
    });

  function mousemove() {
    const mouse_x = d3.mouse(this)[0]; // Finding mouse x position on rect
    const graph_x = xScale.invert(mouse_x); // 

    const format = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ'); // Format hover date text to show three letter month and full year

    hoverDate.text(format(graph_x)); // scale mouse position to xScale date and format it to show month and year

    d3.select('#hover-line') // select hover-line and changing attributes to mouse position
      .attr('x1', mouse_x)
      .attr('x2', mouse_x)
      .style('opacity', 1); // Making line visible

    const x0 = xScale.invert(d3.mouse(this)[0]), /* d3.mouse(this)[0] returns the x position on the screen of the mouse. xScale.invert function is reversing the process that we use to map the domain (date) to range (position on screen). So it takes the position on the screen and converts it into an equivalent date! */
      i = bisectDate(data, x0, 1), // use our bisectDate function that we declared earlier to find the index of our data array that is close to the mouse cursor
      /*It takes our data array and the date corresponding to the position of or mouse cursor and returns the index number of the data array which has a date that is higher than the cursor position.*/
      d0 = data[i - 1],
      d1 = data[i],
      /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor and d1 is the combination of date and close that is in the data array at the index to the right of the cursor. In other words we now have two variables that know the value and date above and below the date that corresponds to the position of the cursor.*/
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    /*The final line in this segment declares a new array d that is represents the date and close combination that is closest to the cursor. It is using the magic JavaScript short hand for an if statement that is essentially saying if the distance between the mouse cursor and the date and close combination on the left is greater than the distance between the mouse cursor and the date and close combination on the right then d is an array of the date and close on the right of the cursor (d1). Otherwise d is an array of the date and close on the left of the cursor (d0).*/

    //d is now the data row for the date closest to the mouse position
  };

  //for brusher of the slider bar at the bottom
  function brushed() {
    const selection = d3.event.selection;
    xScale.domain(selection.map(xScale2.invert, xScale2));

    svg.select('.x.axis') // replot xAxis with transition when brush used
      .transition()
      .call(xAxis);

    maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
    yScale.domain([0, maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true

    svg.select('.y.axis') // Redraw yAxis
      .transition()
      .call(yAxis);

    issue.select('path') // Redraw lines based on brush xAxis scale and domain
      .transition()
      .attr('d', function (d) {
        return d.visible ? line(d.values) : null; // If d.visible is true then draw line for this d selection
      });

  };

}); // End Data callback function

function findMaxY(data) {  // Define function "findMaxY"
  var maxYValues = data.map(function (d) {
    if (d.visible) {
      return d3.max(d.values, function (value) { // Return max rating value
        return value.rating;
      })
    }
  });
  return d3.max(maxYValues);
}
/*
focus.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price");  
      
svg.append("text")             
      .attr("transform",
            "translate(" + ((width + margin.right + margin.left)/2) + " ," + 
                           (height + margin.top + margin.bottom) + ")")
      .style("text-anchor", "middle")
      .text("Date");
      */