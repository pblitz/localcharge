# Wireframes

Textual/ASCII sketches for the single-page dashboard. Actual layout will use responsive CSS grid.

```
+--------------------------------------------------------------------------------+
| Header: LocalCharge logo | Scenario selector | Play/Pause | Speed | Save/Load  |
+--------------------------------------------------------------------------------+
| Charger Panel (left)            | EMS Panel (right)                               |
| - Status indicator              | - Site limit slider/input                       |
| - Start/Stop buttons            | - Strategy dropdown                             |
| - EV settings (target kW, SOC)  | - Decision log (latest actions)                 |
| - Session metrics               | - Active commands (SetChargingProfile, etc.)    |
+--------------------------------------------------------------------------------+
| Loads Panel (bottom left)                | Meter + Charts (bottom right)          |
| - List of loads w/ sliders               | - Gauge: total vs limit                 |
| - Add/remove load button                 | - Line chart: power over time           |
| - Schedule editor (modal)                | - Stacked area: EV vs other loads       |
+--------------------------------------------------------------------------------+
| Full-width Log Console (toggle)                                                |
| - Tabs: All / OCPP / Modbus / Warnings                                         |
| - Each entry expandable to show JSON payload                                    |
+--------------------------------------------------------------------------------+
```

Mobile/tablet layout stacks panels vertically:
1. Header controls
2. Charger card
3. EMS card
4. Loads
5. Charts
6. Log console (accordion)
