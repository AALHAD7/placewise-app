Guesstimate | Easy

# CHAI-NOMICS

Estimate the **Number of Cups of Tea** Consumed Daily in India

## FACTS/ASSUMPTIONS
1. Filter out by age group (10-65 years population)
2. Assume the daily drinking population factor (0.8 for urban and 0.7 for rural)
3. Break down Home drinkers and Outside sdrinkers
4. 60% and 85% Home drinkers for Urban and Rural Population respectively
5. 40% and 15% Outsiders drinkers for Urban and Rural Population respectively
6. Assume the daily average cups of tea drinking by all these groups
7. 3 cups, 2 cups, 1.5 cups, 1 cups per day respectively

## APPROACH
- Population (1400M)
  - Urban Population (400M)
    - Tea Drinking Age 10-65 (75%) 400*0.75=300M
      - Urban Eligible (80%) 300*0.8=240M
        - Home (60%) 240*0.6=144M
          - Avg. (3 cups/day) 144*3=432M/day
        - Outside (40%) 240*0.4=96M
          - Avg. (2 cups/day) 96*2=192M/day
  - Rural Population (1000M)
    - Tea Drinking Age 10-65 (75%) 1000*0.75=750M
      - Rural Eligible (70%) 750*0.7=525M
        - Home (85%) 525*0.85=445M
          - Avg. (1.5 cups/day) 445*1.5=670M/day
        - Outside (15%) 525*0.15=80M
          - Avg. (1 cups/day) 80*1=80M/day

Total Number of cups of Tea Consumed Daily in India = 432M + 192M + 670M + 80M = **1374M**

## BROWNIE POINTS
- **Lifestyle Breakdown:** Clarify tea drinking frequency by lifestyle.
- **Venue Split:** Recognize tea is both a home and out-of-home product.
- **Optional:** Could consider seasonal increase in winter or drop in summer.

## KEY LEARNINGS
- Adding layers like age, geography, and usage venue gives more realistic numbers
- Behavioral segmentation (e.g., where tea is consumed) adds depth
- In habit-based products, think in terms of occasions per day, not just users
