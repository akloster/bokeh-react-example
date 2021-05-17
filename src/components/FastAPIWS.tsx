import Switch from '@material-ui/core/Switch';
import React, {useEffect, useRef, useState} from 'react';
import { useBokeh } from '../useBokeh';
import {FA_HOST} from '../conf';

export function FastAPIWS(){
    const containerRef: React.RefObject<HTMLDivElement> = useRef(null);
    const [bokehAvailable, Bokeh] = useBokeh(function(Bokeh){});
    const [running, setRunning] = useState(false);
    const [websocket, setWebsocket] = useState<WebSocket|null>(null);
    const [doc, setDoc] = useState<any>(null);
    const [onClose, setOnClose] = useState<any>(null);

    const connect = function(){
        var ws = new WebSocket(`ws://${FA_HOST}/bokeh/ws`);
        ws.binaryType = "arraybuffer";
        setWebsocket(ws);
    };
    const disconnect = function() {
        if (websocket!==null){
            // avoid state changes after component unmount
            websocket.removeEventListener("close", onClose);
            websocket.removeEventListener("error", onClose);
            // close socket
            websocket.close();
        }
    };
    const toggleRunning = function () {
        if (running && websocket!==null){
            disconnect();
            setRunning(false);
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
                const handler = function (event: any) {
                    if (event.data.byteLength) return;
                    var data_ = JSON.parse(event.data);
                    const data = data_;
                    if (data.type === "initial") {
                        if (containerRef && containerRef.current) {
                            // destroy old plots if any
                            if (doc!==null) doc.clear();
                            Bokeh.embed.embed_item(data.data as any, "plot-container").then((views) => {
                                if (views[0].model.document !== null) {
                                    setDoc(views[0].model.document);
                                    setRunning(true);
                                    websocket.removeEventListener("onmessage", handler);
                                }
                            });
                        }
                    };
                };
                websocket.addEventListener("message", handler);
                const onClose = function () {
                    setRunning(false);
                };
                websocket.addEventListener("close", onClose);
                websocket.addEventListener("error", onClose);

                // keep handler for disconnecting later
                setOnClose(()=>onClose)
            }
    }, [websocket]);
    useEffect(function(){
        var buffers: any[] = [];
        const enc = new TextDecoder("utf-8");
        // Runs when the Document has been embedded
        if (websocket !==null && doc !==null) {
            const receiver = new Bokeh.protocol.Receiver();
            
            // replace onmessage handler
            const handler = function (event: MessageEvent){
                //    if it's binary, append to buffers
                if (event.data.byteLength){
                    buffers.push(event.data)
                } else {
                // Parse Update message and patch document
                const data: any = JSON.parse(event.data);
                if (data.type === "update") {
                    const { header, metadata, content} = data.updates;
                    receiver.consume(header);
                    receiver.consume(metadata);
                    receiver.consume(content);
                    // buffers are alternating between text and binary
                    for (let i=0; i<buffers.length; i++){
                        const buffer = (i%2==0) ? enc.decode(buffers[i]) : buffers[i]
                        receiver.consume(buffer);
                    }
                    buffers = [];
                    const msg = receiver.message;
                    try {
                        if (msg != null && doc != null)
                            doc.apply_json_patch(msg.content, msg.buffers);
                    } catch(error){
                        // If this fails, it's usually because the model ids
                        // from the ws data and the current document don't match up
                        // anymore, usually because of the Hot Reloading.
                        disconnect();
                        setRunning(false);
                    }
                }
            }
            };
            websocket.addEventListener("message", handler);
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