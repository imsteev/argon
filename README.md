# Overview

The approach taken was to ingest clinical trial data into an in-memory vector database,
and have the API server make queries against it with a search term to get top N results.
I spent the majority of my time trying to figure out how embeddings work and ultimately
how to apply it in the application. As a result, this app is largely unpolished (both in code organization and functionality), and probably doesn't solve Sarah's problem.
I learned a bunch of new and interesting things though! (this was my first time working with embeddings).

Get the app up-and-running:

 0. Download a JSON file for top 10K clinical trials (as instructed by the prompt). The seed script expects this file to be
    named `ctg-studies.json` (which is the default name), and place in the root directory.

 1. Run ChromaDB
 ```
 chroma run
 ```
 To install Chroma, you must have Python. Then use pip `pip install chromadb`.

 2. Seed ChromaDB with embeddings (you only need to do this once)
 ```
 node seed.js
 ```

 3. Run the app server.
 ```
 node api.js
 ```

Technologies used:

* NodeJS (backend)
* ChromaDB (vector/embedding DB)
* HTMX (frontend)

What I would have liked to do:

* Heavily polish the UI. Probably would use something like React/NextJS which has an ecosystem of nice-looking component libraries. I ended up using HTMX to simplify a lot as I did not have much time left on FE.
* Get the search functionality to actually work. I'm honestly not sure if the way I'm using ChromaDB is correct. My mental model right now is that we can find similar documents based off what we've embedded in the seeding stage. I don't know if I needed to do something extra to get the queries to recognize "synonyms" like abbreviations.
* Answer some UX issues: do we paginate data? do we allow users to search by other dimensions? can users search for similar trials? etc.

**Deployment**

We can use various cloud providers to deploy our web service. There would need
to be a step before the app is deployed to make sure Chroma is properly seeded.
Subsequent deployments can probably just update the Chroma asynchronously though.
