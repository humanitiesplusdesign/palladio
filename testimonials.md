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