/*
    Unfortunately I wasn't able to get Babel to accept Bokeh as an npm library
    so I have to use this kind of "hostile" import.

*/
import type {ColumnDataSource, LinAlg, LinearAxis, Plot, Plotting, Range1d, Grid,
        Line,
        embed,
        protocol,
        Document
} from "@bokeh/bokehjs";
export interface BokehInterface {
            LinAlg:typeof LinAlg,
              Range1d:typeof Range1d,
              Plot: typeof Plot,
              ColumnDataSource: typeof ColumnDataSource,
              LinearAxis: typeof LinearAxis,
              Grid: typeof Grid,
              Plotting: typeof Plotting,
              Line: typeof Line,
              embed: typeof embed,
              protocol: typeof protocol,
              Document: typeof Document, 
        };

declare global {
    interface Window {
        Bokeh: BokehInterface; 
    }
}
export function get_bokeh(){return window["Bokeh"]}