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
import psycopg2

from fastapi import FastAPI, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rd = redis.StrictRedis(host=os.environ.get("REDIS_HOST"))
pg_con = psycopg2.connect(host=os.environ.get("POSTGRES_HOST"), dbname = os.environ.get("POSTGRES_DB"), user = os.environ.get("POSTGRES_USER"), password = os.environ.get("POSTGRES_PASSWORD"))

CLIENT_MAX_TRIES = int(os.environ.get("CLIENT_MAX_TRIES"))


class InputText(BaseModel):
    text: str
    originalRequestId: Optional[str] = None

class AnalysisSentence(BaseModel):
    id: str
    userEvaluationCategory: Optional[str] = None
    userEvaluationText: Optional[str] = None
    dtEvaluated: Optional[str] = None

@app.patch("/analysis_sentence")
async def analysis_sentence(input: AnalysisSentence):
    with pg_con:
        with pg_con.cursor() as cursor:
            try:
                cursor.execute("UPDATE analysis_sentence SET dt_evaluated = %s, user_evaluation_category = %s, user_evaluation_text = %s WHERE id = %s",(input.dtEvaluated,input.userEvaluationCategory,input.userEvaluationText,input.id))
                return {'id': input.id }
            except Exception as err:
                return {'success': False, 'error': err }
    

@app.post("/predict")
async def predict(input: InputText):
    data = {"success": False}

    # Generate an ID for the request then add the request ID + text to the queue
    reqUuid = str(uuid.uuid4())
    text = input.text
    d = {"id": reqUuid, "text": text}
    rd.rpush(os.environ.get("TEXT_QUEUE"), json.dumps(d))

    with pg_con:
        with pg_con.cursor() as cursor:
            cursor.execute("INSERT INTO analysis_request (id,dt_created,dt_updated,input,original_analysis_request_id) VALUES (%s,%s,%s,%s,%s)",(reqUuid,'now()','now()',text,input.originalRequestId))
    
    # Keep looping for CLIENT_MAX_TRIES times
    num_tries = 0
    while num_tries < CLIENT_MAX_TRIES:
        num_tries += 1

        # Attempt to grab the output predictions
        output = rd.get(reqUuid)

        # Check to see if our model has classified the input text
        if output is not None:
            # Add the output predictions to our data dictionary so we can return it to the client
            output = output.decode("utf-8")
            data = {'id': reqUuid, 'paragraphs': json.loads(output)}

            # Delete the result from the database
            rd.delete(reqUuid)

            # Update the persistent data store
            with pg_con:
                with pg_con.cursor() as cursor:
                    cursor.execute("UPDATE analysis_request SET dt_predicted = %s WHERE id = %s",('now()',reqUuid))
                    for i,par in enumerate(data['paragraphs']):
                        parUuid = str(uuid.uuid4())
                        par['uuid'] = parUuid
                        par['sequence'] = (i+1)
                        cursor.execute("INSERT INTO analysis_paragraph (id,analysis_request_id,sequence_no,heading) VALUES (%s,%s,%s,%s)",(parUuid,reqUuid,par['sequence'],par['heading']))
                        for j,sen in enumerate(par['sentences']):
                            senUuid = str(uuid.uuid4())
                            sen['uuid'] = senUuid
                            sen['sequence'] = (j+1)
                            cursor.execute("INSERT INTO analysis_sentence (id,analysis_paragraph_id,sequence_no,input,citation_detected,prediction_score_raw) VALUES (%s,%s,%s,%s,%s,%s)",(senUuid,parUuid,sen['sequence'],sen['rawInput'],sen['citationDetected'],sen['predictionScore']))
            
            # break from the polling loop
            break

        # Sleep for a small amount to give the model a chance to classify the input image
        time.sleep(float(os.environ.get("CLIENT_SLEEP")))

        # Indicate that the request was a success
        data["success"] = True
    else:
        raise HTTPException(status_code=400, detail="Request failed after {} tries".format(CLIENT_MAX_TRIES))

    # Return the data dictionary as a JSON response
    return data