"""
Model server script that polls Redis for images to classify
Adapted from https://www.pyimagesearch.com/2018/02/05/deep-learning-production-keras-redis-flask-apache/
"""
import base64
import json
import os
import sys
import time

import pickle
from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences
import tensorflow as tf
import numpy as np
import nltk
import nltk.data

import config
from utils import *

import numpy as np
import redis

# Connect to Redis server
db = redis.StrictRedis(host=os.environ.get("REDIS_HOST"))

# Load the pre-trained Keras model and dictionaries
cfg = config.get_localized_config()
vocab_w2v = pickle.load(open(cfg.vocb_path, 'rb'))
section_dict = pickle.load(open(cfg.section_path, 'rb'), encoding='latin1')
graph = tf.get_default_graph()
model = load_model(cfg.model_path)

# configure sentence detector
nltk.download('punkt')
extra_abbreviations = ['pp', 'no', 'vol', 'ed', 'al', 'e.g', 'etc', 'i.e',
        'pg', 'dr', 'mr', 'mrs', 'ms', 'vs', 'prof', 'inc', 'incl', 'u.s', 'st',
        'trans', 'ex']
sent_detector = nltk.data.load('tokenizers/punkt/english.pickle')
sent_detector._params.abbrev_types.update(extra_abbreviations)

def classify_process():
    # Continually poll for new submissions to classify
    while True:
        # Pop off multiple classification requests from Redis queue atomically
        with db.pipeline() as pipe:
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

        textIds = [] # list of uuids for each request being classified
        X = [] # list of word vectors for each sentence being classified by predict()
        sections = [] # list of section names required by predict()
        numberOfSentencesInTexts = [] # number of sentences in a request
        originalSentences = [] # the parsed sentence before being tokenized

        max_len = cfg.word_vector_length
        for q in queue:
            # Deserialize the object and obtain the input text
            q = json.loads(q.decode("utf-8"))
            sentences = sent_detector.tokenize(q["text"])

            textIds.append(q["id"])
            numberOfSentencesInTexts.append(len(sentences))

            for text in sentences:
                originalSentences.append(text)
                wordlist = text_to_word_list(text) # tokenise and lower-case
                X_inst = [] # stores the dictionary lookups for each word in a sentence
                for word in wordlist:
                    if max_len != -1 and len(X_inst) >= max_len:
                        break
                    # Construct word vectors
                    X_inst.append(vocab_w2v.get(word, vocab_w2v['UNK']))
                X.append(X_inst)

                #sections.append(section_dict.get('main_section', 0))
                sections.append(0) # use unknown section name, as scores returned using "main_content" are too high

        # Check to see if we need to process the batch
        if len(textIds) > 0:
            # format predict() inputs by padding to expected shape and converting sections to np.array
            X = pad_sequences(X, maxlen=max_len, value=vocab_w2v['UNK'], padding='pre')
            sections = np.array(sections)
            
            # Classify the batch of sentences
            preds = model.predict([X,sections])

            # Retrieve the predictions for each original request
            # and store the serialized data in Redis for retrieval by the web server
            j = 0
            for i,num in enumerate(numberOfSentencesInTexts):
                predictions = { "scores": [], "sentences": [] }
                for k,p in enumerate(preds[j:num]):
                    predictions["scores"].append(p[0].astype(float))
                    predictions["sentences"].append(originalSentences[j+k])
                db.set(textIds[i], json.dumps(predictions))
                j += num

        # Sleep for a small amount
        time.sleep(float(os.environ.get("SERVER_SLEEP")))

if __name__ == "__main__":
    classify_process()