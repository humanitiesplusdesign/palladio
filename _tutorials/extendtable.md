---
layout: post
title: How to extend data in Palladio
collection: tutorials
---

After a data set has been created/loaded, you can extend the data set by returning to the "Data" tab.  Select the table you are extending and click on the column that your will be linking to.  (For instance, to add a table of letters, linked by the author's name, click on the "Name" column in the "People" table).  At the bottom-left, click "Add a new table".  At this point, you can load the new table in the same way as [loading other data](/palladio/tutorials/data).  

tktktktk-animate

The best practice is to begin with the table that has the most unique values (i.e. first load a table of letters, then the table of people who wrote the letters, then the table of cities that match the letter source, destination, and people's place of birth)

The new table will be created (initially untitled).  Click the new untitled table to give it a title, then review the data.  If there is not a unique identifier in the data set, the system will generate a number row for each item.  If you have any columns you want to hide, click the eye icon to hide them (for instance, the text of letters is probably not relevant to visualizing when they were written or who wrote them, and the tool can slow down with long unstructured text).

tktktktk-animate

Note that after a table has been loaded, multiple columns can use the table to extend the data.  For instance a table of letters may have a source city and a destination city.  After loading the city table, the source city & destination city columns can both be linked to the table.

Additional note - tables can have multiple data values within a single column.  For instance, a table of art objects might have multiple values in the "materials" column.  This column can be extended with each value in the materials linked to a table.

Also note that it is possible to break a link between two tables.  (For instance if you incorrectly link a column)  Click the column and then "Remove extension".
