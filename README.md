# Bokeh React Integration Examples

This is a project where I experiment with integrating React, Bokeh and FastAPI.

You can run the project from the docker-compose file, or manually, in which cases you have to install npm and Python locally.

In both cases the FastAPI server listens on localhost:8000 and the Webpack development server listens on localhost:3000.

To change the ports or hosts, you need to change '/src/conf.ts' for the FastAPI port and change the CORS origins in '/serve.py'.
