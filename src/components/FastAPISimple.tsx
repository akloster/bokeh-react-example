import React, {useEffect, useRef, useState} from 'react';
import { useBokeh } from '../useBokeh';
import {useFetch} from '../useFetch';
import {FA_HOST} from '../conf';

export function FastAPISimpleDemo(){
    const [status, docData] = useFetch(`http://${FA_HOST}/bokeh/simple`);
    const containerRef: React.RefObject<HTMLDivElement> = useRef(null);
    const [bokehAvailable, Bokeh] = useBokeh(function(Bokeh){
    });
    const [doc, setDoc] = useState<any>(null);
    // This time we have to wait for a second condition...
    useEffect(function(){
        if (containerRef && containerRef.current && (status==="fetched")) {
            Bokeh.embed.embed_item(docData as any, "plot-container").then(function(views){
                if (views[0].model.document !== null) {
                    setDoc(views[0].model.document);
                }
            });
        }
    },[bokehAvailable, status])
    useEffect(function(){
        return function(){
            if (doc!==null) doc.clear();
        }
    }, [doc])
    return <div>
        <div ref={containerRef} id="plot-container">
        </div>

    </div>
}