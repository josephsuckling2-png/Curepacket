# Put CurePacket online

This is the click-through for the owner. You do not need to use a terminal. Render connects to the GitHub account you already use.

When the deploy finishes you get a website, a database, and a demo login so you can try the product.

Prices below were copied from [Render’s pricing page](https://render.com/pricing) on **24 September 2026**. Open that page before you pay. Render changes prices, and this file will not update itself.

## What you will pay

The Blueprint file (`render.yaml`) picks the website, the database, and a monthly scan job:

| Piece | Plan in the Blueprint | Price on 24 Sep 2026 | What you get |
| --- | --- | --- | --- |
| Website | Standard | **$25 per month** | 2 GB memory, 1 CPU |
| Database | Basic-256mb | **$6 per month** | 256 MB memory, 100 connections, **1 GB storage included** |
| Monthly scan job | Standard cron | **$0.00058 per minute** while it runs | 2 GB memory, 1 CPU. It runs on the 1st of each month |
| Render account (Hobby) | Hobby | **$0 per month** | Enough for one owner |

**About $31 per month** for the website and database, before extras. The monthly scan job is extra, and only for the minutes it is actually running. On 24 Sep 2026 the Standard cron rate was **$0.00058 per minute**. A short monthly run is well under a dollar. The job uses Standard (2 GB) because the scan browser does not fit in the 512 MB Starter cron (**$0.00016 per minute**).

Extras the pricing page lists for a Hobby workspace:

- Bandwidth: **5 GB included** each month, then **$0.15 per GB**.
- Builds: **500 minutes included** each month, then **$5 per 1,000 minutes**. The first deploy is the slow one, because the image includes the browser used for scans.
- Extra database storage: **$0.30 per GB per month** after the included 1 GB.
- Custom domain: **2 included**, then **$0.25 per domain per month**.
- A persistent disk on a web service, if you ever add one: **$0.25 per GB per month**. This deploy does not add one. PDFs are built when you click download.

Why not the free plans:

- **Free website** is $0 and has **512 MB** of memory. It also sleeps when nobody is visiting. The scan browser does not fit in 512 MB, so a live scan dies. **Starter** is **$7 per month** and is also **512 MB**. The Blueprint uses Standard (2 GB) so a scan of the sample site can finish.
- **Free database** is $0 and **expires 30 days** after you create it. You then have **14 days** to upgrade. After that Render **deletes the database and the data**. Free databases also have **no backups**. The Blueprint uses the $6 plan so the cases you type in are still there next month.

Confirm the numbers on [https://render.com/pricing](https://render.com/pricing) the day you deploy.

## Before the clicks

1. This repository’s `main` branch on GitHub must contain `render.yaml` and the `Dockerfile`. If those files are only on a pull request, merge that pull request first.
2. Open [https://dashboard.render.com](https://dashboard.render.com) and sign in with **GitHub**. When GitHub asks, allow Render to see this repository.

## Clicks on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +**.
3. Click **Blueprint**.
4. Choose this GitHub repository and confirm.
5. Render reads `render.yaml` and lists a website named `curepacket` and a database named `curepacket-db`. Leave the fields as they are. You do not paste a database password or a secret — Render creates `AUTH_SECRET` for you.
6. Click **Deploy Blueprint** (some accounts show **Apply**).
7. Wait. The first build often takes a while because it downloads Chromium. The website is ready when its status is **Live**.
8. Open the **curepacket** website (not the database). The address at the top looks like `https://curepacket.onrender.com`.
9. Open that address. You should see the CurePacket home page.
10. Go to **Sign in**.
11. Email `demo@curepacket.dev`, password `demo1234`. Or click **Continue as demo agency**.
12. Open **Northwind Provisions**. The fix board, PDF download, and a scan of the built-in sample site all run on this deploy.

If Render says the name `curepacket` is already taken, edit `render.yaml` on `main` and change `name: curepacket` under the website to something unique, such as `curepacket-harbor`. Save that to `main`, then start the Blueprint again.

## The website address (you do not paste it)

Render sets an address like `https://curepacket.onrender.com` and stores it as `RENDER_EXTERNAL_URL`. When the container starts, the app copies that into the sign-in address and the Stripe return address. Leave `AUTH_URL`, `APP_URL`, and `NEXT_PUBLIC_APP_URL` empty on the first deploy.

Add your own domain later:

1. Website → **Settings** → **Custom Domains**. Add the domain and follow Render’s DNS instructions at your registrar.
2. Website → **Environment**.
3. Add `AUTH_URL` and `APP_URL`. Set both to the full address, for example `https://app.yourstudio.com`, with no slash at the end.
4. Save. Render redeploys.

## Turn the demo login off

The demo agency exists so you can try the product on day one. The password `demo1234` is also written in this repository. **Do not store real client letters in the demo account.**

When you have clicked around enough:

1. On the live site, open **Create an account** and make your own agency. Use that login for real work.
2. In Render, open the **curepacket** website.
3. Click **Environment**.
4. Change `SEED_DEMO` from `true` to `false`.
5. Save so Render redeploys.

New deploys will stop resetting the demo password. The demo user can still sign in with `demo1234` until you simply stop using it. Keep client work on the account you created.

To turn the sample data back on for a test, set `SEED_DEMO` to `true` and redeploy. That resets the demo password to `demo1234`.

## What visitors can do without you

Anyone can open **Create account**, enter an agency name, their name, email, and a password, and get an empty workspace. That account does not include the demo cases.

Scans and packet downloads on a case stay locked until that case’s packet fee is recorded. The default fee is **$750**. If the agency plan is active, every case is unlocked and the per-case fee is not required. Monitoring is separate: **$49 per month per site**. The Blueprint’s monthly job rescans sites with an active monitoring subscription. When it finds new critical or serious issues, it saves them and shows a notice on the desk. If email is set up, it also sends that summary.

With no Stripe keys, the pay button records a practice payment and unlocks that case. No card is charged. With no mail key, signup does not wait for an email confirmation.

The sample Northwind case on the demo login is marked as a practice payment so you can still open its board and packet. A case you create yourself is locked until you use the pay button.

## Email and the admin page (optional, add later)

In Render, open the **curepacket** website → **Environment** → **Add Environment Variable**.

| Name | What to put | What happens if you skip it |
| --- | --- | --- |
| `RESEND_API_KEY` | The API key from [resend.com](https://resend.com) | No email is sent. Signup skips confirmation. Notices still show on the desk. The same key can be named `AUTH_RESEND_KEY`. |
| `EMAIL_FROM` | A from-address Resend will send as, such as `CurePacket <notifications@yourstudio.com>` | The app uses `CurePacket <onboarding@resend.dev>`. Resend only delivers that test sender to the email on your Resend account until you verify a domain. |
| `ADMIN_EMAIL` | The email you use to sign in. More than one address is allowed, separated by commas. | The Admin page stays closed. |
| `STRIPE_AGENCY_PLAN_PRICE_ID` | A Stripe Price id for an agency-wide subscription, if you sell one | There is no agency-plan Checkout. Each case uses the packet fee. In practice mode (no Stripe secret), the billing page can still turn a practice agency plan on and off. |

Add `RESEND_API_KEY` and `EMAIL_FROM` on the **curepacket-monitor** job as well if you want the monthly scan to email you. The website and the job do not share variables automatically.

Mail the app can send: a confirmation link for a new signup, a welcome note, a payment receipt link, a “packet ready” note, and a monitoring alert. Each one includes the product disclaimer.

Open **Admin** from the desk after `ADMIN_EMAIL` matches your sign-in email. It lists signups, paid cases (including practice payments), active monitoring subscriptions, and monthly recurring revenue from those rows. Packet fees are one-time, so they are not part of that monthly number.

## Stripe, when you want to charge

With no Stripe keys, the Billing page records a practice payment and does not contact Stripe. That is normal.

When you are ready, make a Stripe account and stay in **Test mode** until a payment looks right. Then, in Render, open the website → **Environment** → **Add Environment Variable**.

| Variable | Where to copy it | Do you need it? |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key (`sk_test_…` or `sk_live_…`) | Yes, to turn on Checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → Signing secret (`whsec_…`) | Yes, so a paid invoice is marked paid |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → Publishable key (`pk_test_…` or `pk_live_…`) | Add it with the secret key. Hosted Checkout uses the secret key on the server; keep the publishable key next to it |
| `STRIPE_PACKET_PRICE_ID` | Leave blank unless you already made a price | No |
| `STRIPE_MONITORING_PRICE_ID` | Leave blank unless you already made a price | No |
| `STRIPE_AGENCY_PLAN_PRICE_ID` | Optional Stripe Price for an agency-wide plan. While that subscription is active, scans and exports do not need the per-case fee | No |

You do not create products by hand. The first Checkout creates them if those price variables are empty:

- One-time packet fee, default **$750**, lookup key `curepacket_packet_fee`
- Monitoring, **$49 per month**, lookup key `curepacket_monitoring_monthly`

A developer can also run `npm run stripe:setup` on a machine that has `STRIPE_SECRET_KEY` set. It prints the two price IDs. Pasting them into Render is optional. If the agency’s packet fee is not the same dollar amount as that price, Checkout charges the case’s own fee instead of the stored price.

### Webhook URL

In Stripe: **Developers → Webhooks → Add endpoint**.

- URL: `https://YOUR-SITE.onrender.com/api/stripe/webhook`  
  Example: `https://curepacket.onrender.com/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `payment_intent.payment_failed`

Put the signing secret in `STRIPE_WEBHOOK_SECRET` and save the environment so Render redeploys.

Test mode and live mode use different keys and a different webhook secret. Switch all three (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) together. The path stays `/api/stripe/webhook`.

## If something looks wrong

- **Logs**: open the website in Render and click **Logs**. You want a line that says migrations ran, then “Starting CurePacket”.
- **Demo login says the user is missing**: `SEED_DEMO` is not `true`. Set it to `true`, save, wait until the deploy is Live, and sign in.
- **Scan fails immediately**: the website must be on the Standard plan (2 GB). Free and Starter are 512 MB.

## What is stored

Cases, notes, and the list of findings are in the Postgres database. A PDF or ZIP is created at the moment you click download and is not kept as a file on the server. A screenshot taken during a scan sits on that server’s temporary disk and can vanish the next time Render deploys. The finding text stays in the database.
