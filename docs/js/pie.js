const svg6 = d3.select('#chart2').append('svg')
.attr('width', 512)
.attr('height', 512);
const width7 = +svg6.attr('width');
const height7 = +svg6.attr('height');
const g = svg6.append('g').attr('transform', 'translate(' + width7 / 2 + ',' + height7 / 2 + ')');

const pie = d3.pie()
  .sort(null)
  .value((d) => { return d[1] });
const arc = d3.arc()
  .innerRadius(120)
  .outerRadius(150);

const allData = [
    [[255],[300]],
    [[150],[400]],
    [[700],[500]],
    [[245],[200]],
    [[4, 23],[700]]
];
let prevData = [];
let data = [];
let index = 0;
let duration = 600;
let color7 = d3.scaleOrdinal(d3.schemePaired);

function arcTween() {
    return function (d) {
        // interpolate both its starting and ending angles
        var interpolateStart = d3.interpolate(d.start.startAngle, d.end.startAngle);
        var interpolateEnd = d3.interpolate(d.start.endAngle, d.end.endAngle);



        return function (t) {
            return arc({
                startAngle: interpolateStart(t),
                endAngle: interpolateEnd(t),
            });
        };
    };
}

function updatePie() {
    var prevPieById = _.reduce(pie(prevData), function (obj, d) {
        obj[d.data[0]] = d;
        return obj;
    }, {});
    var currentPie = pie(data);

    var arcs = g.selectAll('path')
        .data(currentPie, function (d) { return d.data[0] });

    // enter and update the arcs first
    var exit = arcs.exit();
    var enter = arcs.enter().append('path');
    var enterUpdate = enter.merge(arcs)
        .attr('fill', function (d) { return color7(d.data[0]) })

    // then calculate start and end positions for each of the arcs
    exit.each(function (d) {
        // the arcs that need to exit, animate it back to its starting angle
        d.start = { startAngle: d.startAngle, endAngle: d.endAngle };
        d.end = { startAngle: d.startAngle, endAngle: d.startAngle };
    });
    enterUpdate.each(function (d) {
        var prevPie = prevPieById[d.data[0]];
        if (prevPie) {
            // if previous data exists, it must mean it's just an update
            d.start = { startAngle: prevPie.startAngle, endAngle: prevPie.endAngle };
            d.end = { startAngle: d.startAngle, endAngle: d.endAngle };
        } else {
            // if no previous data, must be an enter
            d.start = { startAngle: d.startAngle, endAngle: d.startAngle };
            d.end = { startAngle: d.startAngle, endAngle: d.endAngle };
        }
    });

    exit.transition().duration(duration)
        .attrTween('d', arcTween())
        .remove()
        .on('end', function () {
            // then animate the updating arcs
            arcs.transition().duration(duration)
                .attrTween('d', arcTween())
                .on('end', function () {
                    // and finally animate in the arcs
                    enter.transition().attrTween('d', arcTween());
                });
        });
}

d3.interval(function () {
    index += 1;
    prevData = data;
    data = _.sortBy(allData[index % 5], function (d) { return d[0] });
    updatePie();
}, 2000);