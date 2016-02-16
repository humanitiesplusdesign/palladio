---
layout: post
title:  "Palladio FAQ"
author: Mark Braude
date:   2014-06-20 11:34:22
category: palladio
published: true
tags: 
excerpt: "The FAQs have been updated for our June 2014 release, 0.5.0, to reflect the new features and fixes."

---



 1.  [What is a Palladio Data Model?](#13)  
 2.  [Which data formats work with Palladio?](#14)
 3. [What does it mean if I see a Lightning Bolt icon and ‘Special Characters Found’ in one of my dimensions?](#1)
 4. [What is a Multiple Values Delimiter?](#2)
 5. [What are Size Points?](#3)
 6. [How do I get the most use out of the Timeline feature?](#4)
 7. [How should Dates be entered?](#5)
 8. [How should Coordinates be entered?](#6)
 9. [What do the labels and numbers listed directly below my dimension represent?](#7)
 10. [I would like to export a Map visualization but can only export it as an .svg with dots and lines. What should I do?](#8)
 11. [What are some applications of the Gallery View?](#9)
 12. [How do I get the most out of Map view?](#12)


### <a name="13"></a>What is a Palladio Data Model?

Once you’ve uploaded your tabular data into the Palladio interface, you may refine it and save it as a Palladio Data Model to your desktop.  The Palladio Data Model is saved with the extension .json and includes the schema and structure required to visualize your data in Palladio. (Not just any json file will do.) Now, as you continue to use Palladio you can shorten the upload and refine stages by uploading your existing palladio.json file (The Palladio Data Model). Remember that if you make further changes to your data in the refine stage, you should re-export the Data Model to have a version that reflects your changes.


### <a name="14"></a>Which data formats work with Palladio?

Any collection of information that can be represented in a table format (in other words, any data you might enter into a spreadsheet program) will work with Palladio. Make sure that all data is represented by delimited-separated values. Palladio supports the following delimiters: commas, semicolons and tabs.

Palladio works best with data that is uniform, consistent, and simple. Avoid notes and comments within your data, or any unnecessary diacritics.

You can build your own tables and bring them into Palladio in three ways:

1. By typing text into any word processing program (ie. textedit or MS Word) and then copying the contents into Palladio interface.

2. By dragging any file format into the Palladio interface, for instance by dragging a .txt file from your work station and dropping into Palladio.

3. By typing directly into the Palladio interface.

If you plan to build your own table in Palladio:

The first row in your data will be parsed as a header. This means that the first row in your data will indicate the name of the dimensions in the column below.

So, a table column of people's names would have 'Names' as its first row and then dimensions, such as 'John Doe' and 'Jane Smith' in the rows below. Palladio cannot properly access and reference the different dimensions in your data unless you follow this format.

Each column header must be unique from the other. Within a header name you may use letters, spaces, and numbers. Do not use any special alphanumeric characters, such as underscores '_' or dashes '-', as these will confuse Palladio.

Examples of data:

Correct:

First name, Last name, Age

John, Doe, 28

Jane, Smith, 35

Incorrect (missing header):

John, Doe, 28

Jane, Smith, 35

Incorrect (two headers with the same name):

Name, Name, Age

John, Doe, 28

Jane, Smith, 35

Incorrect (special characters in the header):

First_Name, Last-Name, Age

John, Doe, 28

Jane, Smith, 35

*Other Data Issues:*

Note that empty rows in your data will be ignored by Palladio.

Palladio does not work with unstructured data, such as one long string of text, but only with data that has been placed into some kind of table. The richest uses of Palladio comes from having several different related tables of information, however many users will start with just one single table.


### <a name="1"></a>What does it mean if I see a Lightning Bolt icon and ‘Special Characters Found’ in one of my dimensions?

This is Palladio’s way of telling you that there are non-standard alpha-numerical characters in your data. These special characters may either lead to errors, or (in the case of commas or semicolons used to separate values in a given dimension) these special characters may be of help for you to use advanced tools such as the Multiple-Values Delimiter.

### <a name="2"></a>What is a Multiple Values Delimiter?

Your tabular data is made up of various dimensions (ie. individual cells in a spreadsheet). In some cases you may want to assign more than one value for a certain dimension. For instance, you may have a column describing someone's 'Position.' The column could be filled Princes, Popes, and Poets. But what if your Prince was also a Pope? In this case you could enter 'Prince, Pope' in one single cell of your table. Now, after you’ve uploaded the data into Palladio, you can parse that cell into two unique values. Here's how: In the Multiple Values Delimiter input box, enter the symbol you've used to separate your values, in this case, a comma that separated Pope and Prince. Now Palladio understands that this entry as two separate values.

### <a name="3"></a>What are Size Points?

Toggling the Size Points function in the map view will change the sizes of your various dots on the map, depending on how frequently they appear in your dataset. So, for instance, if you had a table listing 30 Priests born in Rome and 1 Priest in Florence, and you have produced a map visualization that counts by Priests, the dot representing Rome in your map view will be significantly larger than the dot representing Florence.

### <a name="4"></a>How do I get the most use out of the Timeline feature?

As you change the temporal period in your timeline view, the map will update to show data only from that period. You can zoom in to get as granular a view as you would like. One of the most exciting features of Palladio’s timeline is that it allows users to select more than one point on the timeline to show more than one period (ie. 1900-150) and 1970-200) view these simultaneously within a given visualization.

Swiping within the Timeline view will allow you to zoom in to specific dates. The stacked bar and highlighting functions allow you to see the data in different ways as you hover.


### <a name="5"></a>How should Dates be entered?

Dates should be entered in the following format Year-Month-Day (2014-01-01). Years must always be rendered as four digit integers. Thus years between 0 CE and 1000 CE should still be rendered as 0001 or 0999. Negative dates should follow the same format, but preceded by a minus sign (ie. -200-01-01). 

### <a name="6"></a>How should Coordinates be entered?

Coordinates information must be rendered as latitude and longitude, separated by a comma. For example: 41.95, 12.5.

See the Scenario: Creating Data for a Simple Map for more information about creating and entering coordinates information. [Download PDF]({{ site.baseurl }}/doc/scenario-simple-map.pdf)


### <a name="7"></a>What do the labels (text, date, URL etc.) and numbers listed directly below my dimension represent?

In the refine (non-visualization) view your data appears as table, with each column header represented as a unique dimension.

For instance, Gender as the Dimension Name, with the label Text and number 2 listed below.

In this case Gender is the header from one column of your data, Text is the data type recognized by Palladio (most data will be recognized as Text), and the number 2 represents the number of unique values in your data - in this case the data contains 2 values: Male and Female.

Palladio will guess the type of data entered based on its attributes. Data will be recognized as either: Text, Number, Year or Date, Coordinates, URL.

If Palladio ‘guesses’ your data incorrectly you can click on the dimension and in the dropdown menu labeled Data Type, change the type of data specified. The more accurately Palladio defines your data, the better the platform will work.


### <a name="8"></a>I would like to export a Map visualization but can only export it as an .svg with dots and lines. What should I do?

As Palladio Map Visualizations involve placing static coordinates data onto a separate map grid layer the full visualization cannot currently be exported as an .svg, rather you will see only the dots and lines against a blank background. If this solution is unsatisfactory, we recommended using ‘screen grabs’ as the best method, currently, for exporting map visualizations.


### <a name="9"></a>What are some applications of the Gallery View?

In the Gallery View you can display different kinds of data that cannot be visualized as maps or graphs.

For instance, if in your data set you had a column in which you linked a list of people to URLs containing images of each person, you could then display these images in grid view.

In this case, you would go to Grid View and click the ‘Image URL’ option. Palladio would then locate the dimension in which you’ve listed image URLs in your data.

### <a name="12"></a>How do I get the most out of the Map view?

The default map view is a blank map. Note the settings panel to the right. You can hide the panel by clicking on the gear symbol. The + and - signs zoom the map in and out.

The first step is to specify the type of map you'd like to see. To do so, choose from the menus within the settings panel. You can choose from two types of map views: 'Points' or 'Point to Point'. (Note that access to these functions will depend on the kinds of information you've uploaded. You wouldn't, for example, be able to use the 'Point to Point' function unless Palladio recognizes a dataset with more than one type of coordinates column, ie. 'Source City' and 'Destination City.')

‘Points’ map view

In the 'Points' map view, Palladio can map out a collection of unique locations, based on any coordinates data (longitude, lattitude) you've entered. For instance, if you uploaded a table listing all of the Popes in the last five hundred years, their individual cities of birth, and coordinates data for each of these cities, you might want to see a worldwide view of where Popes have been born in the last five hundred years.

In Points view you can only select one dimension. If you toggle Size points, the sizes of each dot will relates to their frequency within your data. You can specify how you would like to count your data by using the Count By function. Note you can only count by unique tables uploaded in your data. Hovering over specific dots will display corresponding data. You can select which type of data to display on hovering, by using the Tooltip label.

Below the 'Type of Map' menu is a second menu, 'Places.' This menu will be populated with any data for which there are coordinates, and the menu choices will be named for the headers of columns containing coordinates data. For instance, in our Popes dataset set, if the coordinates data in your original table is labeled 'Birth City Coordinates,' then you will be prompted to choose 'Birth City Coordinates' within the 'Places' menu. To see all of your Popes birthplace data on the map, you would select 'Birth Place Coordinates' in the 'Places' menu. Now the map will be populated with dots representing each individual value in your coordinates data.

See the Scenario: Creating Data for a Simple Map for more information about creating and entering coordinates information.

[Download PDF]({{ site.baseurl }}/doc/scenario-simple-map.pdf)


‘Point-to-Point’ map view

The point to point view give us a node-link map. Here you will select two different dimensions (ie. source city and destination city) and see the links between various points.

The arc of the link between two points represents the direction of the flow. Think of direction in a clockwise function.

Now you can explore this Map data in various ways by using the Timeline and Facet Filter functions. You can also use the search bar to filter the data being visualized to accord with whatever parameters you wish, so long as your coordinates data corresponds in some way to whatever you've typed into the search bar. You can also isolate specific points on your map by clicking on them.

See the Scenario: Creating Data for a Point to Point Map for more information about creating and entering coordinates information.

[Download PDF]({{ site.baseurl }}/doc/scenario-point-to-point.pdf)



 
Please email us at <a href="mailto:palladio@designhumanities.org">palladio@designhumanities.org</a> to share your experience.
              
