---
layout: page
title: Testimonials
---


  <ul class="post">
  {% for item in site.testimonials do %}
  
    <li class="post-title">
      <a href="{{ site.baseurl }}{{ item.url }}">
        {{ item.title }}
      </a>
    </li>
  {% endfor %}
  </ul>  
  <h2>Elsewhere Around The Internet</h2>
 
  <h2>Tutorials and Resources</h2>
  <ul class="post">
    <li class="post-title">
      <a href="http://miriamposner.com/blog/getting-started-with-palladio/">
      Getting Started With Palladio</a> (from <a href="http://miriamposner.com">Miriam Posner</a>)
    </li>
    <li class="post-title">
      <a href="http://programminghistorian.org/lessons/creating-network-diagrams-from-historical-sources.html#visualize-network-data-in-palladio) and [Using SPARQL With Palladio](http://programminghistorian.org/lessons/graph-databases-and-SPARQL">
      Using Palladio</a> (from <a href="http://programminghistorian.org">The Programming Historian</a>)
    </li>
    <li class="post-title">
      <a href="http://francescagiannetti.com/a-workshop-on-maps-and-timelines/">
      A Workshop on Maps & Timelines</a> includes information on CartoDB and Palladio
    </li>
    <li class="post-title">
      <a href="http://matthewlincoln.net/2016/04/07/exploring-depictions-of-amsterdam-with-palladio.html">
      Workshop using Rijksmuseum artwork portraying Amsterdam, including sample data</a>
    </li>
    <li class="post-title"> 
      The 
      <a href="http://dh.chinese-empires.eu/beta/">
      MARKUS</a> project for tagging Classical Chinese texts prepared a 
      <a href="http://dh.chinese-empires.eu/beta/doc/Palladio_linking_guidelines.pdf">
      PDF</a> and 
      <a href="https://www.youtube.com/watch?v=Saxo6TB5khs">
      Video</a> for using Palladio to visualize tagged data.
    </li>
    <li class="post-title">
      <a href="https://andrewwilson84.wordpress.com/2016/03/07/mapping-the-revolution/">
      Mapping the International Dimensions of the Nicaraguan Revolution</a>
    </li>
  </ul>

  <h2>Mentions, Courses, and Publications</h2>
  <ul class="post">
    <li class="post-title">
      <a href="https://newspaperwindows.wordpress.com/2016/01/27/how-to-make-palladio-even-better/">
      Some suggested improvements</a>
    </li>
    <li class="post-title">
      <a href="https://www.digitalcinemastudies.com/workshop-historical-network-research">
      Digital Cinema Studies Workshop</a>
    </li>
    <li class="post-title">
      <a href="http://www.nyam.org/events/event/digital-humanities-visualizing-data-workshop/">
      NYAM Workshop</a>
    </li>
    <li class="post-title">
      <a href="https://www.historians.org/annual-meeting/resources-and-guides/digital-history-at-aha16/getting-started-in-digital-history-workshop">
      AHA Workshop</a>
    </li>
    <li class="post-title">
      <a href="http://eh.bard.edu/portfolio/visualizing-complex-data-palladio-workshop/">
      Workshop at Bard</a>
    </li>
    <li class="post-title">
      <a href="http://www.library.ucla.edu/events/got-visualization-methods-mapping-data">
      UCLA Workshop</a>
    </li>
    <li class="post-title">
      Students at 
      <a href="https://www.dickinson.edu/news/article/1964/taming_the_digital_frontier">
      Dickinson College's Digital Boot Camp</a> created the 
      <a href="http://dh.dickinson.edu/vizbm/home">
      Visualizing Black Milwaukee</a> project using Palladio
    </li>
  </ul>  