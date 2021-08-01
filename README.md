# CiteLearn

CiteLearn provides a user interface for classifying input text against a trained model.

It builds on an architecture for deploying Keras models [using Redis and FastAPI](https://github.com/shanesoh/deploy-ml-fastapi-redis-docker).

The components include:

* **Frontend**: A [Vue](https://vuejs.org/) client web application for users to submit text for analysis
* **Webapi**: A [FastAPI](https://fastapi.tiangolo.com/) backend web application for accepting requests from the Vue client, placing them in a Redis queue, and polling the queue to return processed predictions from the model
* **Modelserver**: A Python application which retrieves items from the queue, classifies them using the **Citation Needed** model, and stores the prediction results in Redis
* **Redis**: A [Redis](https://redis.io/) message queue server
* **Postgresql**: A Postgresql database for persistent data storage, using [Flyway](https://flywaydb.org/) for migrations

## Models

CiteLearn supports using two different families of models for making predictions.

The first is the [Citation Needed model](https://github.com/mirrys/citation-needed-paper), which was trained using TensorFlow 1. Details for downloading the dictionary and model files are provided at this project's GitHub repository.

The second is the [CiteLearn family of models](https://github.com/thelondonsimon/citelearn-model) developed as part of this project. These models have been trained using TensorFlow 2. They use BERT word embeddings and a different set of training data. Currently a single model is available to download:

* [BERT/Books/FA-all](https://citelearn.s3-ap-southeast-2.amazonaws.com/models/citelearn_fa_all_bert_books_20210720.zip): using a pre-trained BERT word embedding trained on Wikipedia and BooksCorpus, trained on the complete page content of approximatley 5,000 Wikipedia Featured Articles

Because of the different TensorFlow versions used to train each model, the choice of model used requires different Python libraries. The model type to be used is specified as an environment variable, and the Dockerised version of CiteLearn is currently configured to provide access to the Citation Needed model.

## Deployment: Docker

CiteLearn is packaged as a series of [Docker containers](https://www.docker.com/) and a development environment can be launched using `docker-compose up`. Separate production Docker files are provided to build images for each of the components.

The Citation Needed model and its accompanying dictionaries are not included in this repository due to space considerations.

Production build scripts will retrieve these dependencies automatically, however development environments require downloading the files as documented in [modelserver/models/models.txt](modelserver/models/models.txt) and [modelserver/dictionaries/dictionaries.txt](modelserver/dictionaries/dictionaries.txt)

## Deployment: VMs

CiteLearn can also be deployed using traditional virtual machines by cloning the repository and configuring the necessary servers using the guidelines below.

### Frontend

* Update the server's `WEBAPI_BASE_URL` environment variable or add an `.env.production.local` file which sets the webapi server URL used to make requests, e.g. `VUE_APP_API_BASE_URL=https://citelearnapi.wmcloud.org`
* Install **npm** or **yarn** to build the production assets (e.g. `yarn && yarn build`)
* Install a web server such as **nginx** (see example configuration at [nginx.conf](frontend/nginx.conf)) to seve the resulting `dist` production directory

### Webapi

* Requires **python3.7** with **pip**
* Create and activate a virtualenv for citelearn
* Install the requirements: `pip install -r ./webapi/requirements.txt`
* Install gunicorn and fastpi: `pip install fastapi gunicorn uvicorn uvloop httptools`
* Copy `./app.env` to `./app.env.prod` and update to reflect your production environment
* Edit, install and enable the template `systemd` scripts for running gunicorn at [webapi/vm/gunicorn.service](webapi/vm/gunicorn.service) and [webapi/vm/gunicorn.socket](webapi/vm/gunicorn.socket)
* Install `nginx` and use the [webapi/vm/nginx-site.conf](webapie/vm/nginx-site.conf) template as the basis for configuring nginx as a proxy to the gunicorn unix socket
* See https://docs.gunicorn.org/en/stable/deploy.html and https://towardsdatascience.com/deploy-python-apis-to-the-web-with-linux-2f4c7be8a76d for additional references

### Modelserver

* Requires **python3.6** with **pip**
* For each model type that needs to be supported (CitationNeeded and/or CiteLearn), create and activate a corresponding virtualenv
* For each virtualenv, install its corresponding requirements (CitationNeeded = `requirements.txt` ; CiteLearn =  `requirements-citelearn-models.txt`)
* Download the dictionary and model files appropriate to the model being used (see above / [Dockerfile-prod](modelserver/Dockerfile-prod))
* Copy `./app.env` to `./app.env.prod` and update to reflect your production environment
* Edit, install and enable the template `systemd` script for running the modelserver python script at [modelserver/vm/modelserver.service](modelserver/vm/modelserver.service)

### Postgresql

* Requires **postgresql** and **flyway**
* Create the database user (e.g. `citelearn`) and database (e.g. `citelearn`) which will be used to host the schema
* Copy and edit `flyway/conf/flyway.conf` to `~/flyway.conf`
* Setup the database schema by running `flyway -locations=filesystem:/home/username/citelearn/flyway/sql migrate`

### Redis

* Requires **redis-server**
* Ensure the server is configured to bind to the necessary network interfaces

## API Endpoints

The webapi exposes the following endpoints:

**POST /predict**

Is designed to accept a user submission which is parsed into paragraphs (with optional headings) and setences. Each sentence returned includes a prediction score between 0 and 1 (`predictionScore`) from the model and a boolean value indicating whether an in-text citation was detected (`citationDetected`).

The payload can also include an `originalRequestId` property, which is used to identify resubmissions of a previous user submission by specifying the original response `id`.

```
POST /predict

Payload
{
    "text": string,
    "originalRequestId": uuid
}

Response
{ 
    "id": uuid,
    "paragraphs": [
        {
            "uuid": uuid,
            "heading": string,
            "rawInput": string,
            "sequence": int,
            "sentences": [
                {
                    "uuid": uuid,
                    "rawInput": string,
                    "predictionScore": float,
                    "citationDetected": boolean,
                    "sequence": int
                },
                ...
            ]
        },
        ...
    ]
}

--

Exception
{
    "success": boolean
}
```

**PATCH /analysis_sentence**

Accepts a payload which updates an existing analysis_sentence. It is used to add user evaluations of the predictions made by CiteLearn for individual sentences.

```
POST /analysis_sentence

Payload
{
    "id": uuid,
    "dtEvaludated": string,
    "userEvaluationCategory": string,
    "userEvaluationText" : string
}

Response
{
    "id": uuid
}

--

Exception 
{
    "success": boolean,
    "error": string
}
```