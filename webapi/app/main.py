"""
Web server script that exposes endpoints and pushes images to Redis for classification by model server. Polls
Redis for response from model server.
Adapted from https://www.pyimagesearch.com/2018/02/05/deep-learning-production-keras-redis-flask-apache/
"""
import base64
import io
import json
import os
import time
import uuid

import redis

from fastapi import FastAPI, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from pydantic import BaseModel

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = redis.StrictRedis(host=os.environ.get("REDIS_HOST"))
CLIENT_MAX_TRIES = int(os.environ.get("CLIENT_MAX_TRIES"))


class InputText(BaseModel):
    text: str


@app.get("/")
def index():
    return "Cite Learn!"


@app.post("/predict")
def predict(input: InputText):
    data = {"success": False}

    # Generate an ID for the classification then add the classification ID + text to the queue
    k = str(uuid.uuid4())
    text = input.text
    d = {"id": k, "text": text}
    db.rpush(os.environ.get("TEXT_QUEUE"), json.dumps(d))
    
    # Keep looping for CLIENT_MAX_TRIES times
    num_tries = 0
    while num_tries < CLIENT_MAX_TRIES:
        num_tries += 1

        # Attempt to grab the output predictions
        output = db.get(k)

        # Check to see if our model has classified the input text
        if output is not None:
            # Add the output predictions to our data dictionary so we can return it to the client
            output = output.decode("utf-8")
            data = json.loads(output)

            # Delete the result from the database and break from the polling loop
            db.delete(k)
            break

        # Sleep for a small amount to give the model a chance to classify the input image
        time.sleep(float(os.environ.get("CLIENT_SLEEP")))

        # Indicate that the request was a success
        data["success"] = True
    else:
        raise HTTPException(status_code=400, detail="Request failed after {} tries".format(CLIENT_MAX_TRIES))

    # Return the data dictionary as a JSON response
    return data