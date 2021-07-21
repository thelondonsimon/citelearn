"""
Model server script that polls Redis for requests to classify
Adapted from https://www.pyimagesearch.com/2018/02/05/deep-learning-production-keras-redis-flask-apache/
"""

import json
import os
import time
import redis
from citationdetector import detectCitation
from inputparser import parseParagraphs


# Specify whether the model to serve predictions will be a CiteLearn (TensorFlow 2) model or the CitationNeeded (TensorFlow 1) model
validModelTypes = ['CiteLearn','CitationNeeded']
modelType = os.environ.get("CITELEARN_MODEL_TYPE")  
modelType = modelType if modelType in validModelTypes else 'CiteLearn' ## must be CiteLearn or CitationNeeded
modelLocation = '../models/' + os.environ.get("CITELEARN_MODEL_NAME")


# load model type specific packages
if modelType == 'CitationNeeded':
    import pickle
    from keras.models import load_model
    from keras.preprocessing.sequence import pad_sequences
    import tensorflow as tf
    import numpy as np
    from utils import *
    import config
else:
    import tensorflow as tf
    import tensorflow_text as text
    from keras import backend as K


# Connect to Redis server
rd = redis.StrictRedis(host=os.environ.get("REDIS_HOST"))


if modelType == 'CitationNeeded':
    # Load the pre-trained Keras model and dictionaries
    cfg = config.get_localized_config()
    max_len = cfg.word_vector_length
    vocab_w2v = pickle.load(open(cfg.vocb_path, 'rb'))
    section_dict = pickle.load(open(cfg.section_path, 'rb'), encoding='latin1')
    graph = tf.get_default_graph()
    model = load_model(cfg.model_path)
else:
    # Load the TensorFlow 2 model
    model = tf.saved_model.load(modelLocation)


def classify_process():
    # Continually poll for new submissions to classify
    while True:
        # Pop off multiple classification requests from Redis queue atomically
        with rd.pipeline() as pipe:
            pipe.lrange(os.environ.get("TEXT_QUEUE"), 0, int(os.environ.get("BATCH_SIZE")) - 1)
            pipe.ltrim(os.environ.get("TEXT_QUEUE"), int(os.environ.get("BATCH_SIZE")), -1)
            queue, _ = pipe.execute()


        # For peformance reasons, a call to predict() may classify multiple requests (i.e. chunks of text) at once.
        # Each request is split into individual sentences, which are then tokenized into words for classification.
        # We need to be able to retain the grouping of request/sentences when the
        # predictions are returned and stored back in Redis.
        
        # The client submitting the request is also unaware of how *this* process will detect sentences for classification.
        # When returning prediction scores, the original sentences which were detected are therefor also persisted into
        # Redis for return to the client.

        requests = []
        X = [] # list of word vectors for each sentence being classified by predict()
        if modelType == 'CitationNeeded':
            sections = [] # list of section names required by predict()

            for q in queue:
                # Deserialize the object and obtain the input text
                q = json.loads(q.decode("utf-8"))
                paragraphs = parseParagraphs(q["text"])

                for par in paragraphs:
                    for sen in par['sentences']:
                        wordlist = text_to_word_list(sen['rawInput']) # tokenise and lower-case
                        X_inst = [] # stores the dictionary lookups for each word in a sentence
                        for word in wordlist:
                            if max_len != -1 and len(X_inst) >= max_len:
                                break
                            # Construct word vectors
                            X_inst.append(vocab_w2v.get(word, vocab_w2v['UNK']))
                        X.append(X_inst)

                        #sections.append(section_dict.get('main_section', 0))
                        sections.append(0) # use unknown section name, as scores returned using "main_content" are too high
                
                requests.append({'id': q["id"], 'paragraphs': paragraphs})

            # Check to see if we need to process the batch
            if len(requests) > 0:
                # format predict() inputs by padding to expected shape and converting sections to np.array
                X = pad_sequences(X, maxlen=max_len, value=vocab_w2v['UNK'], padding='pre')
                sections = np.array(sections)
                
                # Classify the batch of sentences
                preds = model.predict([X,sections])

                predIndex = 0
                for req in requests:
                    for par in req['paragraphs']:
                        for sen in par['sentences']:
                            sen['predictionScore'] = preds[predIndex][0].astype(float)
                            sen['citationDetected'] = detectCitation(sen['rawInput'])
                            predIndex += 1
                    rd.set(req['id'], json.dumps(req['paragraphs']))
        else:
            for q in queue:
                # Deserialize the object and obtain the input text
                q = json.loads(q.decode("utf-8"))
                paragraphs = parseParagraphs(q["text"])
                requests.append({'id': q["id"], 'paragraphs': paragraphs})

                for par in paragraphs:
                    for sen in par['sentences']:
                        X.append(sen['rawInput'])
            
            # Check to see if we need to process the batch
            if len(requests) > 0:
                # Classify the batch of sentences
                preds = K.eval(tf.sigmoid(model(tf.constant(X))))

                predIndex = 0
                for req in requests:
                    for par in req['paragraphs']:
                        for sen in par['sentences']:
                            sen['predictionScore'] = preds[predIndex][0].astype(float)
                            sen['citationDetected'] = detectCitation(sen['rawInput'])
                            predIndex += 1
                    rd.set(req['id'], json.dumps(req['paragraphs']))

        # Sleep for a small amount
        time.sleep(float(os.environ.get("SERVER_SLEEP")))

if __name__ == "__main__":
    classify_process()