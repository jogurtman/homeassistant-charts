/*
---------------------------------
SimpleBarPieCard.js - Version 1.0
---------------------------------
INSTALLATION:
Just put this file in your config/www/ (or homeassistant/www/) folder, then go to
Settings -> Dashboards -> three dots at top right -> Resources -> + Add resource -> /local/SimpleBarPieCard.js
After that, restart your system. Visual Editor is not supported!

This Add-On was originally designed for personal use only. 
Therefore, unfortunately, comments and good documentation are missing. 
The reason I created this is because I wanted to personalize the "energy-devices-graph" card
which is only shown in the "Energy" tab. Furthermore, the only reason I published this is
because I thought anyone would like to personilize that specfiic chart too.
This is the first .js script I have created. USE AT YOUR OWN RISK!
Here I explain at least some functions:

drawPie() draws the pie chart
drawBar() draws the bar chart with horizontal bars
  -> the only chart where icons are supported
drawVertBar() draws the bar chart with vertical lines

There is a "Tooltip-menue" that is shown for 3 seconds when you click on certain areas of the charts.

The charts don't care which unit they get. The unit is only for visual respresentation. This means
that, e.g., the bar of 1200Wh will be longer than the bar of 12kWh. I know this is logically wrong, 
but the charts only use the raw numbers (it is quite easy to change this either in the 
configuration.yaml or with a template).

Here is how you create a card (no visual editor supported):

type: custom:simple-bar-pie
title: My Chart
diagram_type: pie / bar / vertbar
entities:
  - entity: sensor.your_sensor1
    name: Custom Name
  - entity: sensor.your_sensor2
    name: Custom Name
  - entity: sensor.your_sensor3
    name: Custom Name

*/
class SimpleBarPieCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>
      .icon-container {
        position: absolute;
        pointer-events: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      ha-icon {
        width: 12px;
        height: 12px;
        position: absolute;
      }
    </style>
    <div id="wrapper" style="padding: 6px; text-align: center;">
      <h3 id="title" style="margin: 0 0 2px;"></h3>
      <div style="position: relative; width: 100%; max-width: 100%; overflow-x: auto;">
        <canvas id="diagram" style="width: 100%; height: auto;"></canvas>
        <div id="icons" class="icon-container"></div>
      </div>
      <div id="legend" style="margin-top: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: 0.85em;"></div>
      <div id="tooltip" style="position:absolute; display:none; background:#fff; border:1px solid #ccc; padding:5px; font-size:0.85em; pointer-events:none; z-index:10; transform: translate(-50%, -50%);"></div>
    </div>`;
  }

  set hass(hass) {
    const entities = this.config.entities || [];
    const type = this.config.diagram_type || "bar";
    const title = this.config.title || "";

    const wrapper = this.shadowRoot.getElementById("wrapper");
    const titleEl = this.shadowRoot.getElementById("title");
    const canvas = this.shadowRoot.getElementById("diagram");
    const ctx = canvas.getContext("2d");
    const tooltip = this.shadowRoot.getElementById("tooltip");
    const iconContainer = this.shadowRoot.getElementById("icons");
    const legend = this.shadowRoot.getElementById("legend");
    const ratio = window.devicePixelRatio || 1;

    const colorList = [
      "rgba(50, 100, 255, 0.6)", // blue
      "rgba(255, 100, 100, 0.6)", // light red
      "rgba(50, 255, 50, 0.6)", // green
      "rgba(10, 220, 220, 0.6)", // turquoise
      "rgba(200, 100, 255, 0.6)", // lila
      "rgba(255, 200, 50, 0.6)" // gold
    ];

    let data = entities.map((e, i) => ({
      name: e.name || e.entity,
      icon: e.icon || null,
	  iconColor: e.color || "rgba(0, 0, 0, 0.8)",
      value: parseFloat(hass.states[e.entity].state) || 0,
      unit: hass.states[e.entity].attributes.unit_of_measurement || "",
      color: colorList[i % colorList.length]
    }));

    data.sort((a, b) => b.value - a.value);

    titleEl.textContent = title;
    legend.innerHTML = "";
    if (type === "pie") {
      data.forEach((d, i) => {
        const item = document.createElement("div");
        item.style.cssText = "display:flex; align-items:center; cursor:pointer;";
        item.dataset.index = i;
        item.innerHTML = `
          <div style="width: 10px; height: 10px; background: ${d.color}; margin-right: 4px; border-radius: 50%;"></div>
          ${d.name} (${d.value.toFixed(1)} ${d.unit})`;
        item.addEventListener("click", () => {
          this.showTooltip(tooltip, `${d.name}: ${d.value} ${d.unit}`, canvas);
        });
        legend.appendChild(item);
      });
    }

    const resizeCanvas = () => {
      const containerWidth = canvas.parentElement.offsetWidth;
      const canvasWidth = containerWidth * ratio;
      const canvasHeight = (type === "pie" ? 220 : (type === "bar" ? data.length * 35 + 5 : 320)) * ratio;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = containerWidth + "px";
      canvas.style.height = canvasHeight / ratio + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === "pie") {
        this.drawPie(ctx, data, canvas);
      } else if (type === "bar") {
        this.drawBar(ctx, data, canvas, iconContainer);
      } else {
		this.drawVertBar(ctx, data, canvas);
	  }
    };

    new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
    resizeCanvas();

    if (type === "bar") {
      canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const barHeight = 20;
        const gap = 15;

        data.forEach((d, i) => {
          const barY = i * (barHeight + gap) + 5;
          if (y >= barY && y <= barY + barHeight) {
            this.showTooltip(tooltip, `${d.name}: ${d.value} ${d.unit}`, canvas);
          }
        });
      });
    } else if (type === "vertbar") {
      canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const barWidth = 30;
        const gap = 30;
        const leftMargin = 30;

        data.forEach((d, i) => {
          const barX = i * (barWidth + gap) + leftMargin;
          // Check if the click is within the x-range of a bar (with a slightly wider area)
          if (x >= barX - 5 && x <= barX + barWidth + 5) {
            this.showTooltip(tooltip, `${d.name}: ${d.value} ${d.unit}`, canvas);
          }
        });
      });
    }

  }

  showTooltip(tooltip, text, canvas) {
    tooltip.innerText = text;
    tooltip.style.left = `${canvas.offsetWidth / 2}px`;
    tooltip.style.top = `${canvas.offsetHeight / 2}px`;
    tooltip.style.display = "block";
    clearTimeout(this.tooltipTimer);
    this.tooltipTimer = setTimeout(() => tooltip.style.display = "none", 3000);
  }

  drawPie(ctx, data, canvas) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = 0;
    const cx = canvas.width / 2 / (window.devicePixelRatio || 1);
    const cy = canvas.height / 2 / (window.devicePixelRatio || 1);
    const r = Math.min(cx, cy) / 1.1;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    // const topTwo = sorted.slice(0, 2);

    data.forEach((d) => {
      const slice = (d.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.fillStyle = d.color;
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fill();
      // if (topTwo.some(t => t.name === d.name)) { // data of two biggest entities are printed on the pie
	  if ((d.value / total >= 0.125)) { // If an entity takes 1/8 of the pie chart, its data will be shown on the pie
        const midAngle = startAngle + slice / 2;
        const labelX = cx + Math.cos(midAngle) * (r / 1.5);
        const labelY = cy + Math.sin(midAngle) * (r / 1.5);
        ctx.fillStyle = "#333";
        ctx.font = "0.85em sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(d.value)} ${d.unit}`, labelX, labelY);
      }
      startAngle += slice;
    });
  }

  drawBar(ctx, data, canvas, iconContainer) {
    const maxValue = Math.max(...data.map(d => d.value)) || 1;
    const barHeight = 20;
    const gap = 15;
    const availableWidth = canvas.width / window.devicePixelRatio - 175;

    iconContainer.innerHTML = "";
    data.forEach((d, i) => {
      const y = i * (barHeight + gap) + 5;
      const barLength = (d.value / maxValue) * availableWidth;
      
      // Text positions
      const iconSpace = d.icon ? 20 : 0;
      const textX = 105 - iconSpace;
      
      // Draw the bar
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(110 + barLength, y);
      ctx.arcTo(110 + barLength + 5, y, 110 + barLength + 5, y + barHeight, 5);
      ctx.lineTo(110 + barLength, y + barHeight);
      ctx.lineTo(110, y + barHeight);
      ctx.closePath();
      ctx.fill();

      // Draw the name text
      ctx.fillStyle = "#333";
      ctx.font = "0.85em sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(d.name, textX, y + barHeight - 5);
      
      // Add icon if present
      if (d.icon) {
        const icon = document.createElement("ha-icon");
        icon.setAttribute("icon", d.icon);
		icon.style.color = d.iconColor || "rgba(0, 0, 0, 0.8)";
        
        // Position the icon to align with text and bar
        const iconY = y + (barHeight / 2) - 12; // Center vertically
        const iconX = textX + 1; // Position to right of text
        
        icon.style.left = `${iconX}px`;
        icon.style.top = `${iconY}px`;
        iconContainer.appendChild(icon);
      }
      
      // Draw the value text
      ctx.textAlign = "left";
      ctx.fillText(`${d.value.toFixed(1)} ${d.unit}`, 115 + barLength, y + barHeight - 5);
    });
  }

  drawVertBar(ctx, data, canvas) {
    const maxValue = Math.max(...data.map(d => d.value)) || 1;
    const barWidth = 30;
    const gap = 30;
    const availableHeight = canvas.height / window.devicePixelRatio - 110;
    const leftMargin = 30;
    
    // Draw horizontal grid lines (light gray)
    ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = 40 + (availableHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(canvas.width / window.devicePixelRatio - 20, y);
      ctx.stroke();
    }

    data.forEach((d, i) => {
      const x = i * (barWidth + gap) + leftMargin;
      const barHeight = (d.value / maxValue) * availableHeight;
      
      // Create a lighter version of the color
      const baseColor = d.color;
      const lighterColor = baseColor.replace('0.6)', '0.4)');
      
      // Draw rounded bar with border
      ctx.fillStyle = lighterColor;
      ctx.strokeStyle = baseColor.replace('0.6)', '0.9)');
      ctx.lineWidth = 1;
      
      const radius = 5; // Rounded corners radius
      const barX = x;
      const barY = availableHeight + 40 - barHeight;
      
      ctx.beginPath();
      // Top left corner
      ctx.moveTo(barX + radius, barY);
      // Top right corner
      ctx.lineTo(barX + barWidth - radius, barY);
      ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
      // Bottom right corner
      ctx.lineTo(barX + barWidth, barY + barHeight - radius);
      ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
      // Bottom left corner
      ctx.lineTo(barX + radius, barY + barHeight);
      ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
      // Top left corner
      ctx.lineTo(barX, barY + radius);
      ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
      
      ctx.fill();
      ctx.stroke();
      
      // Draw value on top of bar
      ctx.fillStyle = "#333";
      ctx.font = "0.85em sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${d.value.toFixed(1)} ${d.unit}`, x + barWidth / 2, availableHeight + 40 - barHeight - 5);
      
      // Draw rotated label directly under the x-axis
      ctx.save();
      ctx.translate(x + barWidth / 2 - 10, availableHeight + 47);
      ctx.rotate(Math.PI / 4); // Rotate in opposite direction
      ctx.textAlign = "left";
      ctx.fillText(d.name, 0, 0);
      ctx.restore();
    });
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("simple-bar-pie", SimpleBarPieCard);
