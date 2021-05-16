import React, {useRef} from 'react';
import {useBokeh} from "../useBokeh";
import {animationFrameScheduler, of, timer} from "rxjs";
import { repeat, debounceTime} from 'rxjs/operators';

export function DemoUpdating(){
    // create some data and a ColumnDataSource
    const containerRef = useRef<HTMLDivElement>(null);
    const [bokehAvailable, Bokeh] = useBokeh(function (Bokeh) {
            var x = Bokeh.LinAlg.linspace(0, 20, 1000);
            const yOfX = (x: number[], t:number)=>x.map(function (x) { return Math.sin(x+t)});
            var y = yOfX(x, 0) 
            var source = new Bokeh.ColumnDataSource({ data: { x: x, y: y } });
            const startTime = Date.now();

            let z = 0;

            of(null, animationFrameScheduler)
            .pipe(
                debounceTime(10000),
                repeat(),
            )
            .subscribe(() => {
                const t = Date.now()-startTime;
                source.data.y = yOfX(x, t*0.001);
                source.change.emit();
            });
            var xdr = new Bokeh.Range1d({ start: 0, end: 20 });
            var ydr = new Bokeh.Range1d({ start: -1.2, end: +1.2 });

            // make the plot
            var plot = new Bokeh.Plot({
                title: "BokehJS Plot",
                x_range: xdr,
                y_range: ydr,
                plot_width: 400,
                plot_height: 400,
                //output_backend: "webgl"
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
                line_width: 10
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