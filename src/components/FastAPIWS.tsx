import Switch from '@material-ui/core/Switch';
import React, {useEffect, useRef, useState} from 'react';
import { useBokeh } from '../useBokeh';
import {FA_HOST} from '../conf';
function base64ToArrayBuffer(base64:any) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function FastAPIWS(){
    const containerRef: React.RefObject<HTMLDivElement> = useRef(null);
    const [bokehAvailable, Bokeh] = useBokeh(function(Bokeh){});
    const [running, setRunning] = useState(false);
    const [websocket, setWebsocket] = useState<WebSocket|null>(null);
    const [doc, setDoc] = useState<any>(null);
    const [onClose, setOnClose] = useState<any>(null);

    const connect = function(){
        var ws = new WebSocket(`ws://${FA_HOST}/bokeh/ws`);
        setWebsocket(ws);
    };
    const disconnect = function() {
        if (websocket!==null){
            // avoid state changes after component unmount
            websocket.removeEventListener("onclose", onClose);
            websocket.removeEventListener("onerror", onClose);
            // close socket
            websocket.close();
        }
    };
    const toggleRunning = function () {
        if (running && websocket!==null){
            setRunning(false);
            disconnect();
        } else if (!running && websocket!== null){
            connect();
        };
    };
    useEffect(() => {
        // Runs when Bokeh becomes available
        // starts the first connection
        if (bokehAvailable) {
            connect();
        }
    }, [bokehAvailable]);
    useEffect(()=>{
            // Runs every time there is a new websocket, i.e. new connection
            if (websocket!==null){
                websocket.onmessage = function (event) {
                    const data: any = JSON.parse(event.data);
                    if (data.type === "initial") {
                        if (containerRef && containerRef.current) {
                            // destroy old plots if any
                            if (doc!==null) doc.clear();
                            Bokeh.embed.embed_item(data.data as any, "plot-container").then((views) => {
                                if (views[0].model.document !== null) {
                                    setDoc(views[0].model.document);
                                    setRunning(true);
                                }
                            });
                        }
                    };
                };
                const onClose = function () {
                    setRunning(false);
                };
                websocket.addEventListener("onclose", onClose);
                websocket.addEventListener("onerror", onClose);

                // keep onClose function for disconnecting late
                setOnClose(onClose)

            }
    }, [websocket]);
    useEffect(function(){
        // Runs when the Document has been embedded
        if (websocket !==null && doc !==null) {
            const receiver = new Bokeh.protocol.Receiver();
            // replace onmessage handler
            websocket.onmessage = function (event){
                // Parse Update message and patch document
                const data: any = JSON.parse(event.data);
                if (data.type === "update") {
                    const { header, metadata, content, buffers } = data.updates;
                    receiver.consume(header);
                    receiver.consume(metadata);
                    receiver.consume(content);
                    buffers.forEach(function (buffer:any) {
                        receiver.consume(JSON.stringify(buffer[0]));
                        receiver.consume(base64ToArrayBuffer(buffer[1]));
                    });
                    const msg = receiver.message;
                    try {
                        if (msg != null && doc != null)
                            doc.apply_json_patch(msg.content, msg.buffers);
                    } catch(error){
                        // If this fails, it's usually because the model ids
                        // from the ws data and the current document don't match up
                        // anymore, usually because of the Hot Reloading.
                        console.log(error);
                        disconnect();
                        setRunning(false);
                    }
                }
            }
        }
        // Cleanup document (and destroy plots etc) 
        return function(){
            if (doc!==null) doc.clear();
            disconnect();
        };
    }, [doc]);
    return <div>
        <Switch checked={running}
            onChange={toggleRunning}
        /> {running ? "Sync is running" : "Sync is not running"}
        <div ref={containerRef} id="plot-container">
        </div>
        <p>This example demonstrates how to synchronize a Bokeh plot between
            a FastAPI server and the browser using websockets.
        </p>
        <p>Connect and disconnect the Synchronization with the switch above!</p>

    </div>
}