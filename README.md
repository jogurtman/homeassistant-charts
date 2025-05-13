# SimpleBarPieCard.js for HomeAssistant
![SimpleBarPieCard](https://github.com/user-attachments/assets/c2992bb5-c4aa-48b5-b73f-cb87c736cbfc)

## Installation
Upload the **SimpleBarPieCard.js** file to your **config/www/** (or **homeassistant/www/**) folder, then go to

*Settings* -> *Dashboards* -> three dots at top right -> *Resources* -> *+ Add resource* -> /local/SimpleBarPieCard.js

After that, restart your system and start creating charts!
The visual Editor is not supported, see [how to create a chart](#chart-types-and-how-to-create-them)

## Feel free to contribute!
Let's upgrade this addon together.

## Disclaimer
This Add-On was originally designed for personal use only. 
Therefore, unfortunately, comments and good documentation are missing.
The reason this was created is because I wanted to personalize the "energy-devices-graph" card
which is only shown in the "Energy" tab. Furthermore, the only reason I have published this is
because I thought anyone would like to personilize that specific chart too.
This is my first .js script. USE AT YOUR OWN RISK!

The charts don't care which unit they get. The unit is only for visual respresentation. This means
that, e.g., the bar of 1200Wh will be longer than the bar of 12kWh. I know this is logically wrong, 
but the charts only use the raw numbers (it is quite easy to change this either in the 
configuration.yaml or with a template).

## Chart types and how to create them
Since the visual editor is not supported, you have to manually write the YAML-Code.
You can add as many sensors as you want!
Here is how:

### Horizontal bar chart
The horizontal bar chart supports colored icons!

![Horizontal bar chart](https://github.com/user-attachments/assets/676fe5eb-4e88-4281-b3cb-2bff6425b32c)
```
type: custom:simple-bar-pie
title: My horizontal bar chart
diagram_type: bar
entities:
  - entity: sensor.sensor1
    name: Dryer
    icon: mdi:tumble-dryer
    color: orange
  - entity: sensor.sensor2
    name: Dishwasher
    icon: mdi:dishwasher
    color: blue
  - entity: sensor.sensor3
    name: Washer
    icon: mdi:washing-machine
    color: green
```

### Vertical bar chart
![Vertical bar chart](https://github.com/user-attachments/assets/dfc75734-4950-40be-b3d1-623aabad3958)
```
type: custom:simple-bar-pie
title: My vertical bar chart
diagram_type: vertbar
entities:
  - entity: sensor.your_sensor1
    name: Custom Name
  - entity: sensor.your_sensor2
    name: Custom Name
  - entity: sensor.your_sensor3
    name: Custom Name
```

### Pie chart
![Pie chart](https://github.com/user-attachments/assets/6111f466-e469-44d9-99c2-41c46e263537)
```
type: custom:simple-bar-pie
title: My pie Chart
diagram_type: pie
entities:
  - entity: sensor.your_sensor1
    name: Custom Name
  - entity: sensor.your_sensor2
    name: Custom Name
  - entity: sensor.your_sensor3
    name: Custom Name
```
Note: Relatively small numbers (in comparison to the total values) are not shown on the pie. That's why, e.g., the green segment intentionally has no number.
