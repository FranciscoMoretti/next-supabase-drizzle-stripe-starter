<p align="center">
  <h1 align="center">next-supabase-stripe-starter</h1>
  <p align="center">
    <a href="https://twitter.com/KolbySisk"><img src="/delete-me/github-banner.png" /></a>
  </p>
</p>

<p align="center">
  <a href="https://twitter.com/kolbysisk" rel="nofollow"><img src="https://img.shields.io/badge/created%20by-@kolbysisk-e57060.svg" alt="Created by Kolby Sisk"></a>
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/kolbysisk/next-supabase-stripe-starter" alt="License"></a>
</p>

<p align="center">
  <a href="https://next-supabase-stripe-starter-demo-mnqz.vercel.app" style="font-weight: bold; font-size: 20px; text-decoration: underline;">See the demo</a>
</p>

## Introduction

Bootstrap your SaaS with a modern tech stack built to move quick. Follow the guide to get started.

### What's included

- Next.js 15
- [Supabase](https://supabase.com) - Postgres database & user authentication
- [Stripe](https://stripe.com) - [Checkout](https://stripe.com/docs/payments/checkout), [subscriptions](https://stripe.com/docs/billing/subscriptions/overview), and [customer portal](https://stripe.com/docs/customer-management)
- [React Email](https://react.email/) - Easily build emails and send them with [Resend](https://resend.com)
- [Tailwindcss](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Prebuilt accessible components
- Webhooks to automatically synchronize Stripe with Supabase
- Stripe fixture to bootstrap product data
- Supabase migrations to bootstrap and manage your db schema
- Responsive, performant, and accessible prebuilt pages
- Animated button borders! Now you can look cool without nerds saying you shipped too late

## Getting started

### 1. Deploy to Vercel with integrations

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolbySisk%2Fnext-supabase-stripe-starter&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,SUPABASE_DB_PASSWORD,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,RESEND_API_KEY&demo-title=AI%20Twitter%20Banner%20Demo&demo-url=https%3A%2F%2Fai-twitter-banner.vercel.app&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6)

1. Click the deploy button ⬆️
1. On the form create a new repo and add the Supabase integration (this creates a Supabase project and provisions all DB envs like `POSTGRES_URL` automatically)
1. Add the Resend API key from [resend.com/api-keys](https://resend.com/api-keys)
1. Add your Stripe keys from [stripe.com](https://stripe.com). For the webhook secret just put any value — we'll update it after configuring the webhook
1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal) and click the `Active test link` button
1. Click Deploy
1. After deploy, link your local repo to the Vercel project and pull envs to generate `.env.local`:

```
pnpm i -g vercel
vercel link
vercel env pull
```

![Vercel env config](/delete-me/deplyoment-env.png)

### 2. Setup Stripe Webhook

1. After deploying go to your Vercel dashboard and find your Vercel URL
1. Next go to your Stripe dashboard, click `Developers` in the top nav, and then the `Webhooks` tab
1. Add an endpoint. Enter your Vercel URL followed by `/api/webhooks`
1. Click `Select events`
1. Check `Select all events`
1. Scroll to the bottom of the page and click `Add endpoint`
1. Click to `Reveal` signing secret and copy it
1. Go to your `Vercel project settings` → `Environment Variables`
1. Update the value of the `STRIPE_WEBHOOK_SECRET` env with your newly acquired webhook secret. Press `Save`

### 3. Run database migrations (Drizzle)

Migrations are handled with Drizzle. Once `.env.local` exists (from `vercel env pull`) and includes `POSTGRES_URL`, run:

```
pnpm db:generate
pnpm db:migrate
```

### 4. Run Stripe Fixture

[Stripe fixtures](https://stripe.com/docs/cli/fixtures) are an easy way to configure your product offering without messing around in the Stripe UI.

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli#install). For Macs run: `brew install stripe/stripe-cli/stripe`
1. Run (make sure to update the command with your Stripe sk) `stripe fixtures ./stripe-fixtures.json --api-key UPDATE_THIS_WITH_YOUR_STRIPE_SK`

### 5. Last steps

1. Setup the Vercel branches redirect URLs for supabase auth https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
1. Do a `Search All` in your code editor for `UPDATE_THIS` and update all instances with the relevant value (**except for .env.local.example!**)
1. Delete the `delete-me` dir

### 6. Check it out!

You did it! You should be able to look in your Stripe dashboard and see your products, and you should also see the same data has been populated in your Supabase database. Now let's test everything.

1. Run `pnpm i`
1. Run `pnpm dev`.
1. Go to the app and click `Get started for free` - this will take you to the login page
1. We haven't configured auth providers, so for now click `Continue with Email` and submit your email address
1. Click the link sent to your email and you should be redirected back to your app - authenticated
1. Click `Get Started` on one of the plans. This will take you to a Stripe checkout page (In test mode)
1. Enter `4242424242424242` as your credit card number. Fill out the rest of the form with any valid data and click Subscribe
1. You should be redirect to the Account page where you can see your active subscription
1. Click the `Manage your subscription` button

**That's the end of the setup. The following are guides to help you code in your new codebase.**

---

## Guides

### Managing products

Your products and prices are managed via the `stripe-fixtures.json` file. You can delete your test data in Stripe on the [Developers page](https://dashboard.stripe.com/test/developers), make the changes you'd like, and then run the fixture command from above. When changes are made in Stripe the webhook hits the api route at `src/app/api/webhooks`. The handler will synchronize the data sent from Stripe to your Supabase database.

The `metadata` field in your fixture is where we can store info about the product that can be used in your app. For example, say you have a basic product, and one of the features of the product includes a max number of team invites. You can add a field to the metadata like `team_invites`. Then update the Zod schema in `src/features/pricing/models/product-metadata.ts`

Then you can make use of it like this:

```ts
const products = await getProducts();
const productMetadata = productMetadataSchema.parse(products[0].metadata); // Now it's typesafe 🙌!
productMetadata.teamInvites; // The value you set in the fixture
```

### Managing your database schema

Schema changes flow through Drizzle. Any changes you make should be reflected in `src/db/schema.ts`, then generated and applied.

Say you want to add a table named `invites`.

1. Update `src/db/schema.ts` to define your new table/columns
1. Generate SQL from the schema:

```
pnpm db:generate
```

1. Apply the migration to your Supabase Postgres:

```
pnpm db:migrate
```

### Configuring auth providers

There are many auth providers you can choose from. [See the Supabase docs](https://supabase.com/docs/guides/auth#providers) for the full the list and their respective guides to configure them.

### Styling

- [Learn more about shadcn/ui components](https://ui.shadcn.com/docs)
- [Learn more about theming with shadcn/ui](https://ui.shadcn.com/docs/theming)
- [Learn more about the Tailwindcss theme config](https://tailwindcss.com/docs/theme)

### Emails

Your emails live in the `src/features/emails` dir. Emails are finicky and difficult to style correctly, so make sure to reference the [React Email docs](https://react.email/docs/introduction). After creating your email component, sending an email is as simple as:

```ts
import WelcomeEmail from '@/features/emails/welcome';
import { resendClient } from '@/libs/resend/resend-client';

resendClient.emails.send({
  from: 'no-reply@your-domain.com',
  to: userEmail,
  subject: 'Welcome!',
  react: <WelcomeEmail />,
});
```

### File structure

The file structure uses **the** group by `feature` concept. This is where you will colocate code related to a specific feature, with the exception of UI code. Typically you want to keep your UI code in the `app` dir, with the exception of reusable components. Most of the time reusable components will be agnostic to a feature and should live in the `components` dir. The `components/ui` dir is where `shadcn/ui` components are generated to.

### Going live

Follow these steps when you're ready to go live:

1. Activate your Stripe account and set the dashboard to live mode
1. Repeat the steps above to create a Stripe webhook in live mode, this time using your live url
1. Update Vercel env variables with your live Stripe pk, sk, and whsec
1. After Vercel has redeployed with your new env variables, run the fixture command using your Stripe sk

---

## Support

If you need help with the setup, or developing in the codebase, feel free to reach out to me on Twitter [@kolbysisk](https://twitter.com/KolbySisk) - I'm always happy to help.

## Contribute

PRs are always welcome.

---

This project was inspired by Vercel's [nextjs-subscription-payments](https://github.com/vercel/nextjs-subscription-payments).
