FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7
WORKDIR /app
COPY ./requirements.txt /app/
RUN pip install -r /app/requirements.txt
CMD ["uvicorn", "serve:app", "--host=0.0.0.0", "--reload"]