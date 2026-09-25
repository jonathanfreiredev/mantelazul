# Privacy policy

Last updated: 25 September 2026

Mantel Azul is a personal, free recipe app. This page explains, in plain language, what personal
data it handles, why, who else sees it and what you can do about it. Mantel Azul is referred to
below as "we".

## Who is responsible

Jonathan Freire (Mantel Azul), based in Germany, is the controller for everything described here.

Email: jonathan.freireespinoza@gmail.com

## What we collect

### Your account

- Name and email address.
- Password, if you create one. It is stored hashed, so nobody can read it, including us.
- Whether your email address has been confirmed.
- Profile picture, if you sign in with Google.
- The household you belong to, if any.

### Signing in with Google

Google tells us your name, email address and profile picture. We never see your Google password. We
store the link between your Mantel Azul account and your Google account, together with the access
and refresh tokens Google returns for it.

### Sessions

Each sign-in creates a session that records an IP address, your browser's user agent and an expiry
date. It is what keeps you signed in, and what lets us end a session that looks compromised.

### What you create

- Recipes: title, description, ingredients, steps, photos, tags, times, nutrition figures and the
  language you wrote them in.
- Cookbooks, likes, and the meals in your calendar (date, servings and any note).
- Households you join or create, and the email addresses you invite to them.
- Your conversations with the recipe assistant.

### The AI features

- **Assistant**: the messages you send and any photo you attach are processed by OpenAI to produce
  the reply.
- **Dictation**: the recording goes to Groq to be turned into text. We do not keep the audio.
- **Recipes**: the text of a recipe is sent to OpenAI to generate the other language versions, and
  stored as an embedding in Chroma so the assistant can search by meaning.

These features are artificial intelligence. The assistant is an AI system, not a person, and the app
says so in the chat. Images it generates are labelled as AI-generated. The details are in the
[terms of use](/terms).

### Photos

Photos you upload, and images the assistant generates, are stored at Cloudinary and served from
public URLs. Treat any photo you upload as public.

### Emails

Verification, password reset and household invitation emails go through Resend, which therefore
handles the recipient address and the content of the message.

### Hosting

The app runs on Vercel, which processes every request and may keep access logs that include IP
addresses.

### Payments

There are none. The app is free and has no subscription, so we never handle payment or billing data.

## Why we process it, and on what legal basis

| Purpose                                                                                    | Legal basis                                    |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Creating and running your account, storing your recipes, calendar and chat                  | Art. 6(1)(b) GDPR: the service you asked for   |
| Confirming your email, resetting your password, sending invitations you trigger             | Art. 6(1)(b) and (f) GDPR                      |
| Keeping the service secure, preventing abuse, protecting the AI quota from being used up     | Art. 6(1)(f) GDPR: legitimate interest         |
| The optional AI features you start yourself                                                 | Art. 6(1)(b) GDPR                              |

We do not use your data for advertising, we do not profile you, and we do not sell data to anyone.

## Who else sees your data

These providers process data on our behalf, each for one job:

- Vercel (hosting, United States): every request, and access logs.
- Cloudinary (images, United States): the photos you upload and the images generated for you.
- Resend (email, United States): recipient addresses and the content of the emails listed above.
- Google (sign-in, United States): your name, email address and profile picture, if you choose this
  way in.
- OpenAI (AI, United States): your chat messages, attached photos, and recipe text for translation
  and image generation.
- Groq (dictation, United States): the audio recording, when you press the microphone.
- Chroma (semantic search, United States): recipe text, stored as embeddings.
- Our database provider: everything described above, in a managed PostgreSQL database.

We also disclose data where the law requires it.

## Transfers outside the EU

Most of these providers are in the United States. Where a provider is certified under the EU-US
Data Privacy Framework, the transfer rests on that adequacy decision; otherwise it rests on the
European Commission's standard contractual clauses. You can ask us for details.

## How long we keep it

- Account data: while your account exists, and no longer.
- Sessions: until they expire or you sign out.
- Chat conversations: until you or your account delete them.
- Recipes: see "Deleting your account" below.
- Emails: our email provider keeps its own delivery records, for a limited time.
- Server logs: a short period, set by the hosting provider.

## Cookies and local storage

There is no analytics, no advertising and no tracking. The only things stored in your browser are:

- A session cookie, without which you cannot stay signed in. Strictly necessary.
- Your language choice and your light or dark theme, so the app remembers them.

Because nothing here follows you around, you will not see a cookie banner.

## Your rights

Under the GDPR you can ask to access your data, correct it, delete it, restrict how it is used,
receive it in a portable format, or object to processing that rests on legitimate interest. Where
processing rests on your consent, you can withdraw it at any time.

You can also complain to a data protection supervisory authority: in Germany, the one responsible
for your federal state.

Write to jonathan.freireespinoza@gmail.com. We answer within one month.

## Deleting your account

You can delete your account yourself from your profile. That removes your sessions, your linked
accounts, your cookbooks, your chat conversations and the meals you created, drops your likes, and
deletes the recipes you had not published, together with their images. Invitations you sent that are
still pending are revoked, and the household keeps working for the people left in it.

Published recipes are not deleted. They stay as public content, without your name attached. If you
want them gone too, delete them before deleting the account.

You can also write to us and we will do it for you.

## Security

Passwords are stored hashed, traffic is encrypted in transit, and access to the database is
restricted. No system is perfect: if you think your account has been compromised, write to us.

## Children

The app is for people aged 16 and over. We do not knowingly hold data from anyone younger. If you
believe a child has created an account, write to us and we will remove it.

## Changes to this policy

If this policy changes, the date at the top changes with it. If the change is significant, we will
say so inside the app.

## Other sites

This policy covers Mantel Azul only. Other sites you reach from here are governed by their own
policies.
