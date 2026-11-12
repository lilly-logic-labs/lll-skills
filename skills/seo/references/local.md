# Local SEO

For businesses that serve customers in a place: shops, clinics, restaurants, trades, professionals, multi-location brands. Classify first, because it changes the checks.

## 1. Classify

| Type | Signals | Effect |
|---|---|---|
| Storefront | street address shown, map, "visit us" | full NAP and map checks |
| Service-area business | no public address, "serving [areas]", "we come to you" | hide the address on the profile, define service areas, skip map embed checks |
| Hybrid | showroom plus service area | both sets |
| Multi-location | several addresses | location page rules (section 5) |

Vertical (restaurant, healthcare, legal, home services, real estate, automotive, retail) selects the schema subtype and the directories (section 6).

## 2. Google Business Profile checklist

The profile drives most map-pack visibility. Score present and optimised = 2, present = 1, missing = 0 per row.

| Field | Optimised looks like |
|---|---|
| Primary category | the most specific true category ("Cosmetic dentist", not "Dentist"). Wrong primary category is the most damaging single mistake |
| Additional categories | a few relevant ones; none that are aspirational |
| Business name | exactly the real-world name on signage and documents. No keywords added |
| Address and phone | complete, matching the website; local number preferred |
| Website link | the home page or the location page |
| Hours | complete, including holiday hours; accurate hours matter because open-now influences results |
| Description | plain, specific, services and area; no promotions or links |
| Services and products | listed with short descriptions; prices where fixed |
| Photos | logo, cover, exterior, interior, team, work; add regularly; real, not stock |
| Attributes | accessibility, payments, amenities, identity attributes that apply |
| Service areas | named cities or postcodes for service-area businesses |
| Reviews | steady new reviews, owner replies to all, no gating |
| Posts, Q&A, booking link | useful, not required for ranking; keep Q&A answered if available |
| Verification, duplicates | verified; no duplicate or closed listings at the same address |

Owner-only: editing the profile, requesting verification, removing duplicates. Report them under Owner actions with the exact field and value.

## 3. Reviews

- Velocity and recency beat a one-off pile. A long gap with no new reviews hurts. Aim for a steady trickle.
- Ask every customer, with a short link or QR code. Do not pre-screen by sentiment ("review gating"), offer rewards for positive reviews, or write your own: all breach Google policy and consumer-protection rules.
- Reply to every review within a few days. For negative ones: acknowledge, offer a contact route, no argument.
- Regulated fields: do not confirm or deny that a reviewer was a patient or client in a reply (health privacy, legal confidentiality).
- Mark up reviews on your site only when they are real and visible; own-business star markup is not eligible for star results (`./schema.md`).

## 4. Name, address, phone consistency

Compare three sources: the visible page footer and contact page, the LocalBusiness JSON-LD, and the Business Profile. Then spot-check main directories. Differences in suite numbers, abbreviations ("St" vs "Street"), and old phone numbers are the usual causes. Fix the source of truth first, then the copies.

## 5. On-page local signals

- Title and H1 carry service plus place ("Emergency plumber in Pune | Brand").
- A dedicated page per core service. This is among the strongest local organic factors.
- Visible NAP in the footer and contact page, a `tel:` link for click to call, hours, an embedded map (lazy-load it).
- Local proof: named local projects, staff, area-specific testimonials, local FAQs, photos from the area.
- **Location pages (multi-location).** Unique, useful content for each: team, address, hours, parking and transport, local services and offers, reviews from that location. Swap test: if replacing the city name makes the page still read true for another city, it is a doorway page. Aim for most of the body to be unique to the location. Gates: warn at 30 or more location pages; stop and ask for justification at 50 or more (real presence, content plan, local profile for each).
- Structure: `/locations/<city>/` subdirectories, crawlable store locator with real URLs (not JS-only), each location linked from a locations hub and from the footer or a hub page.
- Internal links: hub to spokes, key pages within three clicks of home.

## 6. Schema

Use the most specific subtype; fall back to `LocalBusiness` only when none fits.

| Vertical | Types |
|---|---|
| Food | `Restaurant`, `CafeOrCoffeeShop`, `BarOrPub`, `Bakery`, `FastFoodRestaurant` |
| Health | `MedicalClinic`, `Hospital`, `Dentist`, `Physician` (with `Person`), `Pharmacy`, `Optician` |
| Legal | `LegalService` plus `Person`; `Attorney` is not the recommended type |
| Home services | `Plumber`, `Electrician`, `HVACBusiness`, `RoofingContractor`, `GeneralContractor`, `Locksmith`, `MovingCompany` |
| Real estate | `RealEstateAgent` |
| Automotive | `AutoDealer`, `AutoRepair`, `AutoPartsStore` |
| Other | `BeautySalon`, `DaySpa`, `ChildCare`, `FinancialService`, `FurnitureStore` and more under `LocalBusiness` |

Required: `name`, `address` (`PostalAddress` with street, locality, region, postal code, country). Recommended: `telephone`, `url`, `geo` (at least five decimal places), `openingHoursSpecification`, `image`, `priceRange`, `aggregateRating` only if reviews are shown. Service-area businesses add `areaServed`. Multi-location: one block per location page with its own `@id`, linked to the parent `Organization` with `parentOrganization`.

## 7. Citations and mentions

Tier 1: Google Business Profile, Bing Places (feeds ChatGPT, Copilot and others), Apple Business Connect / Apple Maps, Facebook, Yelp where relevant, the main data aggregators. Tier 2: industry directories (health: practitioner registries; legal: bar and law directories; trades: marketplace sites). Country directories matter (for India, for example, Justdial, Sulekha, IndiaMART for B2B). Chambers of commerce, trade bodies, local press and sponsorships give links and mentions. Citation volume matters less than accuracy and the quality of a few listings.

## 8. Maps rank tracking (optional, paid)

A geo-grid scan simulates local searches from a grid of points (for example 7 by 7 over 5 km) and shows where the business ranks. Share of local voice = points where the business is in the top 3 divided by all points, times 100. It costs API credits: show the estimate and get approval first. Free alternative for competitor discovery: OpenStreetMap Overpass and Nominatim for what is nearby. Without these, say live map-pack position was not measured.

## 9. Score and output

Weights (heuristic): Business Profile 25, reviews 20, on-page 20, NAP and citations 15, schema 10, links and local authority 10.

```
Local score xx/100 | type | vertical
Profile checklist | review snapshot (count, rating, last 90 days, reply rate) | NAP table (page / schema / profile)
Location page quality (unique share, swap test) | schema status with a ready block
Top 10 actions | Limits: no live pack position, no profile insights data
```

Lens `seo-local`. Link to `./geo-ai-search.md` for local AI answers: sources are mostly Bing, Yelp, review and directory pages, and Reddit, not the Business Profile itself.
