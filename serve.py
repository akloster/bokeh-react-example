from base64 import b64encode
from time import time
from asyncio import sleep
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
import websockets.exceptions
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import bokeh.resources
import bokeh.embed
import bokeh.protocol
from bokeh.plotting import figure, Document
import numpy as np
import json

app = FastAPI()

origins= ["*",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Find out bokeh static directory
BOKEHJS_ROOT = bokeh.resources.bokehjsdir()
app.mount("/bokehjs", StaticFiles(directory=BOKEHJS_ROOT+"/js"), name="bokehjs")

@app.get("/bokeh/simple")
def bokeh_simple():
    p = figure(width=500, height=500)
    p.title.text = "Simple Plot"
    x = np.linspace(-6, 6, 200)
    y = np.cos(x)
    points = p.line(x, y, width=7, alpha=0.5)
    return bokeh.embed.json_item(p)


@app.websocket("/bokeh/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
        In this setup, a new plot/document has to be created for
        every websocket connection, otherwise the model ids won't
        sync up correctly.
        Also, when the websocket connection is lost and reconnected,
        the old plot must be destroyed and replaced on the frontend.

        It is possible to decouple this by passing data over the
        websocket and matching up the model instances on the frontend
        manually.
        
        The downside then is, of course, that the automatic detection
        of changes to the document is lost.
    """
    p = figure(width=500, height=500)
    doc = Document()
    doc.add_root(p)
    p.title.text = ""
    points = p.line([], [], width=7, alpha=0.5)
    await websocket.accept()
    # Send initial plot information 
    plot_data = bokeh.embed.json_item(p)
    await websocket.send_json(dict(type="initial", data=plot_data))
    i = 0
    doc.hold(policy="combine")
    t0 = time()
    try:
        while True:
            # Send update
            t = time()-t0
            p.title.text = f"Running for {t:.2f} seconds"
            i+=1
            x = np.linspace(-16, 16, 200)+t * 1.5
            y = np.cos(x)
            points.data_source.data.update({'x':x, 'y':y})
            buffers, updates = serialize_events(doc._held_events)
            doc._held_events = []
            # Buffer messages alternate between a json header and binary data
            for buffer in buffers:
                if isinstance(buffer, dict):
                    await websocket.send_bytes(json.dumps(buffer).encode("ascii"))
                else:
                    await websocket.send_bytes(buffer)
            try:
                await websocket.send_json(dict(type="update", updates=updates))
            except TypeError:
                print(updates)
            await sleep(1 / 25)
    # FastAPI docs say WebSocketDisconnect should be raised. Most often, it's not...
    except (WebSocketDisconnect, ConnectionClosedError, ConnectionClosedOK) as e:
        print("Disconnect")
        doc.clear()
    print("finish")
def serialize_events(events):
    msg = bokeh.protocol.Protocol().create("PATCH-DOC", events)

    # The Bokeh protocol makes a difference between content and buffers.
    # The "content" is a JSON-serializable  object, whereas buffers
    # are arrays of binary data.
    # These buffers will be send as binary messages for efficiency.
    buffers = []
    for header, payload in msg.buffers:
        buffers.append(header)
        buffers.append(payload)
    
    return buffers, dict(header=msg.header_json,
                metadata=msg.metadata_json,
                content=msg.content_json, 
                )
