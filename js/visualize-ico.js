(function () {

  function loadData(cb) {
    console.log("Loading data");
    d3.json("../data/ico.json", cb);
  }

  function doSequenceOfTasks(taskAreDone) {
    d3.queue()
      .defer(loadData)
      .await(taskAreDone);
  }
  
  var margin = { top: 20, right: 20, bottom: 50, left:80};
  var width = 1500 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;

  const parseDate = d3.utcParse('%Y-%m-%d %H:%M:%S');

  var svg = d3.select("#icojs").append("svg")
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', "translate(" + margin.left + "," + margin.top + ")");


  doSequenceOfTasks(function (err,data){
    if (err) {
      console.log("could not load data"); 
    } else {

      data.ico.finished.forEach( (d) => {
        d.end_time = parseDate(d.end_time);
       
        if(d.all_time_roi != 'NA'){
         d.all_time_roi = parseFloat(d.all_time_roi.replace(/,/, ''));
        }
        if (d.price_usd == 0.0 || d.price_usd == 'NA'){
          d.price_usd = 0.01;
        } else {
          d.price_usd = parseFloat(d.price_usd.replace(/,/, ''));
        }
    });

      var priceBoundaries = d3.extent(data.ico.finished, d => d.price_usd);
      var dateBoundaries = d3.extent(data.ico.finished, d => d.end_time);
      var roiBoundaries = d3.extent(data.ico.finished, d => d.all_time_roi)

      // Define the div for the tooltip
      var div = d3.select("body").append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0)

      var radiusScale = d3.scaleLinear()
        .domain(roiBoundaries)
        .range([5,100]);

      var colorPositiveScale = d3.scaleLinear()
        .domain([0, roiBoundaries[1]])
        .range(["lightgreen", "darkgreen"]);
      
      var colorNegativeScale = d3.scaleLinear()
      .domain([roiBoundaries[0], 0])
      .range(["red", "white"]);
    
      var yScale = d3.scaleLog()
        .domain(priceBoundaries)
        .range([height, 0])
        .base(2)
      
      var xScale = d3.scaleUtc()
        .domain(dateBoundaries)
        .range([0, width]);

      var yAxis = d3.axisLeft(yScale);
      var xAxis = d3.axisBottom(xScale);

      svg.append("g").call(yAxis);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
      
      svg.append("text")             
        .attr("transform",
              "translate(" + (width/2) + " ," + 
                             (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Date");

      // text label for the y axis
      svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - 80)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price [USD]");  

      svg.selectAll("circle")
       .data(data.ico.finished)
       .enter()
        .append("svg:circle")
          .attr("opacity", "0.8")
          .attr("fill", function(d) { 
            if(d.all_time_roi == 'NA'){
              return 
            }
            if(d.all_time_roi < 0){
              return colorNegativeScale(d.all_time_roi)
            } else {
              return colorPositiveScale(d.all_time_roi)
            }
          })
          .attr("cx", function(d) { return xScale(d.end_time)})
          .attr("cy", function(d) { return yScale(d.price_usd)})
          .attr("r", function(d) { 
            if(d.all_time_roi == 'NA'){
              return 3
            }else {
              return  radiusScale(d.all_time_roi)}})
          .on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html("name: " + d.name + "<br/>"
                    + "price: " + d.price_usd + " usd<br/>"
                    + "ROI: " + d.all_time_roi + "%<br/>"
            )	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY) + "px");	
            })					
          .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
          });
    }
  });

})();
