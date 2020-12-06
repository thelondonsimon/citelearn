# citelearn

CiteLearn provides a user interface for classifying input text against the [Citation Needed model](https://github.com/mirrys/citation-needed-paper).

It builds on an architecture for deploying Keras models [using Redis and FastAPI](https://github.com/shanesoh/deploy-ml-fastapi-redis-docker).

The components include:
* A [Vue](https://vuejs.org/) client web application for users to submit text for analysis
* A [FastAPI](https://fastapi.tiangolo.com/) backend web application for accepting requests from the Vue client, placing them in a Redis queue, and polling the queue to return processed predictions from the model
* A Python application which retrieves items from the queue, classifies them using the **Citation Needed** model, and stores the prediction results in Redis
* A [Redis](https://redis.io/) message queue server

## Requirements
CiteLearn is packaged as a series of [Docker containers](https://www.docker.com/) and a development environment can be launched using `docker-compose up`.

The Citation Needed model and its accompanying dictionaries are not included in this repository due to space considerations.

Production build scripts will retrieve these dependencies automatically, however development environments require downloading the files as documented in [modelserver/models/models.txt](modelserver/models/models.txt) and [modelserver/dictionaries/dictionaries.txt](modelserver/dictionaries/dictionaries.txt)
