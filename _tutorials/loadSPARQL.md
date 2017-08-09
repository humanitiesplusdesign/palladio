---
layout: post
title: How to load data from a SPARQL endpoint
collection: tutorials
---

Data can be loaded from a SPARQL endpoint.  The SPARQL language is used to query Linked Open Data (LOD) from various museums and other art collections.  An [excellent tutorial](http://programminghistorian.org/lessons/graph-databases-and-SPARQL) on loading data from a SPARQL endpoint can be found at [The Programming Historian](http://programminghistorian.org/).

To load data from a SPARQL endpoint, first click "Load data from a SPARQL endpoint (beta)".  You will be prompted to identify the path of the endpoint (for instance, the British Museum's public-facing SPARQL page is at [http://collection.britishmuseum.org/sparql](http://collection.britishmuseum.org/sparql), but the SPARQL endpoint to allow Palladio to connect to the British Museum is: 'http://collection.britishmuseum.org/sparql.json' .
An incomplete list of SPARQL endpoints is available [here](http://www.w3.org/wiki/SparqlEndpoints)

![SPARQL.png]({{ site.urlimg }}resources/SPARQL.png)

Next, enter your SPARQL query.  Correctly formatting SPARQL queries (including possibly connecting multiple linked datasets) is outside the scope of this Tutorial (again, we highly recommend the Programming Historian's tutorial linked above), but when testing your queries it is a good idea to restrict the initial dataset to no more than 100 rows by concluding with 'Limit 100' in your query.


After entering your SPARQL endpoint and query, click "Run Query".  You will be given the chance to review your results before importing them by clicking Load Data.  (Note that for instance Palladio sees images for a gallery as the path to that image, not an image itself)


