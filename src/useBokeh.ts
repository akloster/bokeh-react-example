import React, {useState, useRef, useEffect} from 'react';
import {useInterval} from './useInterval';
import {get_bokeh, BokehInterface} from "./bokeh_types";
export function useBokeh(create:(Bokeh:BokehInterface)=>void): [boolean, BokehInterface]{
    const BokehOrNot = get_bokeh();
    const testBokeh=()=>get_bokeh()!==undefined;
    const [bokehAvailable, setBokehAvailable] = useState(testBokeh());
    useInterval(function(){
        if (testBokeh()) setBokehAvailable(true);
    }, !bokehAvailable ? 250 : null);
    useEffect(function(){
            if (bokehAvailable) {
                create(BokehOrNot as BokehInterface);
        }}, [bokehAvailable, BokehOrNot]);
    return [bokehAvailable, BokehOrNot as BokehInterface]
}