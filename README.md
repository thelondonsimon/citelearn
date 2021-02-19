# citelearn

CiteLearn provides a user interface for classifying input text against the [Citation Needed model](https://github.com/mirrys/citation-needed-paper).

It builds on an architecture for deploying Keras models [using Redis and FastAPI](https://github.com/shanesoh/deploy-ml-fastapi-redis-docker).

The components include:
* **Frontend**: A [Vue](https://vuejs.org/) client web application for users to submit text for analysis
* **Webapi**: A [FastAPI](https://fastapi.tiangolo.com/) backend web application for accepting requests from the Vue client, placing them in a Redis queue, and polling the queue to return processed predictions from the model
* **Modelserver**: A Python application which retrieves items from the queue, classifies them using the **Citation Needed** model, and stores the prediction results in Redis
* **Redis**: A [Redis](https://redis.io/) message queue server
* **Postgresql**: A Postgresql database for persistent data storage, using [Flyway](https://flywaydb.org/) for migrations

## Deployment: Docker
CiteLearn is packaged as a series of [Docker containers](https://www.docker.com/) and a development environment can be launched using `docker-compose up`. Separate production Docker files are provided to build images for each of the components.

The Citation Needed model and its accompanying dictionaries are not included in this repository due to space considerations.

Production build scripts will retrieve these dependencies automatically, however development environments require downloading the files as documented in [modelserver/models/models.txt](modelserver/models/models.txt) and [modelserver/dictionaries/dictionaries.txt](modelserver/dictionaries/dictionaries.txt)


## Deployment: VMs
CiteLearn also be deployed using traditional virtual machines by cloning the repository and configuring the necessary servers using the guidelines below.


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
* Create and activate a virtualenv for citelearn
* Install the requirements `pip install -r ./modelserver/requirements.txt`
* Download the dictionary and model files (see [Dockerfile-prod](modelserver/Dockerfile-prod))
* Copy `./app.env` to `./app.env.prod` and update to reflect your production environment
* Edit, install and enable the template `systemd` script for running the modelserver python script at [modelserver/vm/modelserver.service](modelserver/vm/modelserver.service)


### Postgresql
* Requires **postgresql** and **flyway**
* Create the database user (e.g. `citelearn`) and database (e.g. `citelearn`) which will be used to host the schema
* Copy and edit `flyway/conf/flyqay.conf` to `~/flyway.conf`
* Setup the database schema by running `flyway -locations=filesystem:~/citelearn/flyway/sql migrate`


### Redis
* Requires **redis-server**
* Ensure the server is configured to bind to the necessary network interfaces
