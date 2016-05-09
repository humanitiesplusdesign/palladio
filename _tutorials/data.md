---
layout: post
title: How to load data into Palladio
collection: tutorials
---


You can load data into Palladio in a number of ways.
Here, we've dragged a .csv file into the box. You can also copy and paste your data, or type directly into the box.

![1loadingfile.png]({{ site.urlimg }}resources/CCA953052BB0485A2C6F75A3D36E6A8E.png)



Data loaded from a file should look like this.

![2loadingdata.png]({{ site.urlimg }}resources/9D91FDA048353B3B13A2C97B1EE3EAD0.png)



When your data is initially loaded into Palladio, you may see a number of your data dimensions flagged for review with a red dot.

![3initiallyloaded.png]({{ site.urlimg }}resources/5157C75F563570400BAA24D02BD3130E.png)



Click on the dimension to review.
![4search special characters.png]({{ site.urlimg }}resources/4127AF986D2E9C472B590710CBC4C0FA.png)



Here, Palladio has flagged special characters that may or may not be intentional. Click on the character to filter the values and review them for accuracy. If you see a problem in your data, you can edit it outside of Palladio and reload the data. When you’ve checked each flagged character, the red dot will disappear. 


Sometimes, your data may contain multiple values within one cell.
In this data, many pieces of art are made with more than one medium.

![beforemult.png]({{ site.urlimg }}resources/C2FB570D1D5A1E9CA00BBE9B932E4D86.png)



Use the Multiple Values Delimiter to let Palladio know these values should be read as separate entries. You can use any string as a delimiter so long as it is consistent within that dimension.
![multiplevalues.gif]({{ site.urlimg }}resources/48807D71B21353E3B3E58AC76578FBF4.gif)



Use the Edit Dimension view to see how often a value appears in your data.
The number on the side of each entry indicates its frequency.

![8sort by frequency title.png]({{ site.urlimg }}resources/4810CBE2B5DFC39137CF50DF02EFD805.png)



You can also choose to sort your data by value.

![9sort by value title.png]({{ site.urlimg }}resources/9D421AF6831270278BA65019A3CA6CB8.png)



Another way to review your data is to search for values within a dimension.

![search.png]({{ site.urlimg }}resources/854D21D0E710EE8589CA86013AA9F55A.png)



The grey icons indicate that each dimension has been verified.

![10after character review.png]({{ site.urlimg }}resources/6400D666F5026862AFB21FA0CA81538F.png)



Palladio automatically assigns each dimension a data type.
Here, you can see that Palladio reads “accession date” as a Number. 

![11see how it's a number.png]({{ site.urlimg }}resources/7547DC07F4491313547F5A8F516F45A5.png)



Click to edit a dimension and change its data type. 

![12change to date.png]({{ site.urlimg }}resources/0BCE4A9AAC2A352F125A47C2A75F0B64.png)



If there is a dimension of your data that you do not want to include in your Palladio project, you can disable it. 
Disabled dimensions can be enabled again at any time. 

![disable.png]({{ site.urlimg }}resources/056E2763B326F15431F9D7C99B10C9C0.png)



Add titles to your tables and data.

![13changed.png]({{ site.urlimg }}resources/D19BA137C6F48C3B37FB4208B3D8E8AF.png) 



Once you’ve finished the review process, it may be helpful to download your Palladio project to simply upload for future use.

Palladio does not store your data, so each project lasts only as long as your browser session unless you download it. 




###Notes:

The review process can be skipped entirely, but it is important to review your data before beginning your Palladio project. 

Palladio needs to be able to read your data types properly in order to use features like mapping coordinates or filtering by timeline and timespan. 

The multiple values delimiter and special characters search can help you make sure your data is as clean as possible before the Palladio visualization process. 


