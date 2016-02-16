---
layout: post
title:  "Palladio Release Notes: 0.7.0"
author: Mark Braude
date:   2014-09-23 09:00:00
category: palladio
published: true
excerpt: "New features and bug fixes in release 0.7.0"
tags: front
---

The 0.7.0 release of Palladio features an interface for querying SPARQL endpoints, as well as several bug fixes and enhancements, most specifically pertaining to the TimeLine and TimeSpan tools.

##New Features


**SPARQL Support**

Palladio now offers SPARQL support, allowing the use of a SPARQL query to load data from a publicly available SPARQL endpoint. An incomplete list of SPARQL endpoints is available [here](http://www.w3.org/wiki/SparqlEndpoints).
SPARQL loading capability is available on the initial data load as well as in the context of extending tables.


##Bug Fixes and Enhancements

* TimeSpan filter allows use of dimensions in any order (previously, the first dimension was required to have dates that always preceded the dates in the second dimension).* TimeLine filter now displays the current filter on the large timeline.* Initial data loading page now provides all loading options in a consistent tabbed interface.* Palladio no longer automatically adds '&output=csv' to Google spreadsheets links, allowing for the loading of any CSV that is available on a server that allows cross-site loading.
