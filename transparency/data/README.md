# transparency/data

Data files for the unpublished transparency section. The pages render whatever is here;
no figure on any page is hard-coded. Keep every value traceable to a record.

## register.json

`certificates` is empty until a certification body issues the first CDSW certificate.
Each entry:

| field | type | notes |
|---|---|---|
| `cert_id` | string | as printed on the certificate, e.g. issued by the CB |
| `holder` | string | legal entity, not a brand |
| `service` | string | the named service assessed |
| `scope` | string | profile and boundary, including exclusions |
| `level` | `"L1"` \| `"L2"` \| `"L3"` | L1 Baseline, L2 Standard, L3 Advanced |
| `certification_body` | string | the accredited body that issued it |
| `edition` | string | CDSW edition audited against |
| `issued` | `YYYY-MM-DD` | |
| `valid_to` | `YYYY-MM-DD` | |
| `status` | `"valid"` \| `"suspended"` \| `"withdrawn"` \| `"expired"` | withdrawn/suspended entries stay listed |
| `status_changed` | `YYYY-MM-DD` | optional, date of the last status change |

A status of `valid` whose `valid_to` has passed is displayed as expired automatically.

## commons.json

Every amount is in EUR. `null` means "not yet published" and renders as "To be confirmed",
never as zero. Only enter money actually received and booked, with the date.
- `income_by_source`: `[{ "source": "...", "amount": number|null }]`
- `spend_by_category`: `[{ "category": "...", "amount": number|null }]`
- `received`: `[{ "date": "YYYY-MM-DD", "from": "...", "type": "...", "amount": number, "purpose": "..." }]`
  Individual donors are never named: use "Individual donations (aggregated)".
- `members`: counts by category, `null` until published.
