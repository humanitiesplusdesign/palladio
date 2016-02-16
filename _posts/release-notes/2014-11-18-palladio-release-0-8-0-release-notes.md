---
layout: post
title: "Palladio Release Notes: 0.8.0"
author: Mark Braude
date: 2014-11-18 11:34:22
category: palladio
published: true
tags: front
excerpt: "New features and bug fixes in release 0.8.0"

---

##New Features

This release focuses on expanded Map View features. In response to your feedback, the Map View now handles different tile sets. Tile sets can be layered on top of one another and toggled as desired. This facilitates comparisons between historical and contemporary maps. In cases where a historical map only covers part of an area of interest, we can now see the rest of the area - either with a contemporary map, a different historical map, or a combination of the two.

###New Map View Options:

1.	Use the current standard tile set for the map view, or choose from one of the new pre-loaded alternatives: Streets, Land, Terrain, Satellite, and Buildings and Areas. 

2.	Create your own custom tile set using mapbox.com and/or the Mapbox TileMill tool and use that tile set in Palladio using a Mapbox Project ID. Please see the Mapbox tutorial [here]({{ site.baseurl }}/doc/Palladio Mapbox tutorial_low.pdf)

3.	Use an OpenStreetMap(OSM)/Google formatted tile set URL, such as those provided by Stamen or the NYPL MapWarper project. Please see the URL-based tile set tutorial [here]({{ site.baseurl }}/doc/Tutorial for creating URL based tilesets_low.pdf)

###Other general features and changes:


1. New, rewritten version of the Facet Filter, including better sorting and smoother interaction.

2. Extending fields (in the file upload and dimension view) now uses a pill-based selector rather than a drop-down. This change addresses several bugs that occurred with the previous drop-down-based approach.

3. Graph view is more stable during filtering, with fewer instances of nodes moving off-screen.

4. Dropbox integration. Host a file in a Dropbox public folder and create 'public link.' Paste that link directly into Palladio interface. Note that hosting data in a Dropbox public folder makes your data publicly accessible. To keep your data private, continue uploading your tabular data in the traditional manner.

5. Auto-load capability for hosted versions of Palladio. Put 'auto-load.json' in the Palladio save format in the Palladio root directory on your web server and it will be automatically loaded.