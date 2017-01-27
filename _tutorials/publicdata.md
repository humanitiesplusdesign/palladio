---
layout: post
title: How to link data hosted elsewhere
collection: tutorials
---

Data can be loaded from a public github repository (or any [CORS enabled](http://enable-cors.org/) link).  Once the data is properly structured and configured to allow Cross-Origin Resource Sharing, simply add the file path to the "load data" textbox and click "Load".

![Public Data.png]({{ site.urlimg }}resources/publicdata.png)

A sample data file can be found [here](http://hdlab.stanford.edu/palladio-app/sample%20data/Letters.txt) in order to test the process.

To configure a github repo to host this data:

Create the new repository
![NewRepo.png]({{ site.urlimg }}resources/LoadData-NewRepo.png)
![NewRepo2.png]({{ site.urlimg }}resources/LoadData-NewRepo2.png)

Add the file you want to share
![Upload.png]({{ site.urlimg }}resources/LoadData-Upload.png)
![Upload2.png]({{ site.urlimg }}resources/LoadData-Upload2.png)

Go to settings and set the GitHub page to "Track Master"
![Settings.png]({{ site.urlimg }}resources/LoadData-PublicPageSettings.png)
![TrackMaster.png]({{ site.urlimg }}resources/LoadData-PublicPageMaster.png)

After the repository is published, you can directly access the uploaded data file.  (Note that the file path is case-sensitive)
![PalladioLoad.png]({{ site.urlimg }}resources/LoadData-Palladio.png)


Note that changes to dropbox folder sharing mean that it is not possible to load data from a public dropbox folder.
