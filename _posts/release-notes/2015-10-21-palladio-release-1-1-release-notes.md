---
layout: post
title: "The Palladio 1.1 Release"
author: Nicole Coleman
date: 2015-10-21 14:50:22
category: palladio
published: true
tags: front
excerpt: "Many bug fixes. Performance improvements. New features for the map view and the timespan."

---

[Check out version 1.1](http://palladio.designhumanities.org/)

##Enhancements
1. General: We added a progress indicator to let you know when rendering is happening. Look for a swoosh around the Palladio "P" in the upper left corner.
1. Data Refine: Allow "ignore" option for special characters in the edit dimension view.
2. Data Refine: Red dot goes to gray for a reviewed/edited/verified dimension.
5. Map view: Allow the use of WMS URLS. YAY!!!
7. Map view: improvements to map data rendering time. 
9. Map view: We have removed the 'mouseclick to filter' on the map points. We will be replacing this with a mouseclick for popover that will give more detailed information about a point on the map than we see in the tooltip.
6. Timespan: Add the group name to the tooltip.
7. Timespan: Highlight timespans on mouseover to clarify for which timespan the tooltip is displayed.  
13. Timespan: Enable grouping of timespans by another dimension (hovering will highlight all spans related to a record if a span appears in more than one group due to a multi-value field).
4. Facet Filter: show ([number selected out of] / [total number]) for each dimension. We need to let people know at a glance how many of a thing they are seeing in a view. We can do this easily with FF instead of mucking up the interface with more information.
5. Facet Filter: Performance improvement in facet filter by using filterExact when possible.  
2. Saving a project: Add date to metadata per project (more coming)
3. Saving a project: save files can reference external data (performance improvement). Including toggle option so that user can control if data is saved along with Palladio save file or is referenced in a remote location. Only available if file is loaded from URL, not if data is dragged or pasted into Palladio directly. Try putting the URL of a Dropbox file in your Public folder where you normally paste your data.
10. Saving a project: Now you can save a project from Safari browser! The save file name will be “Unknown." You'll need to rename it. At least the download works.



##Bug Fixes
1. Timespan: The bar layout was displaying duplicate values.
2. Facet filter: fixed a bug where the clear/remove controls stopped appearing.
3. Map view: Fixed a bug that caused the legend graphics to appear squished.
4. Data Refine: We no longer flag the data format "Coordinates" for review because of commas and dashes.
5. Map View: At the request of our friends at Mapbox, we added Mapbox branding when using Mapbox tiles.
6. Saving a project: Fixed a bug where saving a project would kill links/extensions.
7. General: Fixed a bug where font-awesome drag icon was not appearing.
8. Facet Filter: Fixed a bug where adding a dimension triggered multiple updates, causing slowness.
9. Data Refine: For a while, if you needed to remove a table that was extended from the primary table in order to fix it and re-load it, the re-load would fail. That has been fixed.
10. Timespan Filter: Fixed a problem where filter settings were not saved with the Palladio save file (download).
11. Facet Filter: Fixed a display problem that caused dimensions to stack.
12. Timespan Filter: Fixed a problem where, if a filter is already in place when the timespan is added, then the filter is removed, the lines will overflow the view area.


