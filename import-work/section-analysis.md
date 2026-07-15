# Northwell.edu Homepage — Section Analysis

Source: `import-work/northwell.html` (browser "Web Page, Complete" save of https://www.northwell.edu/)
Platform: Drupal + `nwhlit-*` web-component design system. Content is in the light-DOM slots of custom elements.

## Page metadata
- **Title:** Northwell Health
- **Description:** Northwell Health is New York's largest healthcare provider, serving NYC, Long Island and Westchester with compassionate care through research and innovation.
- **Canonical:** https://www.northwell.edu/ · **lang:** en

## Sections (top → bottom) and mapping to built EDS blocks

### 1. Header / nav  →  `header` block
- Logo (Northwell Health, horizontal). Utility row: **English** (lang), **Give a gift**, **Log in**, **Search**.
- Primary icon-nav: **Find & book care**, **Locations**, **Areas of care**, **Pay a bill**, **Patient portal**.
- On scroll it collapses to a compact bar: logo + **Find a doctor** + **Make an appointment**.

### 2. Hero  →  `hero.northwell` variant
- **H (display, condensed uppercase):** "Raising **health** for _more new yorkers_ than anyone" — "more new yorkers" is the accent-color highlight span.
- **Body:** "With more experts, deeper insights and newer breakthroughs, we're solving the greatest challenges in health care."
- **CTA (light-blue):** Find a doctor → `/find-care`
- **Image:** `web_Ethos_RADMED_Greenlawn-229_edit.jpg` (female clinician by MRI). Angled blue panel over right image.
- Fine print below hero: "Claim based on 2024 SPARCS data (Jan-Sept), inpatient and ambulatory surgery."

### 3. "I am looking to"  →  `icon-cards` block (3 up, colored circle icons, dividers)
| Icon | Heading (link) | Description | Href |
|---|---|---|---|
| cyan laptop+ | Book care now | We offer fast-track virtual or in-person visits for urgent, primary and specialty care. | /find-care |
| blue bill | Pay a bill | Make a secure online payment. | /manage-your-care/billpay |
| purple pin | Find a location | With over 900 locations, including hospitals and care centers, we're everywhere New Yorkers need us to be. | /doctors-and-care/locations |

### 4. MyNorthwell promo  →  `promo` block (text left, angled image right)
- **H (condensed uppercase):** "MyNorthwell is here"
- **Body:** "Introducing a new way to manage your care, connect with us and more. It's all part of a larger digital transformation to enhance your experience."
- **Buttons:** Log into MyNorthwell (primary) → /login · Learn more (secondary) → /patient-portal/mynorthwell
- **Image:** `web_AdobeStock_377842533_edit.jpg` (hand holding phone with MyNorthwell app).

### 5. "Our areas of care"  →  `cards.cards-areas` block (3-col, borderless, image + blue title)
Section heading + **View all** → /clinical-services. 9 cards:
| Title | Href | Image (alt) |
|---|---|---|
| Cancer Institute | cancer.northwell.edu | web_AdobeStock_498727657_retouched.jpg (nurse) |
| Obstetrics & gynecology | /obstetrics-and-gynecology | web_AdobeStock_122774933.jpg (mother + newborn) |
| Pediatrics | pediatrics.northwell.edu | Web_GettyImages-558946221.jpg (baby) |
| Orthopaedic Institute | /orthopaedic-institute | web_IMG_3132_edit_extended_RGB.jpg (woman stretching) |
| Institute for Neurology and Neurosurgery | /neurosciences | web_GettyImages-661788159.jpg (radiologist, brain scans) |
| Cardiovascular Institute | heart.northwell.edu | web_C47I4161.jpg (man jogging, HR monitor) |
| Katz Institute for Women's Health | /katz-institute-for-womens-health | web_2864379_NW_WomensHealth…jpg (angel-wings statue) |
| Spine Institute | spine.northwell.edu | LIJ-Spinal-Surgery-Media.jpg (surgeons) |
| Transplant Institute | transplant.northwell.edu | web_AdobeStock_505903501_edit.jpg (neuroscientist lab) |

### 6. Wait times  →  `wait-times` block (tabs + carousel of locations)
- Panel heading **Wait times**. Two tabs: **Urgent Care** (default) / **Emergency department**.
- Location cards show `<min> min` + location name + facility. **~60 GoHealth urgent-care locations** in a scrollable carousel (Astoria, Bellmore, Charleston, Eltingville, … each → gohealthuc.com/NORTHWELL/LOCATIONS/{name}).
- Actions: **Use my location** (geo) + **See all wait times** → /wait-times.
- NOTE: real page has far more locations than the 3 in the screenshot — the block already supports an arbitrary list.

### 7. "Most awarded" band  →  `section.accent` (gold band, blue text)
- **H:** "The Most Awarded Health System in the Tri-State Five Years in a Row"
- **Body:** "We're proud to have four hospitals recognized as best in the nation across 26 specialties by U.S. News & World Report—earning more rankings than any other health system in the tri-state."
- **Button:** Learn more → /news/the-latest/northwell-most-awarded…

### 8. "Breakthroughs & news"  →  `carousel` block (4-up news cards + arrows)
Section heading + subtext "Find out what's happening now at Northwell Health." + **View more** → /news/search. Cards:
| Title | Image | Href |
|---|---|---|
| Northwell hospitals recognized with Patient Safety Excellence Awards from Healthgrades | NEWS_orthopedist-patient-cast.jpg | /news/the-latest/six-northwell… |
| Healthgrades ranks Northwell hospitals in top 10% for specialty care | NEWS_petri-dish-blue.jpg | /news/the-latest/northwell-hos… |
| Northwell is most awarded NY tri-state health system by U.S. News | NEWS_Northwell-US-News-2025.jpg | /news/the-latest/northwell-mos… |
| Northwell opens $3.2M Molecular Diagnostics Laboratory | NEWS_northwell-opens-3-2M-molecular-diagnostics-laboratory.jpg | /news/the-latest/northwell-ope… |

### 9. "The Well" wellness articles  →  `carousel` block (2nd instance) — NOT in original screenshots
Wellness/editorial content from thewell/feinstein. Cards include:
| Title | Image | Href |
|---|---|---|
| Sepsis: The biggest threat you've never heard of | NEWS_petri-dish-blue.jpg (approx) | feinstein.northwell.edu/news/insights/sepsis… |
| 3 Diets That Can Improve Your Heart Health | TheWell_hearthealthy_AS_261480844.jpg | thewell… |
| A fresh new start with weight loss surgery | Web_Valdez_header.jpg | thewell… |

### 10. Gun-safety feature callout  →  `promo.blue` variant (image left, blue panel right)
- **H:** "One question can save a child's life"
- **Body:** "Every day, 13 kids are killed by firearms. But there is a way you can protect your child. Ask your family and friends if there's an unlocked gun in the house. It can save a life."
- **Link:** Learn more (triangle marker). **Image:** `TheWell_gun-safety-in-the-home_AS_501783988.jpg`.

### 11. Footer  →  `footer` block (charcoal, multi-column)
- Prominent phone **(888) 321-DOCS** → tel:+18883213627. Sub-text: "Our representatives are available … Monday through Friday 9am–5pm." + "For a Northwell ambulance, call (833) 259-2367."
- Columns: **Quick links** (Pay a bill, FollowMyHealth, For professionals, For physicians, Price transparency), **Connect** (Contact us, Ways to give, Volunteer, The Well by Northwell, Northwell Alumni Network), **About** (FAQ, Jobs, Newsroom, Northwell Health Physician Partners), **Employees** (For employees CTA).
- Social: Facebook, X, Instagram, LinkedIn, YouTube. Bottom: Corporate compliance · Notice of non-discrimination & accessibility · Privacy policies & disclaimers.
- Copyright: "© Copyright 2026 Northwell Health. As an official 501(c)(3) nonprofit organization, your gift is tax-deductible as allowed by law."

## Gaps vs. the blocks already built
- **All 10 content sections map onto blocks already created** from the screenshots. ✓
- **New finding — "The Well" wellness carousel** (section 9) is a *second* `carousel` instance; no new block needed.
- **Wait-times** needs to support ~60 locations (carousel already handles arbitrary count) and a geolocation "Use my location" action (currently a plain link — acceptable for static import).
- **Header utility row** (English / Give a gift / Log in / Search) and the scroll-collapse compact state are richer than the base nav; can be refined during header instrumentation.
- Hero highlight word markup: original uses a `<span class="highlight">`; our block reads `<em>` for the accent phrase and `<code>`/`<mark>` for the boxed word — parser should map accordingly.
