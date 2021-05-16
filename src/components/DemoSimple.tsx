import React, {useRef} from 'react';
import {useBokeh} from "../useBokeh";

export function DemoSimple(){
    // create some data and a ColumnDataSource
    const containerRef = useRef<HTMLDivElement>(null);
    const [bokehAvailable, Bokeh] = useBokeh(function (Bokeh) {
            var x = Bokeh.LinAlg.linspace(0, 20, 200);
            var y = x.map(function (x) { return Math.sin(x)});
            var source = new Bokeh.ColumnDataSource({ data: { x: x, y: y } });
            // create some ranges for the plot
            var xdr = new Bokeh.Range1d({ start: 0, end: 20 });
            var ydr = new Bokeh.Range1d({ start: -1, end: +1 });

            // make the plot
            var plot = new Bokeh.Plot({
                title: "BokehJS Plot",
                x_range: xdr,
                y_range: ydr,
                plot_width: 400,
                plot_height: 400,
            });

            // add axes to the plot
            var xaxis = new Bokeh.LinearAxis({});
            var yaxis = new Bokeh.LinearAxis({});
            plot.add_layout(xaxis, "below");
            plot.add_layout(yaxis, "left");

            // add grids to the plot
            var xgrid = new Bokeh.Grid({ ticker: xaxis.ticker, dimension: 0 });
            var ygrid = new Bokeh.Grid({ ticker: yaxis.ticker, dimension: 1 });
            plot.add_layout(xgrid);
            plot.add_layout(ygrid);

            // add a Line glyph
            var line = new Bokeh.Line({
                x: { field: "x" },
                y: { field: "y" },
                line_color: "#666699",
                line_width: 2
            });
            plot.add_glyph(line, source);
            if (containerRef && containerRef.current){
                containerRef.current.innerHTML = "";
                Bokeh.Plotting.show(plot, containerRef.current);
            }
        });
    return <div ref={containerRef} style={{width:"100%"}}>
    </div>
};