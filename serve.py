from base64 import b64encode
from time import time
from asyncio import sleep
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import bokeh.resources
import bokeh.embed
import bokeh.protocol
from bokeh.plotting import figure, Document
import numpy as np

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
def serialize_events(events):
    msg = bokeh.protocol.Protocol().create("PATCH-DOC", events)

    buffers = []
    for header, payload in msg.buffers:
        buffers.append((header, b64encode(payload).decode('ascii')))
    return dict(header=msg.header_json,
                metadata=msg.metadata_json,
                content=msg.content_json, 
                buffers=buffers)


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
            updates = serialize_events(doc._held_events)
            doc._held_events = []
            try:
                await websocket.send_json(dict(type="update", updates=updates))
            except TypeError:
                print(updates)
            await sleep(1 / 25)
    except WebSocketDisconnect:
        pass
