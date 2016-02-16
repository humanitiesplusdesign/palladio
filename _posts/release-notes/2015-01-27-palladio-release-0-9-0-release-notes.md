---
layout: post
title: "Palladio Release Notes: 0.9.0"
author: Mark Braude
date: 2015-01-27 11:34:22
category: palladio
published: true
tags: front
excerpt: "New features and bug fixes in release 0.9.0"

---

##Bug Fixes

* Major performance fix to data load/processing.
* Filters applied on facet filter dimensions don’t go away when the facet filter is removed (thanks to Christoph Kudella for the bug report).
* Application was non-functional after refreshing while in the visualization view. Now fixed.</li>
* Changing table and dimension names in the data view did not update in the visualization view (thank you, again, Christoph!). Fixed. 


##Enhancements

* New Filter View Modes. We are refining and re-working the filter components (timeline and facet-filter) so that each has three view modes: small, medium, large. The ‘large’ view is comparable to one of the primary data views (map, graph, table, gallery) in that it functions as a display that can be filtered by time or facet. </li>
* Timeline Filter. The double-decker timeline is gone. The timeline filter is streamlined and elegant.</li>
* Timespan Filter. Now displays records that only have a start date or an end date as points.</li>
* Map Layers. Drag to order layers.</li>
* Map Layers. Sort order is reversed so that top layer is at the top of the list.</li>
* Facet filter. Indicates number of values in each facet.</li>
* Facet filter. Small bottom margin.</li>
</ul>

##New Features

* Expanded Timespan View.
* Timespan tooltips.
* Y-Axis Grouping.
* Duration view.
* Allow downloading of tables in the data view.
* Multi-file support. One Palladio instance can host and load multiple save files based on the URL
