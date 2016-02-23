---
layout: home
permalink: /
title: "Palladio Resources"
image:
  feature: palladio.png

---

<div class="tiles">
{% for category in site.data.categories %}
	{% include category-grid.html %}
{% endfor %}
</div><!-- /.tiles -->
