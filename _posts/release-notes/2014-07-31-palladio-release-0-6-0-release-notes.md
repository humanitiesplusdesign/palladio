---
layout: post
title:  "Palladio Release Notes: 0.6.0"
author: Ethan Jewett
date:   2014-07-31 09:00:00
category: palladio
published: true
tags: front
excerpt: "New features and bug fixes in release 0.6.0"
---


##New Features

**Redesign**

An updated design across the application, including a new start page with extended explanations of functionality.

**TimeSpan filter component**

A new filter type is introduced that allows visualization and filtering of records based on a start date and an end date. We offer 2 view options in this filter: a horizontal slope chart (the 'Parallel' subview), and a Gannt-like view (the 'Bars 'subview).

**List view changes, and export option**

The list view has been reworked to provide a more guided experience, more intuitive display of multiple values, and an option to export the current display as a CSV. When navigating to the list view, a user must now choose a primary row dimension before any data is displayed. Additional dimensions can then be selected to display as informational columns. Columns can be reordered by dragging to change the order of the dimensions in the dimension selector.

**Graph view optimization**

The graph view has been heavily optimized and should now allow for the display of 100's of nodes with relatively smooth animation on most computers. Tip: If you want to speed up animation temporarily, try disabling display of labels and/or links in the settings panel.

**Dimension chooser dialog updates**

The modal dialog that allows selection of dimensions to display in several of the views has been revamped to be more compact. This should allow handling data sets with a larger number of dimensions without needing to scroll in this modal dialog.

**Map view "fixed-scale" option**

The user has the option to set the scale of the map view. This scale will then remain the same when switching between dimensions displayed on the map, allowing a researcher to make valid scale comparisons across dimensions.

**Restrictions on facet filter dimensions removed**

Previously there were restrictions on the dimensions available in the facet filter based on type of dimensions and the number of values in the dimension. These restrictions have been removed, so it is possible to use any dimension in the facet filter. Some formatting issues remain, which we hope to address in the next release.

##Bug Fixes

* Graph view +/- buttons don't work
* Limit the length of the filter display (above the filters)
* Timeline bug - timeline won't display for some types of data
* Changes in the Refine view don't always trigger a refresh of data in visualizations
* Timeline miscounts months sometimes ('01' is interpreted as February)


## Known issues (incomplete list)

* Timespan filter doesn't display properly if data contains "end dates" that are before "start dates"
* Graph view nodes can have 0-size in some circumstances
* Start page design is not responsive
* Firefox browser presents issues with loading and saving projects
* Sorting data alphabetically within the list view does not work

## Reporting issues

If you find issues or are having trouble getting your data to work in Palladio, please get in touch. This is an ongoing research project and we can use all the feedback we can get.

On Twitter: [@HDStanford](http://twitter.com/HDStanford)
By email: <a href="mailto:palladio@designhumanities.org">palladio@designhumanities.org</a>