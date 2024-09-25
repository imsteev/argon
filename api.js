import express from "express";
import { ChromaClient, DefaultEmbeddingFunction } from "chromadb";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;
const chroma = new ChromaClient({ path: process.env.CHROMADB_URL });

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const collection = await chroma.getCollection({
  name: "clinical_trials",
  embeddingFunction: new DefaultEmbeddingFunction(),
});

app.get("/", async function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
    <html>
      <head>
      <script src="https://unpkg.com/htmx.org@2.0.2" integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ" crossorigin="anonymous"></script>

      <style>
        main {
          padding: 4rem;
          margin-inline: auto;
        }

        li {
          list-style: none;
        }
      </style>
      </head>
      <main>
        <h1>Search Clinical Trials</h1>
        <form hx-post="/search" hx-target="#search-results">
        <input type="text" name="search" placeholder="non-squamous cell carcinoma">
        </label>
        <label>
        <button type="submit">Search</button>
        </form>
        <div id="search-results">
        </div>
      </main>
    </html>`);
});

app.post("/search", async function (req, res) {
  const results = await collection.query({
    nResults: 25, // This could be 25, 50, 100, etc. Probably don't want too much
    queryTexts: req.body.search,
  });
  res.setHeader("Content-Type", "text/html");
  res.send(
    results.metadatas[0]
      .map(
        (m, idx) => `<li>
          <a href="https://clinicaltrials.gov/study/${results.ids[0][idx]}" target="_blank">${m.officialTitle}</a>
          <details>
            <summary>See more</summary>
            ${m.description}
          </details>
        </li>`
      )
      .join("")
  );
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
